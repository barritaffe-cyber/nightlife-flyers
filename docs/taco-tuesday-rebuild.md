# Taco Tuesday — Velvet Room

Added as a new gallery template (`taco_tuesday`) at the user's request. Uses the supplied clean `assets/taco-square.jpg` and `assets/taco-story.jpg` backgrounds. Square preserves the upward-skewed, condensed TACO headline. Story uses one editable headline with explicit line breaks `T\nA\nC\nO`, upright with T at top and O at bottom.

The new shared **Textured Gold Serif PNG** family is extracted from the supplied transparent `assets/png-glyphs/taco.png` by `scripts/build-textured-gold-font.py`. It includes A–Z, 0–9, lowercase aliases, normalized row baselines and kerning. Per-glyph PNG assets and source SHA-256 are in `assets/png-glyphs/textured-gold/metrics.json`. It is registered in the local font map, CSS, Club / Poster Headlines group and shared PNG collection picker. The gold script uses existing Dear Script (Demo_Font).

Construction source: `public/generated-flyers/taco-tuesday-master.html`; dedicated adapter: `scripts/build-taco-tuesday-master.mjs`; portable result: `taco-tuesday.nflyer`; gallery sessions: `lib/template-data/taco-tuesday-v2.json`. Eighteen text owners have independent bindings, including prices, item names and an initially empty details label. No QR is shown in this design.

Skew fidelity: the browser extractor decomposes transforms as rotation × scale × shear, while the editor composes rotation × shear × scale. The dedicated adapter converts shear by atan(tan(skew) × scaleX / scaleY). This preserves the original Square source matrix, including vertical stems under skewY(-8deg) and horizontal condensation, without changing other templates or the shared renderer. A structural regression checks the reconstructed matrix and Story letter order.

Both variants compiled with zero unsupported objects and warnings. Source proofs and actual editor previews are provided. Paid PNG export was not exercised; no deployment performed. Preserve any newer user saves over these construction sources.

Final acceptance: all visible text selection/editing, label type/clear/retype, both shared font and PNG menus, typography/effects/layers, independent format sessions and save/reopen passed. Both final editor previews were inspected. Two structural tests passed, including exact skew reconstruction and vertical letter order; focused lint passed. The headline sits below supporting text in layer order so its large transparent font area cannot intercept presenter selection.

Story background refreshed from the user-updated `taco-story.jpg` (SHA-256 f9f71246cf15b6ac23478b6bb01222b4b9afd225972d83a42e24ea2d204d0c86). Existing project and gallery asset references already point to this file, so the editable composition is preserved. Story source/editor previews refreshed.
