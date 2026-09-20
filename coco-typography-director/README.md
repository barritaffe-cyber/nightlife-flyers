# Coco Typography Director

A production-oriented typography decision layer for Nightlife Flyers.

## Position in the pipeline

Scene Interpretation
→ Creative Director
→ Composition Director
→ Copy Architect
→ Typography Director
→ Typography Stack Model
→ Renderer
→ Art Director / Compliance

The Typography Director does not place raw DOM nodes independently. It converts copy groups,
composition authority, available fonts, and creative direction into one coherent typography
system that downstream preview and export renderers must obey.

## Responsibilities

- normalize and classify available fonts
- choose headline, accent, body, venue, badge, and presenter type personalities
- select actual font families with fallbacks
- build size, weight, tracking, line-height, case, and effects contracts
- enforce headline dominance
- cap accent/body/date/venue/badge/presenter visual power
- produce candidate typography systems
- score hierarchy, mood fit, premium quality, readability, originality, rhythm, and renderability
- select a winner through tournament comparison
- produce an immutable TypographySystemModel
- validate rendered typography against the contract
- preserve preview/export parity

## Basic usage

```ts
import { directCocoTypography } from "./typographyDirector";

const result = directCocoTypography({
  scene,
  creativeDirection,
  composition,
  copyArchitecture,
  availableFonts,
});

console.log(result.winner);
```

## Core output

```ts
{
  headline: {
    fontFamily: "Bebas Neue",
    sizeScale: 1,
    weight: 700,
    tracking: -0.03,
    lineHeight: 0.82,
    visualPower: 100
  },
  accent: {
    fontFamily: "OpenScript",
    sizeScale: 0.42,
    weight: 500,
    tracking: 0,
    lineHeight: 0.9,
    visualPower: 40
  },
  metadata: {
    fontFamily: "LEMONMILK-Regular",
    sizeScale: 0.25,
    weight: 600,
    tracking: 0.08,
    lineHeight: 0.9,
    visualPower: 24
  }
}
```
