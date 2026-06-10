# Visual Recipes

This is the living memory for flyer design lessons we want Nightlife Flyers to reuse.
Add to this file whenever a reference image teaches a repeatable composition rule,
layering pattern, typography move, or asset requirement.

The goal is not to collect assets. The goal is to store visual recipes: how a flyer is
constructed, what must be layered first, what text zones exist, and what makes the
composition feel designed instead of assembled.

## How To Add A Recipe

Use this format for each new lesson:

- `Recipe ID`: short stable id for code and prompts.
- `Reference`: file, screenshot, sample name, or user description.
- `What It Is`: one-sentence visual system.
- `Layer Stack`: ordered from background to final overlays.
- `Text Zones`: where copy belongs.
- `Typography`: what type treatments are required.
- `Color Grade`: palette and lighting rules.
- `Do Not`: mistakes this recipe avoids.
- `App Notes`: what the editor/generator needs to support.

## Core Principles

- Start with a full-bleed hero image or hero subject.
- Crop the subject aggressively so it owns the poster.
- Compose the title around the subject, often behind or partially overlapped by it.
- Use only two or three text zones: top brand/date, main title, footer/details.
- Keep logos and icons in lanes, not floating decoration.
- Use color grading, glow, haze, and vignette to unify layers after composition is set.
- Treat effects as atmosphere, not as the main composition.

## Subject Isolation And Behind-Subject Type

- When a reference has depth like `sample03`, isolate the subject as its own foreground layer instead of leaving the whole image flat.
- Keep or create a full-bleed background/base layer behind the extracted subject.
- Place oversized title, repeated title, or ghost typography between the background and extracted subject.
- The extracted subject should physically occlude the behind-subject type. This makes the type feel embedded in the scene instead of pasted on top.
- Behind-subject type should usually be lower contrast than the main title: partial opacity, blur, mask, shadow, or color that reacts to the scene.
- Do not cover important facial features, eyewear, hands, jewelry, or the strongest accessory unless the text is intentionally masked by the subject.
- Use this layer order for the app: `background -> behind-subject typography -> extracted subject -> foreground title/details -> atmosphere/color grade`.
- For auto-layout, detect the subject silhouette and reserve an occlusion zone where text can pass behind the subject but not over key facial details.
- If subject extraction is not available, use a manual mask or duplicate-image workaround before attempting this look.

## Icon And Logo Lane Rules

- Icons and logos must live in deliberate lanes, never scattered as decoration.
- Social icons should read as one compact group. The spacing between icons should be visibly smaller than the width of the whole icon group.
- Horizontal icon spacing should generally be tight: about 1.5-2.0 icon widths center-to-center for footer social groups.
- Vertical spacing between a label and its icon row must be clean and close enough to feel connected. Use about 0.6-1.0 icon height between label baseline and icon top.
- If a lane has a text label, the label and icons should align to the same center or edge.
- Use equal spacing between all icons in the row.
- Icon size, glow, stroke, and opacity should be consistent across the row.
- Keep icons secondary. They should support the CTA or contact lane, not compete with the hero title.
- When icon spacing feels loose, reduce both horizontal spacing and label-to-icon vertical spacing together.
- If the icons start to look like individual stickers, the lane is too loose.

## Typography Doctrine

Strong flyer typography is not about cool fonts. It is hierarchy, contrast, spacing,
tone, and one unforgettable typographic moment.

Use this as a hard checklist before calling any flyer finished:

