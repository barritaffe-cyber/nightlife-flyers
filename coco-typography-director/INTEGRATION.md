# Integration Guide

## 1. Run after Copy Architect

```ts
const typography = directCocoTypography({
  scene,
  creativeDirection,
  composition,
  copyArchitecture: copy.winner,
  availableFonts,
});
```

## 2. Build immutable render model

```ts
const typographyModel = buildTypographyRenderModel(typography.winner);
```

## 3. Typography Stack consumes the model

Typography Stack may calculate pixel sizes from `sizeScale`, but it must not change:

- font family
- fallback family
- weight
- tracking
- line height
- case
- visual power relationships
- role order
- effects limits
- signature move
- source ownership

## 4. Preview and export

Both preview and export consume the same `TypographyRenderModel`.

## 5. Legacy nodes

When the model owns a role, skip the legacy renderer:

```ts
if (typographyModel.roles.some(role => role.role === "venue")) {
  skipLegacyVenueNode();
}
```

## 6. Compliance

```ts
const compliance = validateRenderedTypography(
  typography.winner,
  renderedSnapshot
);
```

Block export when compliance blockers exist.
