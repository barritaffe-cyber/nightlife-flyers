# Night Shift — Club Grodify

Replaces the existing `neon-night-shift` gallery slot (version 11) with the supplied neon palm portrait target. The original `neon-night-shift.nflyer` remains unchanged. Backup and SHA256 manifest: `recipe-file-backups/neon-night-rebuild/`.

Source: `public/generated-flyers/neon-night-master.html`; builder: `scripts/build-neon-night-master.mjs`; editable project: `public/generated-flyers/neon-night.nflyer`; variants: `lib/template-data/neon-night-v2.json`. Supplied clean `neon-night-square.jpg` and `neon-night-story.jpg` are separate backgrounds. Target `redesigns/neon-night.png` is a reference, never the flattened template.

Each format has 27 compiled objects, including 19 visible independently editable text owners and an empty Details label. NIGHT uses Anton with an SVG silver gradient/noise texture; Shift uses the existing Hong Kong Script Brush font. Supporting fonts are existing LEMONMILK and Bebas Neue. No new font registration or asset picker controls. Manual line breaks, explicit format geometry, semantic sidebar bindings, and editable layers are retained.

`applyCocoNeonNightShiftVariant` now preserves compiled documents before legacy migration. The older migration inserted a default DOORS OPEN label even when the new compiled recipe intentionally left that native field empty. Legacy uncompiled projects still use the existing migration.

Validation:
- Compiler: 27 objects per format, zero unsupported objects or warnings.
- Focused replacement/gallery tests: all three passed; lint: zero errors, three existing app warnings.
- Actual editor selection of all 19 visible owners in both formats, title editing, Details label clear/retype, Details/address L/C/R and authored tracking checked.
- Both titles' size, spacing, leading, shadow controls, layer ordering and format save/reopen passed.
- Full import/save/reopen passed for both formats. Final actual Coco Square/Story previews refreshed and visually inspected after the Story texture-height correction.
- Other 24 gallery entries equal their pre-replacement snapshot. Old project SHA256 remains `a9b3a65d5c5a7cac7a6c85b41ba569c3973e0a3333bae7e03fab62b321935ce3`.

Broader legacy test `coco-neon-night-shift-recipe.test.ts` still has two unrelated failures: preserved old project geometry (`rendererZones.doors.x` 3.5 versus saved `timeX` 13.014), and an outdated source-text regex for the price renderer. The active recipe version assertion is updated to 11; the preserved old file remains version 10. Do not change accepted old project geometry to satisfy that test.

Visual limits: lettering and silver distress are editable approximations rather than the target's exact raster lettering. The target's wall neon sign is absent from the supplied clean background and is not baked into this template. Story is adapted from the square target. PNG export remains unverified in the guest flow. No commit or deployment.