- Build aggressive hierarchy: event name first, artist/theme second, date/location third, fine print last.
- Use extreme size contrast. Headlines can be 140-300px, support lines 40-80px, date/location 24-48px, fine print 14-22px.
- Use only one or two font families: one display face and one clean support face.
- Create contrast through thick vs thin, large vs small, tight vs open, clean vs expressive.
- Tighten big headline tracking. Luxury and club headlines usually need tighter spacing, not browser-default spacing.
- Use small spaced uppercase for metadata and authority labels.
- Layer typography into the scene: behind subject, masked, oversized, cropped, duplicated, blurred, shadowed, or interacting with glow.
- Crop oversized text when it improves poster energy.
- Use depth stacks: sharp foreground title, blurred duplicate behind, shadow echo, glow, chromatic split, grain overlay.
- Do not center everything by default. Use asymmetry, side lanes, anchored corners, vertical date/type, and diagonal flow when the subject supports it.
- Control line height: large headlines around 0.8-0.95, small info around 1.1-1.4.
- Add texture to hero typography: metallic, chrome, glass, grain, emboss, smoke, or glow. Keep it subtle.
- Match type color to the scene: gold for luxury, cyan/magenta for neon club, red/orange for Latin, white/silver for upscale.
- Create a clear reading path: headline, hook/artist, date/location, CTA.
- Use blur intentionally for depth, especially a huge blurred duplicate behind sharp title.
- Use repetition only when it creates motion or branding.
- Preserve negative space. Premium flyers are not packed with boxes and badges.
- Match typography to event energy: elegant serif/gold for luxury, heavy condensed for trap/hip-hop, minimal spaced for techno, warm bold for Latin.
- Test mobile readability. If the headline fails at phone thumbnail size, the flyer fails.
- Use one hero typographic moment. Everything else must support it.
- Simplicity wins: one strong headline, one strong subject, controlled effects, clean hierarchy.

### Cheap Flyer Warning Signs

- Too many boxes, cards, pills, and badges.
- Too many fonts or mismatched font moods.
- Flat text sitting on top of an image instead of integrated into it.
- Effects used to compensate for weak composition.
- Rainbow palettes or unmotivated colors.
- Centered everything with no editorial tension.
- Footer copy competing with the headline.
- Every inch filled with text or graphics.
- Default spacing, default shadows, and untextured headline type.

## Recipe: Mustang Hero Subject Poster

- `Recipe ID`: `mustang-hero-subject-poster`
- `Reference`: `MUSTANG-SQUARE.png`
- `What It Is`: a cinematic subject-led poster where the car is the hero, the title sits behind it, and the event details live in disciplined supporting lanes.

### Layer Stack

1. Full-bleed industrial alley/background image.
2. Large title word behind the subject: `LEGEND`.
3. Extracted Mustang/car foreground subject.
4. Social icon lane stacked vertically on the left.
5. Secondary tagline in front of the subject/ground zone: `NEVER DIES`.
6. Short descriptive subtitle below the tagline.
7. Bottom footer lane with date/location and music/details.
8. Warm amber/red/purple color grade, glow, vignette, and atmospheric depth.

### Text Zones

- Top/center hero-title zone: huge display word, partly blocked by subject.
- Lower-middle tagline zone: short emotional phrase over the ground/foreground.
- Bottom info lane: date, time, location, genre, and supporting icons.
- Left utility lane: social icons only.

### Typography

- Main title should be a designed graphic layer or heavily styled editable text.
- Main title needs neon/chrome/block treatment with strong stroke, inner glow, and depth.
- Tagline can use a rough brush/script or expressive italic display face.
- Footer text should be clean, high-contrast, and grouped into readable lanes.

### Color Grade

- Palette: warm amber/orange highlights, red neon title, yellow tagline, deep purple shadows.
- Subject highlights must match the background lighting.
- Glow should reinforce the title and headlights, not cover the layout.
- Vignette should push attention toward the hero subject and title.

### Do Not

- Do not start with floating text on a blank or generic background.
- Do not let effects compete with the subject.
- Do not scatter icons around the poster.
- Do not use more than a few text zones.
- Do not place the main title only on top of the image if it can be integrated behind or around the subject.

### App Notes

- The app should support `background -> behind-subject title -> extracted subject -> foreground copy -> grade/effects`.
- The title layer needs explicit layer-order controls so it can sit behind the subject.
- Subject extraction/cutout placement is central to this recipe.
- Auto-layout should identify safe foreground zones for tagline and footer copy.
- Typography presets should include neon tube/block title, chrome/block title, and brush tagline treatments.

### Implementation Observed In `MUSTANG.json`

