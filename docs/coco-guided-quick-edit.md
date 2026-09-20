# Guided Coco Quick Edit

The compiled-template UI described below was superseded by the
[orb-led Coco conversation](coco-conversation.md) on 2026-09-16. Its shared size,
color, Undo, and finish-review mechanics remain in use. The old panel is now a
fallback for legacy noncompiled designs; its browser scripts describe that
earlier UI.

Coco offers deterministic actions inside Quick Edit. No model calls or chat
service are used. The advanced editor remains an explicit user choice.

- Headline, Event details, Photos, and Finish & download buttons guide users to
  existing controls. Social icons appears when the template supports that slot.
- Canvas text selection resolves through headline owners and recipe bindings to
  the corresponding form field. Social selection opens platform choices; its
  full icon box is clickable in Quick Edit, including transparent centers.
- Headline and detail actions enlarge visible editable owners by 10%. Existing
  size sliders share the same action/Undo path. Color pickers are offered for
  solid lettering; PNG, texture, and authored gradient materials are preserved.
- The format scope is explicit. Both-format resizing applies a proportional
  change to each format's existing size. Form wording keeps its existing field
  routing. Reset restores this section's adjustments in the selected scope.
- Undo tracks guided size/color changes and reverses only the changed properties.
  Later wording, images, positions, and unrelated settings remain intact. History
  is in memory; changing/opening a project clears it. Styles persist in the usual
  project state and compiled overrides. This is not a replacement for global Undo.
- Phones show a sticky live thumbnail with a View full flyer button. Desktop
  retains the canvas next to the panel. Both use the existing compiled renderer.
- All Quick Edit campaign-download entry points share a finish review. Blank
  supported date slots and editable text bounds outside either saved canvas are
  flagged. The visible canvas also gets a rendered DOM/text-range bounds check.
  This is not a complete collision or legibility audit, and does not measure all
  rendered glyphs in the inactive format. Fix it opens the relevant format/field;
  Leave blank / Keep as is allows deliberate exceptions for that download.

Implementation: `lib/coco/guidedQuickEdit.ts`, `components/coco/CocoGuide.tsx`,
`components/coco/CocoQuickEdit.tsx`, and the existing integration in `app/page.tsx`.

Validation:

- `node --test tests/coco-guided-quick-edit.test.ts tests/coco-quick-text-sizes.test.ts tests/coco-title-size-edit.test.ts tests/coco-social-form-choices.test.ts`
- `node scripts/verify-coco-guide.mjs` (set `NF_DEVICE=mobile` for phone;
  `NF_SKIP_EXPORT=1` for interaction-only validation).
- `node scripts/verify-coco-guide-color.mjs` checks City Nights colors in both
  formats and Undo. The main script uses Slow Jamz's PNG lettering and tests
  scope, reset, Undo after wording edits, canvas selection, photos, date review,
  and actual Square/Story downloads using an isolated export-quota fixture.
