# Editable layered glass headline

The user's CSS foundation is implemented as four live text paint passes:
depth, bevel, translucent face, and highlight rim. All use one editable string.
The existing compiled text object owns selection, position, rotation and skew.
The three decorative copies are aria-hidden and do not intercept pointer input.

- Renderer: `components/text/GlassHeadlineText.tsx`
- Shared style definitions: `lib/coco/glassHeadline.ts`
- Portable marker: `paint.textEffect = "cyan-glass-v1"`
- Project: `public/generated-flyers/rnb-thursdays.nflyer`
- Standalone foundation: `public/generated-flyers/rnb-glass-headline-foundation.html`
- Integration script: `scripts/apply-rnb-glass-headline.mjs`
- Browser verification: `scripts/verify-rnb-glass-headline.mjs`

The CSS uses the supplied Bodoni/Didot/Times fallback font stack and bold weight.
The fonts are system fonts, not embedded assets; their availability affects glyph
shape across devices. Stroke widths, shadow offsets, blur and highlight dimensions
use em units corresponding to the original 330px foundation. Existing size edits
therefore scale the glass treatment. Solid color and edited gradient endpoints
change the face while preserving the authored edge treatment. The original
seven translucent reflection stops are retained until gradient controls are edited.

The R&B project was patched in place rather than rebuilt. All non-headline data
and headline geometry are unchanged. Backup:
`recipe-file-backups/rnb-thursdays-before-glass-31fd90fcc36e.nflyer`.
The CSS master and build adapter also carry the effect for future initial builds.
The standalone foundation normalizes the escaped HTML pasted in the conversation.

Validation: three glass-specific tests and eight existing recipe/shadow tests pass.
ESLint has zero errors and three existing app warnings. Full TypeScript still has
unrelated project errors, with no diagnostics in the changed app/component/helper.
Browser checks passed Square and Story previews, headline selection, live text
changes across all four passes, and save/reimport of a temporary .nflyer. The
actual source project is not overwritten by browser test saves.

Final NF_GLASS_CONTROLS=1 browser run passes in both formats: 120/240px font
sizes with proportional bevel widths, edited cyan/magenta gradient endpoints,
solid pink fill, live text edits and temporary-file save/reimport. Both final
previews were captured before test edits. No page or maximum-depth errors.
