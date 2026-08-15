# Project Agent Instructions

## Runtime Safety

Before starting, previewing, or browser-testing this project, read and follow:

`/.agents/skills/project-runtime-safety/SKILL.md`

## Article Writing

When creating, rewriting, or editing an article under `src/content/docs/`, read and follow:

`/.agents/skills/concise-systems-writing/SKILL.md`

Fallback rules:

- Put the conclusion first and keep the prose as short as accuracy allows.
- Use an editable draw.io diagram only when it materially clarifies architecture, flow, state, hierarchy, or relationships.
- Keep diagram sources in `src/diagrams/` and generated SVG files in `public/diagrams/`.
- Preserve frontmatter and update the Astro/Starlight sidebar when paths change.
- Run the production build after article changes.
- Do not commit or publish unless the user explicitly asks.
- Preserve unrelated user changes.
