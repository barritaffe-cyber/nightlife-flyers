# Integration

1. Run Scene Interpreter.
2. Run Creative Director.
3. Run Composition Director with both outputs.
4. Convert winner to Typography Stack authority.
5. Build one TypographyStackModel from winner.blocks and winner.rhythm.
6. Render preview and export from the same model.
7. Run rendered-composition compliance before export.

```ts
const composition = directCocoComposition({
  scene,
  creativeDirection: creative.winner,
  format,
  text,
  subject,
  negativeSpace,
  busyZones,
});

const stackAuthority = toTypographyStackAuthority(composition.winner);
```
