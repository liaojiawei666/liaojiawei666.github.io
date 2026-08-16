# Project Agent Instructions

## Runtime Safety

Before starting, previewing, or browser-testing this project, read and follow:

`/.agents/skills/project-runtime-safety/SKILL.md`

## Article Writing

When the user starts a log topic, discusses its outline, or creates, rewrites, or expands an article under `src/content/docs/logs/`, first read and follow:

`/.agents/skills/write-problem-driven-logs/SKILL.md`

This is the primary writing skill for logs. For a new topic or major new chapter, discuss the outline and wait for confirmation before drafting unless the user explicitly asks to write immediately.

For every article under `src/content/docs/`, also read and follow:

`/.agents/skills/concise-systems-writing/SKILL.md`

If stylistic defaults conflict, `write-problem-driven-logs` takes priority for logs.

Fallback rules:

- Put the conclusion first and keep the prose as short as accuracy allows.
- Use an editable draw.io diagram only when it materially clarifies architecture, flow, state, hierarchy, or relationships.
- Keep diagram sources in `src/diagrams/` and generated SVG files in `public/diagrams/`.
- Preserve frontmatter and update the Astro/Starlight sidebar when paths change.
- Run the production build after article changes.
- Do not commit or publish unless the user explicitly asks.
- Preserve unrelated user changes.
