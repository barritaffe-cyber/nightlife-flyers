# Integration Guide

## 1. Capture a rendered snapshot

The Art Director must evaluate the actual rendered result, not only upstream intent.

```ts
const renderedSnapshot = captureRenderedFlyerSnapshot();
```

The snapshot should include:

- role rectangles
- text content
- line count
- local contrast
- visual power
- font family
- effects
- subject, face, gaze, and product regions
- preview/export parity
- clipping and safe-margin information

## 2. Run the Art Director

```ts
const art = directCocoArtwork({
  scene,
  creativeDirection,
  composition,
  copyArchitecture,
  typography,
  color,
  effects,
  renderedSnapshot,
});
```

## 3. Show only the strongest issue

```ts
const message = art.strongestFinding?.userFacingMessage;
```

Do not show every finding at once.

## 4. Apply recommended patches

When auto-fix is allowed:

```ts
applyDesignPatches(art.recommendedPatches);
```

Then render again and run the Art Director again using a new rendered snapshot.

## 5. Export gate

```ts
if (!art.exportDecision.allowed) {
  blockExport(art.exportDecision.message);
}
```

## 6. Required behavior

The Art Director must:

- evaluate the rendered result
- protect upstream contracts
- fix one high-value weakness at a time
- generate several fixes
- compare predicted outcomes
- apply the best fix
- stop when expected gain is too small
- never allow preview/export mismatch
