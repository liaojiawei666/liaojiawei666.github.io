import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import starlightGiscus from 'starlight-giscus';
import drawioDiagrams from './scripts/drawio-diagrams.mjs';

export default defineConfig({
  site: 'https://liaojiawei666.github.io',
  output: 'static',
  redirects: {
    '/': '/projects/riscv-rust-os/01-overview/',
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
  vite: {
    plugins: [drawioDiagrams()],
  },
  integrations: [
    starlight({
      plugins: [
        starlightGiscus({
          repo: 'liaojiawei666/liaojiawei666.github.io',
          repoId: 'R_kgDORJXaAg',
          category: 'Announcements',
          categoryId: 'DIC_kwDORJXaAs4DB_bk',
          mapping: 'pathname',
          reactions: true,
          inputPosition: 'bottom',
          theme: 'preferred_color_scheme',
          lazy: true,
        }),
      ],
      title: '廖家伟的技术手记',
      description: '记录项目、开发日志与日常随记的个人知识站。',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/liaojiawei666',
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/liaojiawei666/liaojiawei666.github.io/edit/main/',
      },
      customCss: ['katex/dist/katex.min.css', './src/styles/custom.css'],
      lastUpdated: true,
      pagination: true,
      credits: true,
      titleDelimiter: '·',
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#0f766e',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'alternate',
            type: 'application/rss+xml',
            title: '廖家伟的技术手记',
            href: '/rss.xml',
          },
        },
      ],
      sidebar: [
        {
          label: '项目',
          items: [
            {
              label: '从零开发一个操作系统（RISC-V + Rust）',
              collapsed: false,
              items: [
                {
                  label: '第一章：概述',
                  link: '/projects/riscv-rust-os/01-overview/',
                },
                {
                  label: '第二章：特权级与系统调用',
                  link: '/projects/riscv-rust-os/02-privilege-levels/',
                },
                {
                  label: '第三章：时钟中断与任务调度',
                  link: '/projects/riscv-rust-os/03-timer-interrupt-and-scheduling/',
                },
                {
                  label: 'RISC-V 核心手册',
                  link: '/projects/riscv-rust-os/riscv-introduction/',
                },
              ],
            },
          ],
        },
        {
          label: '日志',
          items: [
            {
              label: '2026-08-15 傅里叶变换',
              link: '/logs/2026-08-15-fourier-transform/',
            },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});
