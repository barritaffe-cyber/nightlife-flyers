# Coco Composition Director

Production-oriented composition engine for Nightlife Flyers.

## Pipeline

Scene Interpretation
→ Creative Direction
→ Composition Director
→ Copy Architecture
→ Typography Stack
→ Renderer
→ Art Director / Critique

The Composition Director generates complete composition systems, not isolated zones.
It treats the poster as a relationship between hero image, typography system, negative space,
visual weight, protected regions, reading order, rhythm, and one controlled signature interaction.

## Responsibilities

- consume Scene Interpretation and Creative Direction as authority
- generate complete composition candidates
- select composition family
- place subject and typography as counterweights
- create a single typography field and information stack
- protect faces, eyes, gaze, hands, drinks, logos, and products
- score visual balance, hierarchy, negative space, eye flow, and premium rhythm
- refine top candidates
- compare finalists head-to-head
- emit an immutable composition contract for preview and export
- validate rendered output against the winning composition

## Main API

```ts
import { directCocoComposition } from "./compositionDirector";

const result = directCocoComposition({
  scene,
  creativeDirection,
  format: "square",
  text,
});

console.log(result.winner);
```
