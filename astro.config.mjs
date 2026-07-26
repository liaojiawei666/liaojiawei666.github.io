import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import starlightGiscus from 'starlight-giscus';
import drawioDiagrams from './scripts/drawio-diagrams.mjs';

export default defineConfig({
  site: 'https://liaojiawei666.github.io',
  output: 'static',
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
      customCss: ['./src/styles/custom.css'],
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
            { label: '概览', link: '/projects/' },
            {
              label: '个人技术手记',
              link: '/projects/personal-knowledge-base/',
              badge: { text: '进行中', variant: 'tip' },
            },
          ],
        },
        {
          label: '日志',
          items: [
            { label: '概览', link: '/logs/' },
            {
              label: '重建个人技术手记',
              link: '/logs/2026/07/site-rebuild/',
            },
          ],
        },
        {
          label: '随记',
          items: [
            { label: '概览', link: '/notes/' },
            {
              label: '让记录保持可检索',
              link: '/notes/writing/searchable-notes/',
            },
            {
              label: 'Transformer 论文解析',
              link: '/notes/ai/transformer/',
            },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});
