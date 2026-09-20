# Happy Hour — The Branch Rathskeller

New gallery template `branch_happy_hour`, with independent Square and Story layouts. Existing Happy Hour entries are preserved.

Supplied backgrounds: `assets/happy-hr-square.jpg` and `assets/happy-hr-story.jpg`. White Didot Bold HAPPY and gold Dear Script (Demo_Font) Hour; LEMONMILK-Light supporting copy. The reference tree is approximated by a local branching SVG emblem; brand text is editable. Location and phone icons are local SVGs. No new font or QR.

Fourteen visible text owners plus the initially empty details label retain independent bindings: brand lines, headline/subheadline, weekday schedule, hours, discount, eligible drinks, mood, venue, address, reservation and corner motto. Story places the title and offer below the cocktail. Explicit headline width prevents the editor wrapping the final Y. Script vertical scaling keeps the schedule clear.

Files use `branch-happy-hour` prefix: HTML master and portable `.nflyer` in `public/generated-flyers`, compiler builder and preview/check scripts in `scripts`, gallery variants in `lib/template-data`. Builder protects a newer `branch-happy-hour-saved-source.json` accepted save.

Validation: compiler reports no warnings or unsupported objects; both structural tests and focused ESLint pass. Full editor checks passed for every visible text owner, labels, alignment, project save/reopen, headline/subheadline effects, typography, layers, and format switching. Final text-box width correction followed by recompilation, refreshed editor/source previews and structural tests. No commit or deployment.
