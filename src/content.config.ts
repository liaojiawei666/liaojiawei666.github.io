import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const entryType = z.enum(['page', 'project', 'log', 'note']);
const projectStatus = z.enum([
  'planned',
  'active',
  'completed',
  'archived',
]);

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        type: entryType.default('page'),
        pubDate: z.coerce.date().optional(),
        tags: z.array(z.string()).default([]),
        status: projectStatus.optional(),
        repository: z.string().url().optional(),
        demo: z.string().url().optional(),
        featured: z.boolean().default(false),
        giscus: z.boolean().default(true),
      }),
    }),
  }),
};
