---
name: concise-systems-writing
description: Write, rewrite, edit, or expand articles, chapters, tutorials, notes, and technical documentation with concise Chinese-first prose and optional draw.io diagrams. Use for any article-writing task where the agent should state the answer early, explain the core mechanism and boundaries with minimal text, replace complex architecture, process, state-transition, hierarchy, or data-flow descriptions with editable draw.io diagrams when useful, and integrate the result into this Astro/Starlight documentation site.
---

# Concise Visual Writing

## Goals

- Lead with the answer or central claim.
- Explain the problem, mechanism, and boundary conditions with the fewest useful words.
- Prefer a diagram when relationships are clearer visually.
- Keep every diagram editable and every article maintainable.
- Match the language and technical depth of the reader.

## Workflow

1. Identify the single question the article must answer and the takeaway the reader should retain.
2. Inspect existing files, navigation, terminology, and project conventions before editing.
3. Verify precise or time-sensitive technical claims with primary sources. Cite claims near their supporting sources.
4. Draft the smallest structure that explains the topic.
5. Decide whether a diagram materially reduces explanation.
6. Write or edit the article, integrate any diagram, and remove repetition.
7. Validate links, assets, formulas, navigation, and the project build.

Ask at most two focused questions only when missing information would materially change the article. Otherwise proceed with reasonable assumptions.

## Write Concisely

- Put the conclusion in the opening paragraph.
- Use one idea per paragraph.
- Prefer concrete cause-and-effect language: “A changes B, so C happens.”
- Define a term when it first appears; do not repeatedly redefine it.
- Include implementation details only when they help answer the article’s question.
- Use code only when it demonstrates behavior more precisely than prose.
- Keep code examples minimal and annotate only non-obvious lines.
- Use a table for exact comparisons or repeated mappings, not as decoration.
- Use lists for three or more parallel items; use a sentence for one or two.
- Stop when the reader can explain the mechanism and its important limits.

Remove:

- generic introductions;
- restatements of the prompt;
- unrelated history;
- duplicated conclusions;
- transition filler;
- decorative analogies that do not improve accuracy;
- headings with only one trivial sentence.

Prefer headings that name the reader’s question, mechanism, or decision. Avoid nesting deeper than `###` unless the content genuinely requires it.

## Keep Editing Invisible

- Write every article as a self-contained final text, as if its current structure had been planned from the beginning.
- Never expose drafting history, revision history, user instructions, rejected structures, or the reasoning used to organize the article.
- Do not narrate the writing process with phrases such as “previously we wrote,” “now change it to,” “in the earlier section we rewrote,” or “we will discuss this later.”
- Refer to an earlier result only when the mathematical or technical dependency matters. State the result directly instead of describing how the article introduced or revised it.
- After revising content, remove every trace of the superseded wording or structure. Keep plans and progress updates in the conversation, never in the published article.

## Structure an Article

Use only the sections the topic needs. A strong default is:

```markdown
---
title: ...
description: ...
---

一句话结论。

## 问题

说明要解决的具体问题。

## 工作原理

用图、代码或简短文字说明核心机制。

## 边界与注意事项

说明容易误解、不能覆盖或会失败的情况。
```

Do not create empty template sections. Remove any section that adds no information.

## Decide Whether to Draw

Use the available draw.io skill and follow its workflow when one or more conditions hold:

- three or more components interact;
- control flow, data flow, boot flow, request flow, or lifecycle matters;
- the topic contains state transitions or privilege transitions;
- the explanation depends on hierarchy, layers, ownership, memory layout, or address mapping;
- prose would repeatedly refer to “前一步”“下一层”“另一侧” or require the reader to reconstruct relationships.

Do not draw for a single fact, one mapping, one short linear step, or content already clearer in a small table.

Make each diagram answer one explicit question. Prefer:

- 4–7 primary nodes;
- one dominant reading direction;
- short noun or verb-phrase labels;
- arrows that encode direction and causality;
- consistent colors with semantic meaning;
- no paragraph-length text inside shapes.

Introduce the diagram with one sentence. Follow it with only the two to four observations the reader cannot obtain immediately from the picture. Do not narrate every arrow.

Always keep the `.drawio` source. Prefer SVG for article embedding so text stays sharp.

## Integrate with This Astro/Starlight Site

Use these project conventions:

```text
Article:
src/content/docs/{projects,logs,notes}/...

Diagram source:
src/diagrams/<article-slug>/<name>.drawio

Generated SVG:
public/diagrams/<article-slug>/<name>.drawio.svg

Markdown URL:
/diagrams/<article-slug>/<name>.drawio.svg
```

- Preserve existing frontmatter schemas and naming conventions.
- Update the manual sidebar when adding, moving, or renaming a page.
- Use `$...$` for inline math and `$$...$$` for block math.
- Reuse the repository’s draw.io listener or synchronization script instead of manual export.
- Run the existing production build after edits.
- Do not commit or publish unless the user explicitly requests it.
- Preserve unrelated user changes.

## Quality Gate

Before finishing, verify:

- The opening answers the article’s main question.
- Every paragraph advances understanding.
- Terms, code, diagrams, and captions use the same names.
- A diagram exists only when it reduces cognitive load.
- The `.drawio` source and rendered SVG both exist when a diagram is used.
- Markdown links and image paths resolve.
- The project build passes.
- No unsupported claim, filler section, or repeated summary remains.
- No sentence exposes drafting history, revision history, user instructions, or editorial planning.
