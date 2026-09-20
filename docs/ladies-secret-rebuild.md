# Ladies Night — Neon Chrome

Replaces `secret_friday` at the user's explicit request. The Square and Story layouts use the supplied clean `secret-friday-square.jpg` and `secret-friday-story.jpg` backgrounds. The target is reference artwork only.

`Ladies Neon Chrome PNG` is extracted from the supplied transparent `png-glyphs/LN-FAM.png` through `scripts/build-ladies-neon-font.py`. It includes A–Z and 0–9, lowercase aliases, normalized row baselines, and kerning. The original finish and transparency are preserved. Explicit cell boundaries separate the letters; the numerals 1–3 exclude disconnected neighboring fragments. Per-glyph assets and source hash are recorded in `assets/png-glyphs/ladies-chrome/metrics.json`.

This font is template-exclusive for now: runtime font registration supports editing and saved projects, while `TEMPLATE_ONLY_FONT_FAMILIES` keeps it out of shared font lists and it is not added to the shared PNG collection picker. Existing families retain their availability.

The HTML master is `public/generated-flyers/ladies-secret-master.html`. Its dedicated builder uses the existing CSS extractor, semantic binding and Coco materializer to create `ladies-secret.nflyer` and `lib/template-data/ladies-secret-v2.json`. Both formats have 22 independently bound text objects, including Hype Policy and each DJ name. The native QR remains uploadable and replaceable. Icons and rules are independent decorations.

The displaced gallery registry and original Secret Friday Square/Story data were archived byte for byte with SHA-256 in `recipe-file-backups/ladies-secret-rebuild/`. Preserve newer user saves instead of overwriting them from this construction master.

Validation artifacts: `scripts/verify-ladies-secret-import.mjs`, `scripts/verify-ladies-secret-effects.mjs`, and `tests/coco-ladies-secret-rebuild.test.ts`. Both formats compiled without warnings or unsupported objects, and the actual editor previews were visually inspected. Paid PNG export was not exercised; no deployment performed.

Final checks passed: all visible text selection, Hype Policy type/clear/retype, QR upload/reset in each format, shared-menu exclusion, typography/shadows/layers, format independence, project save/reopen, two structural tests, and focused lint.

User-requested spacing correction: L is normalized to 78% horizontal width with matching advance/kerning profiles. Default headline tracking changed from −0.14em to −0.025em and source size from 235px to 220px in both formats. This separates I/E/S while shortening the L foot. The portable project, gallery sessions, source proofs and actual editor previews were rebuilt and visually checked.

Final refinement requested by the user: reduce only L’s advance by 55 font units (12.1 source pixels at the default size) to move it closer to A. Other glyph advances and global tracking are unchanged.
