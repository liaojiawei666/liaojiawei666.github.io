import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const astroEntry = resolve(projectRoot, 'node_modules/astro/bin/astro.mjs');
const statePath = resolve(projectRoot, '.astro/managed-server.json');
const action = process.argv[2];
const extraArgs = process.argv.slice(3);
const isCodexSandbox = Boolean(process.env.CODEX_PERMISSION_PROFILE);

function stopCodexManagedDevServer() {
  const result = spawnSync(process.execPath, [astroEntry, 'dev', 'stop'], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error('无法停止由 Codex 管理的 Astro 开发服务。');
  }
}

function readState() {
  if (!existsSync(statePath)) return null;
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

function clearState() {
  rmSync(statePath, { force: true });
}

function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function belongsToProject(pid) {
  if (process.platform === 'win32') {
    const escapedRoot = projectRoot.replaceAll("'", "''");
    const command =
      `$p=Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\"; ` +
      `if($p -and $p.CommandLine -like '*${escapedRoot}*' -and $p.CommandLine -match 'astro(\\.mjs)?\\s+(dev|preview)'){ exit 0 }; exit 1`;
    return spawnSync('powershell.exe', ['-NoProfile', '-Command', command]).status === 0;
  }

  const result = spawnSync('ps', ['-p', String(pid), '-o', 'command='], {
    encoding: 'utf8',
  });
  return (
    result.status === 0 &&
    result.stdout.includes(projectRoot) &&
    /astro(?:\.mjs)?\s+(dev|preview)/.test(result.stdout)
  );
}

async function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isAlive(pid)) return true;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  return !isAlive(pid);
}

async function stopServer() {
  const state = readState();
  if (!state) {
    clearState();
    if (isCodexSandbox) {
      stopCodexManagedDevServer();
      return;
    }
    console.log('没有由项目脚本管理的运行中服务。');
    return;
  }

  if (state.projectRoot !== projectRoot) {
    throw new Error('PID 文件不属于当前项目，拒绝停止进程。');
  }

  if (!isAlive(state.pid)) {
    clearState();
    console.log('服务已经停止，已清理过期 PID 文件。');
    return;
  }

  if (!belongsToProject(state.pid)) {
    throw new Error('PID 已被其他进程占用，拒绝停止不属于当前项目的进程。');
  }

  process.kill(state.pid, 'SIGTERM');
  if (!(await waitForExit(state.pid, 5000))) {
    process.kill(state.pid, 'SIGKILL');
    await waitForExit(state.pid, 2000);
  }

  if (isAlive(state.pid)) {
    throw new Error(`无法停止项目服务（PID ${state.pid}）。`);
  }

  clearState();
  console.log(`已停止项目服务（PID ${state.pid}）。`);
}

async function startServer(mode) {
  const existing = readState();
  if (existing && isAlive(existing.pid)) {
    throw new Error(
      `已有项目服务正在运行（PID ${existing.pid}），请先执行 pnpm stop。`,
    );
  }
  clearState();

  if (!existsSync(astroEntry)) {
    throw new Error('找不到 Astro，请先安装项目依赖。');
  }

  const child = spawn(process.execPath, [astroEntry, mode, ...extraArgs], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });

  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(
    statePath,
    `${JSON.stringify(
      {
        pid: child.pid,
        mode,
        projectRoot,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );

  const forwardSignal = (signal) => {
    if (isAlive(child.pid)) process.kill(child.pid, signal);
  };
  process.once('SIGINT', () => forwardSignal('SIGINT'));
  process.once('SIGTERM', () => forwardSignal('SIGTERM'));

  const { code, signal } = await new Promise((resolveExit, rejectExit) => {
    child.once('error', rejectExit);
    child.once('exit', (exitCode, exitSignal) =>
      resolveExit({ code: exitCode, signal: exitSignal }),
    );
  });

  const latest = readState();
  if (latest?.pid === child.pid) clearState();

  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
}

try {
  if (action === 'stop') {
    await stopServer();
  } else if (action === 'dev' || action === 'preview') {
    await startServer(action);
  } else {
    throw new Error('用法：node scripts/project-server.mjs <dev|preview|stop>');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
