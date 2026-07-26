---
title: 重建个人技术手记
description: 从 Hexo 迁移到 Astro Starlight，并建立新的内容结构。
type: log
pubDate: 2026-07-26
tags:
  - Astro
  - Starlight
  - GitHub Pages
sidebar:
  order: 1
---

**发布日期：** 2026-07-26  
**标签：** Astro、Starlight、GitHub Pages

原来的站点采用 Hexo 默认主题，仅包含一篇示例文章。随着内容目标逐渐明确，传统博客结构已经不再完全适合“项目、日志、随记”并存的需求。

## 为什么重新设计

希望新的站点更接近一本持续更新的在线技术书：

- 左侧可以浏览完整内容树。
- 正文区域保持安静、清晰。
- 右侧显示当前文章目录。
- 每一页都能被全文搜索。
- 项目可以拥有多篇相互关联的文档。

## 为什么选择 Starlight

Starlight 基于 Astro，已经提供文档站需要的导航、目录、搜索、代码高亮、深色模式和响应式布局。

相比从头开发这些基础设施，可以把更多精力放在内容本身。

## 发布流程

```text title="发布流程"
编辑 Markdown
    ↓
提交并推送到 main
    ↓
GitHub Actions 构建 Astro
    ↓
发布到 GitHub Pages
```

## 后续计划

1. 用真实项目替换演示项目。
2. 持续补充开发日志。
3. 把常用命令和零散经验整理到随记。
4. 根据内容规模继续优化归档和标签页面。
