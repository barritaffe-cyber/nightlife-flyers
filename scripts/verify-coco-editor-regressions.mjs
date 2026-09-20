import { spawnSync } from 'node:child_process';

// The accepted Disco project exercises the shared editor's past regressions.
// Each browser suite uses an isolated context and never saves over the project.
const checks = [
  ['Chrome PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Chrome PNG' }],
  ['Future PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Future PNG' }],
  ['Grunge PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Grunge PNG' }],
  ['Afro PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Afro PNG' }],
  ['Rainbow PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Rainbow PNG' }],
  ['Gold Whimsical PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Gold Whimsical PNG' }],
  ['Pink Fur PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Pink Fur PNG' }],
  ['Gold Script PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Gold Script PNG' }],
  ['Gold Serif PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Gold Serif PNG' }],
  ['Red Neon PNG lettering', ['scripts/verify-png-glyphs.mjs'], { NF_GLYPH_FAMILY: 'Red Neon PNG' }],
  ['adjacent layer stepping and background floor', ['--experimental-strip-types', '--test', 'tests/coco-layer-step.test.ts'], {}],
  ['PNG lettering selection and project round-trip', ['scripts/verify-png-glyphs.mjs'], {}],
  ['accepted source integrity', ['--experimental-strip-types', '--test', 'tests/coco-disco-rebuild.test.ts'], {}],
  ['labels', ['scripts/verify-disco-import.mjs'], { NF_LABEL_CHECKS: '1' }],
  ['alignment', ['scripts/verify-disco-import.mjs'], { NF_ALIGNMENT_CHECKS: '1' }],
  ['label styles and font-aware glint', ['scripts/verify-disco-import.mjs'], { NF_MAPPING_ONLY: '1', NF_MAPPING_FONTS: '1', NF_GLINT_CHECKS: '1' }],
  ['shadows across formats', ['scripts/verify-disco-shadow-toggle.mjs'], {}],
  ['details tracking import and project round-trip', ['scripts/verify-black-tie-import.mjs'], {}],
  ['Day Party companion labels and independent format tracking', ['scripts/verify-day-party-import.mjs'], {}],
];
const listOnly = process.argv.includes('--list');
for (const [name, args, flags] of checks) {
  console.log(`Editor regression: ${name}`);
  if (listOnly) continue;
  const env = { ...process.env };
  for (const key of ['NF_LABEL_CHECKS', 'NF_ALIGNMENT_CHECKS', 'NF_MAPPING_ONLY', 'NF_MAPPING_FONTS', 'NF_GLINT_CHECKS', 'NF_PREVIEW_ONLY']) delete env[key];
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit', env: { ...env, NF_OUTPUT_DIR: '/tmp/nightlife-editor-regressions', ...flags }, timeout: 600000,
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (!listOnly) console.log('All editor regression checks passed.');
