# Girl Code — Rose

Separate editable Square (1080×1080) and Story (1080×1920) template based on the supplied sunset rooftop target. The original gold Girl Code template remains available.

## Sources and registration

- Original photographs: `public/generated-flyers/assets/girl-code-square2.jpg` and `girl-code-story2.jpg`.
- Reference only: `public/generated-flyers/redesigns/girl-code2.png`.
- Construction: `public/generated-flyers/girl-code-rose-master.html` and `scripts/build-girl-code-rose-master.mjs`.
- Portable project: `public/generated-flyers/girl-code-rose.nflyer`.
- Session cache: `lib/template-data/girl-code-rose-v1.json`.
- Recipe id: `girl-code-rose`; themes: R&B / Lounge, Tropical, Elegant.

Registered in the recipe list, portable loader, Coco directions/catalog, preview exports and generated gallery bundle. Create with Coco → Girl Code / R&B / Lounge reaches the design card and guided details.

The builder refuses to overwrite a future accepted `girl-code-rose-saved-source.json`. After user refinements, promote the actual saved sessions instead of rebuilding the master.

## Headline glyphs

**Rose Chrome Serif** is reusable in PNG Lettering and Luxury / Fashion Display. Its 62 supplied glyphs include A–Z, a–z and 0–9. The source sheets are `public/generated-flyers/assets/png-glyphs/girl-code01.png` through `girl-code04.png`.

`scripts/build-rose-chrome-serif-font.py` packages the original colored glyph artwork into `public/fonts/RoseChromeSerifPNG.woff2` (family `Rose Chrome Serif PNG`). It retains source RGB/highlights, isolates connected glyph cores to reduce loose exterior haze, preserves detached dots, and generates baseline/spacing metrics and kerning. Native PNG glyphs and source hashes are in `public/generated-flyers/assets/png-glyphs/rose-chrome-serif/`. The source sheets are unchanged.

The template uses this font for GIRL. Code uses existing Dear Script with a rose gradient and edge depth; this is an editable interpretation of the reference script, since the supplied glyph sheets contain serif lettering. Code renders in front of GIRL. Crown and heart are native rose SVG decorations. No finished title or reference flyer is baked into the background.

## Form and editor

Each format has 31 compiled objects, including 22 independently bound text owners and an initially blank details label. Presenter, date, start/end time, three DJs, music, venue, venue caption, address and reservations map to separate fields. Decorative copy remains authored and editable on canvas. DJ/reservation labels and the reservation plate follow their associated content.

## Verification commands

```sh
node --experimental-strip-types --test tests/coco-girl-code-rose.test.ts
npm run coco:recipe -- audit girl-code-rose
NF_GIRL_CODE_ROSE_EXPORT_ACCESS_FIXTURE=1 NF_GIRL_CODE_ROSE_PUBLISH_PREVIEWS=1 node scripts/verify-girl-code-rose.mjs
node scripts/verify-girl-code-rose-discovery.mjs
node scripts/verify-rose-chrome-serif.mjs
```

The browser scripts substitute only the local starter-render quota response. They exercise the actual PNG renderer; account entitlement enforcement is outside these checks. Template artifacts are in `/tmp/girl-code-rose`, discovery artifacts in `/tmp/girl-code-rose-discovery`, and reusable lettering artifacts in `/tmp/rose-chrome-serif-check`.

The lettering check selects the font in both headline pickers, edits mixed case and numbers, adjusts spacing/size/leading and shadows, saves/reopens, and exports both formats. The template check exercises every visible text owner independently, labels, per-format shadows, saved-project round trips and original/reopened exports.

### Results

- Compiler: 31 objects per format; zero unsupported or approximated objects. Adapter audit passes (background intentionally fixed).
- Editor: 42 visible field checks, six label checks, four actual PNG exports and two format round trips pass, with zero browser errors. Original and reopened exports were visually inspected. Report: `/tmp/girl-code-rose/results.json`.
- Reusable font: both headline pickers, both formats, mixed case/digits, spacing/size/leading, shadows, save/reopen and two exports pass. Alphabet specimen and both exports visually inspected.
- Focused tests: 5/5 pass, including 62 characters, source hashes, independent form bindings, title layering and hidden empty reservation plate.
- TypeScript remains at 298 preexisting diagnostics; no new template/font implementation diagnostics.