- The saved file is a Zustand wrapper: the useful design payload is under `state`.
- `state.session.square` is authoritative for the square design; `currentTemplate.square` is empty.
- The background is stored as a full embedded upload: `bgUploadUrl` is a 4096x4096 JPEG data URL. `bgUrl` remains as a fallback/template reference.
- The editable `headline` is hidden with `headlineHidden: true`; the main hero word is not normal editable text in this save.
- The big `LEGEND` title is a separate imported image/logo layer (`logo_*`) positioned behind the car with `layerOffset: -8`, locked in place.
- The Mustang is an extracted PNG subject layer (`extract_*`), locked in place, positioned over the title.
- The app achieves the poster depth through separate layers, not a flat render: background, title image layer, extracted car, editable text, stickers, flare.
- `head2`/`head2line` holds the visible tagline `NEVER DIES` using the `edosz` font, yellow color, tight line height, shadow, and left placement.
- `details`, `details2`, and `venue` carry the footer text zones: date/location, music/genre, and car subtitle.
- Social icons are SVG sticker layers in the footer lane with positive `layerOffset` values so they sit above the composition.
- A locked screen-blend flare layer adds atmosphere without becoming the layout.

### Mustang App Feature Map

- Hero subject: `portraits.square[*].isExtracted`
- Rendered hero title: imported image layer with id prefix `logo_` and negative `layerOffset`
- Title behind subject: title layer locked behind the extracted subject
- Hidden default headline: `headlineHidden: true`
- Tagline text: `head2` / `head2line`
- Date/location text: `details`
- Secondary footer text: `details2`
- Object subtitle: `venue`
- Social lane: `isSticker` SVG assets
- Atmosphere: `isFlare`, `blendMode: screen`, low opacity
- Background image: `bgUploadUrl`, `bgScale`, `bgPosX`, `bgPosY`

### Lesson From The Neon Nights Preview

The quick `Neon Nights` preview had energy, but it was generic because it lacked a hero subject. The title was only big center text, the crowd silhouettes were decoration, and the effects competed with the composition.

The Mustang reference proves the stronger rule: choose or create a hero subject first, integrate the title with that subject, then add supporting copy and atmosphere.

## Recipe: Fantasy Portrait Flyer

- `Recipe ID`: `sample01-fantasy-portrait-flyer`
- `Reference`: `sample01.jpg`
- `What It Is`: a fantasy portrait flyer where the face is the poster and every text layer supports the central character.

### Layer Stack

1. Full-bleed fantasy portrait art with face centered and cropped large.
2. Blue/pink atmospheric background glow and soft particle depth.
3. Top brand/logo mark.
4. Red horizontal date bar near the top.
5. Main title across the lower face/chest area.
6. Script tag attached to the main title.
7. DJ/music credit stack below title.
8. Red promo offer bar.
9. Venue/footer information.

### Text Zones

- Top brand/date lane.
- Main title zone across lower portrait/chest.
- Performer/music credit zone under title.
- Bottom promo and venue lane.

### Typography

- Main title needs a chrome/block/premium glow treatment.
- Script tag should overlap or tuck into the title, not float separately.
- DJ name should be tall, condensed, and letter-spaced.
- Promo bar should be high-contrast red with compact uppercase copy.

### Color Grade

- Palette: deep blue, electric cyan, magenta, red accents, white title glow.
- Face lighting should drive the palette.
- Red bars must act as functional anchors, not decoration.

### Do Not

- Do not reduce the portrait to a background texture.
- Do not add many small floating elements around the face.
- Do not let bottom details compete with the eyes/title.

### App Notes

- Needs generated or uploaded fantasy portrait art first.
- Needs title presets for chrome/block title plus script tag.
- Needs clean red date/promo bar components.
- Auto-layout should protect the face while allowing title overlap across chest/lower face.

## Recipe: Cinematic Creature Cover

- `Recipe ID`: `sample02-cinematic-creature-cover`
- `Reference`: `sample02.jpg`
- `What It Is`: a full cinematic cover image where the snake, face, jungle, glowing eyes, and title are integrated into one dramatic subject composition.

### Layer Stack

1. Full-bleed cinematic creature/portrait background.
2. Large creature subject at top with eyes and mouth as focal point.
3. Human face subject lower center with glowing eyes.
4. Rendered title graphic embedded between creature and face.
5. Vertical date and time lanes on left/right.
6. DJ and offer copy below the face.
7. Venue name and sponsor/logo footer.
8. Small embers, foreground leaves, and vignette.

### Text Zones

- Top brand/logo corner lane.
- Main rendered title zone inside the subject composition.
- Side date/time lanes.
- Bottom DJ/offer/venue lane.
- Sponsor/logo footer lane.

### Typography

