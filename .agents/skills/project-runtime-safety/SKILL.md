---
name: project-runtime-safety
description: Prevent AI agents from leaving this Astro project's development or preview server running. Use for any task in this repository that considers running pnpm dev, pnpm start, pnpm preview, astro dev, astro preview, browser-based local testing, or another long-lived project process.
---

# Project Runtime Safety

Prefer static checks such as `pnpm build`. Do not start this project merely to inspect content, validate Markdown, export diagrams, or confirm compilation.

## Runtime rule

- Do not run `pnpm dev`, `pnpm start`, `pnpm preview`, `astro dev`, `astro preview`, or an equivalent long-lived command in the AI sandbox by default.
- Do not launch the project in the background with an untracked shell process.
- Start a server only when the user explicitly requests live browser testing or a static build cannot verify the required behavior.
- Bind to `127.0.0.1`; do not expose the server on `0.0.0.0` unless the user explicitly requests it.

## Required exception workflow

When a live server is unavoidable:

1. Run `pnpm stop` first to clear a previously managed instance.
2. Start only through `pnpm dev --host 127.0.0.1` or `pnpm preview --host 127.0.0.1`. These commands record the Astro process PID.
3. Keep track of the terminal or execution session that started it.
4. Perform the minimum required live check.
5. In a `finally`-style cleanup step, run `pnpm stop` before ending the task, even after a failed test or interrupted command.
6. Run `pnpm stop` once more to verify that no managed service remains. Report the shutdown to the user.

If a prior turn was interrupted after startup, make `pnpm stop` the first action in the next turn.

Never stop a process by port number or broad process-name matching. The project stop command validates the recorded PID and command line before terminating it.
