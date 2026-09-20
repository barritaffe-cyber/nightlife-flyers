# Ladies CSS Editorial rebuild

The selected master is `public/generated-flyers/ladies-css-coco.nflyer`.
The other Ladies Night template is unchanged.

Rebuild with:

```sh
node --experimental-strip-types scripts/build-ladies-css-editorial-master.mjs
```

Use this dedicated entry point: it archives the displaced file, generates the
Square/Story HTML from `lib/recipes/ladiesCssEditorial.ts`, compiles the document,
and restores native Circular Text metadata and headline shadow controls.
Calling the raw compiler alone omits that finalization.

The original source `ladies-reference-master.html` remains intact. The new
`ladies-css-editorial-master.html` is the generated adaptation. At a 540px
canvas width the compiler uses `editorTextScale: 1`.

Original project archive (before this rebuild):
`recipe-file-backups/ladies-css-rebuild/ec3261ec18933ac92ac54bafe95d7f2ff497612b0129d9b7a9c408ae894d5f0a.nflyer`.
Its filename is its SHA-256. Later rebuilds also archive the file they replace.

The original Avigea headline, OpenScript weekday, photo, palette and seven
recipe decorations are retained. Venue name, venue second line, address,
policy labels/values, date, time, age and footer are separate bindings.
The circular text keeps the compiled geometry scale and layer position; applying
its native scale again shrinks it, and its old negative layer places it below
the photograph. Keep `isCircularText`, label and native editing metadata.

The portable recipe loader uses the rebuilt file. New brief fields replace only
provided values; a replacement venue clears the old second line. The photograph
is explicitly marked as a background so selecting another background replaces it.

Checks:

```sh
node --experimental-strip-types --test tests/coco-ladies-css-editorial-assets.test.ts tests/coco-ladies-css-editorial-recipe.test.ts
node scripts/verify-ladies-rebuild.mjs
```

All 18 Ladies checks passed. Browser checks passed for both formats, policy-label
and address clear/retype, headline editing, and save/reopen. Browser checks use an isolated guest context. Artifacts are in
`/tmp/ladies-rebuild-check`. Full paid PNG export is not part of this check.
The wider portable-runtime suite currently has unrelated failures in its old
registry enumeration and City Nights story sizing assertion.
