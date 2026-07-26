import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const entries = await getCollection(
    'docs',
    ({ data }) =>
      data.type === 'log' &&
      data.pubDate instanceof Date &&
      data.draft !== true,
  );

  entries.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: '廖家伟的技术手记',
    description: '项目、开发日志与日常随记。',
    site: context.site,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/${entry.id}/`,
    })),
    customData: '<language>zh-CN</language>',
  });
}
