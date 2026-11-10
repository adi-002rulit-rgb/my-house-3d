# ADKH House — instructions for Gemini

Repository: interactive home design presentation (`index.html`) and parametric editor (`editor.html`).

## Roles

Gemini has two distinct roles:
1. **Builder**: implement a narrowly scoped GitHub Issue in a separate branch and create a Pull Request. Never push directly to `main`, never self-merge.
2. **Reviewer**: independently critique PRs created by ChatGPT or others. Prioritize reproducible problems, false claims, geometry errors, and user-visible regressions.

## Project facts to preserve

- This is an **actual two-storey house** presented to clients, but a precise architectural CAD model has NOT yet been validated.
- Ground-floor housing block approximately 19.03 × 11.40 m per source drawing; measurements in code may be approximate.
- Living room: two broad front-facing windows, each 2.30 m.
- Kitchen: one broad courtyard-facing 3.00 m window and exactly one door from corridor.
- Living room: exactly one door from corridor.
- Living room and kitchen: *double-leaf doors, 70 cm per leaf*, 1.40 m combined.
- Other interior doors: single leaf.
- Bedroom window on revised side wall.
- Stair is a quarter-turn, right-side lower approach, upper flight running LEFT by the wall, with closed sloping underside and window above. **Do not claim the staircase is exact.** Photos and existing geometry have demonstrated repeated discrepancies.
- The storey is elevated above courtyard; height ~0.60 m is provisional.
- Windows' head/sill heights, staircase geometry and room placements need as-built verification.

## Required workflow

- Read `EDITOR_GUIDE.md` and `QA_REPORT.md` before editing.
- Preserve the original user geometry; do not invent dimensions.
- For editor changes, keep 2D and 3D driven by the same JSON objects.
- When walls are moved, investigate linked openings and adjacent rooms; highlight failures instead of silently leaving broken geometry.
- Keep dependencies auditable, avoid unnecessary external scripts, no credentials in source.
- If modifying the staircase, explicitly test wall clearances, door access, continuous steps, and window intersections.
- Explain which conditions are verified by code and which were **not** visually browser-tested.
- Make small commits and use a PR for review. Never auto-merge.
- Do not generate images as a substitute for updating the **actual interactive website**.
- Separate independent feature PRs from review-only PRs.

## Review checklist

1. WebGL initialization and CDN module imports.
2. Rendering on PC and iPhone, resizing and navigation.
3. No floating staircase, blocked doors, door/window count regressions.
4. Door leaves align with openings; wardrobe access unobstructed.
5. Selection, translation, rotation, scale, undo/redo, saving and JSON validation.
6. Room finish changes actually update the 3D surfaces.
7. No material or geometry resource leak on rebuilding.
8. Input validation and untrusted JSON boundaries.
9. Accessibility and client presentation consistency.
10. Honest release notes — don't say 'fixed' without visual verification.

Write findings with file/line reference, severity, steps to reproduce and suggested fix.