- Main title should be rendered artwork, not plain editable text.
- Title can mix sharp dimensional letters with brush/script letters.
- Side date/time should be vertical, condensed, and high-contrast.
- Venue footer should be bold but smaller than title and face.

### Color Grade

- Palette: deep teal, black-green jungle shadows, warm orange eyes, icy cyan title highlights.
- Eye glow is the key accent; other glows should support it.
- Strong vignette and foreground blur increase depth.

### Do Not

- Do not build this from separate random stickers.
- Do not use normal text for the main title if a rendered title is needed.
- Do not flatten the creature and face into equal background noise.

### App Notes

- Needs AI/generated cinematic cover art first.
- Needs rendered title/image layer support for the main title.
- Needs side text lane presets for date/time.
- Needs foreground atmosphere controls: leaves, embers, blur, vignette.

## Recipe: Luxury Mask Event Layout

- `Recipe ID`: `sample03-luxury-mask-event-layout`
- `Reference`: `sample03.jpg`
- `What It Is`: a premium event layout with a brand cluster, elegant title stack, horizontal date/time row, luxury portrait subject, offer band, and venue footer.

### Layer Stack

1. Full-bleed dark luxury venue/background with purple/green lighting.
2. Top brand/logo cluster.
3. Elegant title stack near upper third.
4. Subtitle/genre row.
5. Horizontal date/time row with thin divider.
6. Subtle oversized background text behind the subject.
7. Extracted subject portrait lower center, cropped large with mask/sunglasses as focal object.
8. Featuring/DJ row.
9. Offer band and RSVP/venue footer.
10. Color arcs, foliage, and soft vignette.

### Text Zones

- Top brand cluster.
- Title/subtitle stack.
- Date/time horizontal row.
- Subject-integrated lower center.
- Bottom offer, RSVP, and venue footer.

### Typography

- Title pairs clean geometric uppercase with script.
- Date/time should be large, minimal, and aligned to a horizontal rule.
- Offer band should be compact and framed.
- Footer text can be dense but must stay in clean lanes.

### Color Grade

- Palette: black/purple base, emerald/teal accents, white title, gold brand marks.
- Jewelry and glasses should set the accent palette.
- Background remains dark enough for white title clarity.

### Do Not

- Do not let the brand cluster crowd the title.
- Do not place date/time randomly; it belongs on a clean horizontal row.
- Do not bury the offer and RSVP copy without a lane.

### App Notes

- Needs portrait/background image with a luxury object or accessory.
- Needs subject isolation so the portrait/accessory can sit above behind-subject typography.
- Needs explicit layer controls for `background -> ghost title/text -> extracted subject -> foreground info`.
- Needs geometric plus script title preset.
- Needs date/time row component with divider.
- Needs offer band/footer component that can hold dense event logistics.

## Recipe: Giant Face Vertical Type Poster

- `Recipe ID`: `sample04-giant-face-vertical-type-poster`
- `Reference`: `sample04.jpg`
- `What It Is`: a bold design-system poster where a giant cropped face anchors the flyer and oversized vertical type becomes the central layout structure.

### Layer Stack

1. Full-bleed saturated portrait background with giant cropped face.
2. Sunglasses/lens copy integrated into the portrait.
3. Small top date/time card.
4. Massive stacked vertical title block over chest/center.
5. Red date card on left side.
6. Right detail stack.
7. Bottom music/hypeman row.
8. Venue footer bar.

### Text Zones

- Lens copy inside sunglasses.
- Top right date/time card.
- Main vertical title block.
- Left date card.
- Right attractions/details stack.
- Bottom performer and venue lanes.

### Typography

- Main title should be ultra-condensed, huge, stacked, and tightly aligned.
- Lens copy should be script and follow the lens placement.
- Date card text should be tall condensed white on red.
- Bottom performer/venue copy should be clean block text.

### Color Grade

- Palette: hot pink/red background, warm gold title, black bottom field, glossy skin highlights.
- Gold accessories should connect to the title color.
- Black bottom field creates contrast for logistics.

### Do Not

- Do not make the face small.
- Do not scatter text; the type block is the structure.
- Do not use standard horizontal headline placement for this recipe.

### App Notes

- Needs aggressive portrait crop controls.
- Needs huge stacked type presets.
- Needs lens/text placement controls for sunglasses copy.
- Needs red date card and right detail stack components.
