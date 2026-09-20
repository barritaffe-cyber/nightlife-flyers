# Coco Art Director

A production-oriented final evaluation, critique, refinement, and export-gating layer
for Nightlife Flyers.

## Position in the pipeline

Scene Interpreter
→ Creative Director
→ Composition Director
→ Copy Architect
→ Typography Director
→ Color Director
→ Effects Director
→ Renderer
→ Art Director
→ Critique / Improvement Tournament
→ Export Gate

The Art Director does not create raw layout from scratch. It evaluates the rendered flyer,
compares the rendered result against all upstream contracts, identifies the strongest weakness,
generates targeted improvements, predicts impact and risk, selects the best refinement,
and repeats until no meaningful gain remains.

## Responsibilities

- ingest a rendered flyer snapshot
- evaluate hierarchy, readability, composition, balance, rhythm, color, typography,
  effects, scene interaction, premium polish, originality, brand fit, and marketing clarity
- detect contract violations across all upstream directors
- identify the single highest-value weakness
- generate multiple improvement candidates
- predict benefit and risk
- run refinement tournaments
- stop when expected gain is below threshold
- produce final art-director scores
- block export for critical failures
- explain every decision
- preserve preview/export parity

## Basic usage

```ts
import { directCocoArtwork } from "./artDirector";

const result = directCocoArtwork({
  scene,
  creativeDirection,
  composition,
  copyArchitecture,
  typography,
  color,
  effects,
  renderedSnapshot,
});

console.log(result.finalScore);
console.log(result.exportDecision);
```
