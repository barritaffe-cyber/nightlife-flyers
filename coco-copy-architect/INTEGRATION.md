# Integration Guide

## 1. Run after Composition Director

```ts
const copy = architectCocoCopy({
  event,
  scene,
  creativeDirection,
});
```

## 2. Build immutable render model

```ts
const copyModel = buildCopyRenderModel(copy.winner);
```

## 3. Typography Stack consumes CopyRenderModel

Typography Stack should map each item to typography styling, but must not:

- alter group order
- rewrite text
- unhide hidden sources
- split merged sources
- add separate legacy text nodes
- exceed line limits
- exceed visual power limits

## 4. Source ownership

```ts
if (copyModel.owns.includes("details")) {
  skipLegacyDetailsRenderer();
}
```

## 5. Preview and export

Preview and export both consume the same `CopyRenderModel`.

## 6. Compliance

After rendering:

```ts
const compliance = validateRenderedCopy(copy.winner, renderedSnapshot);
```

Block export when compliance blockers exist.
