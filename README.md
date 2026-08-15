# 廖家伟的技术手记

基于 Astro 与 Starlight 的个人知识站，用于记录项目、开发日志和日常随记。

## 目录

```text
src/content/docs/
├── projects/
│   └── riscv-rust-os/  从零开发一个操作系统（RISC-V + Rust）
├── logs/               日志
└── notes/              随记
```

## 开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

构建结果输出到 `dist/`。

## draw.io 图表

可编辑源文件放在 `src/diagrams/`。运行 `pnpm dev` 后，保存 `.drawio`
文件会自动生成对应的 `public/diagrams/*.drawio.svg`，并刷新本地页面。

例如：

```text
src/diagrams/os/process.drawio
→ public/diagrams/os/process.drawio.svg
→ /diagrams/os/process.drawio.svg
```

也可以运行 `pnpm diagrams:sync` 手动检查所有图表是否已同步。生成的 SVG
包含原始图表数据，可以重新用 draw.io 打开编辑。

## 发布

推送到 `main` 分支后，GitHub Actions 会自动构建并发布到：

<https://liaojiawei666.github.io>
