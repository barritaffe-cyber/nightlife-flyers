# Shared portrait handling

All portrait layers use the shared treatment in `lib/coco/portraitEdgeFade.ts`. This is an application-wide rule for existing portraits, new uploads, replacements and portrait echoes, not an optional template decoration.

- Apply the fade to the portrait's own image bounds: bottom 28%, sides 7%, top 2%. Keep the middle opaque. The percentages follow position, size and rotation.
- Preserve the original uploaded image. DOM renderers use `PORTRAIT_EDGE_FADE_STYLE`; Canvas/Pixi export uses `createPortraitEdgeTexture` on a temporary texture.
- Replacement changes the image source and cleanup metadata while retaining the portrait identity, placement and scale. Keep `isExtracted: true` or the appropriate portrait semantic role. Do not require the customer to reapply the fade.
- Ghost portraits (`cocoAssetRole: portraitEcho`) are linked to the main subject. Replacing or cleaning up the subject updates their image source and cleanup metadata too, including live assets, both format sessions, saved layout snapshots and personalized previews. The ghost retains its own position, scale, rotation, opacity, grayscale/filter, shadow, tint and fade. Use `replaceCocoRecipeSubjectInVariant` for replacement; do not update only the main asset's URL.
- Use the same treatment in Square, Story, personalized previews, the editor, saved/reopened projects and exports. Future portrait renderers must use the shared helper.
- Exclude logos, backgrounds and decorative assets. A flattened background photograph is not a separate portrait layer.
- Keep standard `maskComposite: intersect` after the prefixed WebKit property; reversing their order causes PNG export to lose the mask.

Regression checks: `tests/portrait-edge-fade.test.ts` covers replacement and saved formats. `tests/coco-portrait-echo.test.ts` covers linked ghosts, repeated replacement, personalized previews, and the production editor commit callback with Story not yet mounted. `scripts/verify-portrait-edge-fade.mjs` covers actual mask pixels, Canvas export texture alpha, movement, resizing, PNG exports and project reopening.
