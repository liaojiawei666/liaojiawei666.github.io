---
title: 如何新增一篇内容
description: 项目、日志、随记的创建方法和字段说明。
type: page
sidebar:
  order: 1
---

所有公开内容都位于 `src/content/docs/`，使用 Markdown 或 MDX 编写。

## 新增项目

在 `src/content/docs/projects/` 中创建项目目录：

```text
projects/
└── my-project/
    ├── index.md
    ├── architecture.md
    └── changelog.md
```

项目首页示例：

```yaml
---
title: 项目名称
description: 一句话介绍
type: project
status: active
pubDate: 2026-07-26
tags:
  - Astro
repository: https://github.com/user/repo
demo: https://example.com
---
```

## 新增日志

在 `src/content/docs/logs/年/月/` 下创建 Markdown：

```yaml
---
title: 日志标题
description: 日志摘要
type: log
pubDate: 2026-07-26
tags:
  - 标签
---
```

## 新增随记

在 `src/content/docs/notes/主题/` 下创建 Markdown：

```yaml
---
title: 随记标题
type: note
pubDate: 2026-07-26
tags:
  - 标签
---
```

## 保存草稿

在页面元数据中加入：

```yaml
draft: true
```

草稿可以在本地开发环境中查看，但不会出现在正式构建和搜索结果里。

## 本地预览

```bash
pnpm dev
```

## 插入 draw.io 图表

将可编辑源文件保存在 `src/diagrams/`：

```text
src/diagrams/os/process.drawio
```

开发服务器运行期间，保存源文件会自动生成：

```text
public/diagrams/os/process.drawio.svg
```

在 Markdown 中直接引用生成的 SVG：

```md
![进程状态转换图](/diagrams/os/process.drawio.svg)
```

不需要手动执行导出操作。生成的 SVG 内嵌 draw.io 数据，仍可重新打开编辑。

完成后运行：

```bash
pnpm build
```
