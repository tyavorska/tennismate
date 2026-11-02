---
name: prototype-to-figma
description: Recreate an HTML prototype (docs/design/prototype.html or any rendered page) as editable Figma frames with variables, Light and Dark modes, auto-layout, icons and mobile frames. Use this skill whenever the user wants to move a prototype or an implemented page into Figma, "insert this part of the prototype into the design", add missing sections or icons to the Figma frames, make Figma match the prototype or the code, build mobile frames from the prototype's breakpoints, or set up theme variables in Figma, even if they only say "put it in Figma".
---

# Prototype to Figma

Rebuild a section of the prototype as real Figma layers (frames, text, vectors, variables), so designers can edit it and `figma-to-code` can read it back. A screenshot dropped into Figma is not a deliverable.

The Figma MCP rules come first: load the `figma-use` and `figma-generate-design` skills (resources `skill://figma/figma-use/SKILL.md` and `skill://figma/figma-generate-design/SKILL.md`), call `create_session` for the file, pass its `sessionId` to every file tool, and send `skillNames: "resource:figma-use,resource:figma-generate-design"` on every `use_figma` call. Read `references/use-figma-checklist.md` here before the first write: it lists the defaults that broke the earlier runs.

## Decisions already made with the user

- **Source of truth:** Figma for looks, prototype for behaviour and responsive rules. When the user asks to insert a prototype part, the prototype wins for that part, and anything else in Figma stays as it is.
- **Writes:** never edit the user's frames in place. Duplicate the target frames onto a `WIP` page, build there, show screenshots, and replace the originals only after the user says yes. Their frames change while you work: re-read before replacing.
- **Themes and variables:** variable collections with Light and Dark modes, fills bound to variables. No loose hex in the finished frames.
- **Responsive:** mobile frames are made from the prototype's `@media` rules.
- **Gaps:** accessibility first, no dead controls (do not draw buttons that lead nowhere), record every deviation.

## 0. Brief

Ask only for what is missing:

1. Figma file and the frames to change (Light, Dark, mobile if any).
2. Prototype path and the part to move (for example "features, devices, stats and footer on the landing").
3. States and transitions that must appear as frames or variants.
4. What is real and what is sample data.

## 1. Inventory the prototype

- Find the markup and the CSS of the part. The prototype is large (hundreds of KB): grep for a heading, take the surrounding section, and extract only the rules that mention its classes, including those inside `@media`. [references/extract-prototype-css.md](references/extract-prototype-css.md) has the snippet.
- Watch for colliding class names. In the current prototype `.dev` is both the device card on the landing and a calendar chip, so a rule you read may belong to the other component; confirm against a rendered screenshot.
- Render the prototype in the browser at 1440 and at 390, in both themes, and keep the screenshots. They are your reference for the verification step.
- List the breakpoints (`900px`, `520px`...), the icons (take the SVG source from the prototype, never redraw), the copy, and the order of sections.

## 2. Variables

1. Inspect what exists first: `get_variable_defs` on a current frame and `figma.variables.getLocalVariableCollectionsAsync()`. Reuse names and collections that are already there.
2. If theme variables are missing, create a collection with Light and Dark modes. Mirror the CSS role names (`surface/paper`, `surface/card`, `text/ink`, `text/ink-soft`, `border/line`, `brand/navy`) so the code mapping is one to one. Set `scopes` explicitly (fills, text, stroke), never leave `ALL_SCOPES`.
3. Bind fills and strokes with `setBoundVariableForPaint`. Copy fills from an existing node when its variable already fits: reassigning `node.fills = other.fills` keeps the binding.
4. One frame per layout, themed by the collection's mode, instead of two hand-coloured copies, unless the user's file already works with separate Light and Dark frames. Match what the file does.

## 3. Build on the WIP page

- Create a `WIP` page (`figma.createPage()`) once, duplicate the frames into it, and work only there. Switch page at most once per call.
- Top-down: section frames first, then content. Auto-layout for every container with related children, appended before `FILL` or `HUG` is set.
- Icons: `figma.createNodeFromSvg()` with explicit `width`/`height` and the real colour substituted for `currentColor`. Never build an icon from rotated lines.
- Type: load every font first (`Manrope Regular/Bold/ExtraBold`, `Sofia Sans Extra Condensed ExtraBold`), line height and letter spacing as `{unit, value}`.
- Take sizes from the prototype's CSS and the existing frames' metrics so the new part matches its neighbours: card padding, radius, gaps. Where the prototype and the existing frames disagree, the existing Figma frames win for looks.
- Mobile frames: width 390, built from the prototype's responsive rules (stacked columns, tighter padding), not scaled desktop frames.
- Move shared or repeated elements into components (build once, place instances) when they repeat.

## 4. Verify

- `get_metadata` of the result for structure: order of sections, heights, counts. Return created and changed node IDs from every call.
- One screenshot per changed frame, compared with the prototype screenshots from step 1. Check: white default fills, wrong text case, misaligned tags, clipped text, wrong fonts.
- Check both modes by switching the frame's variable mode, not by trusting one.

## 5. Handoff

Show the WIP frames, list deviations (contrast fixes, elements not drawn, artifacts not copied), then, after the user's yes, replace the originals and delete the WIP copies. Then suggest running `figma-to-code` for the same frames.

## Never do without asking

- Replace or delete the user's original frames.
- Use a screenshot of the prototype as a fill or child in a frame.
- Generate images with credits without telling the user.
