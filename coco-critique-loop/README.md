# Coco Critique Loop

A production-oriented iterative critique and refinement system for Nightlife Flyers.

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
→ Critique Loop
→ Export Gate

The Critique Loop sits after the Art Director. Its job is not to re-design the flyer from scratch.
Its job is to repeatedly:

1. evaluate the rendered result
2. choose the single highest-value weakness
3. generate multiple targeted fixes
4. predict benefit, risk, and side effects
5. select one fix
6. apply it through a patch adapter
7. render again
8. re-evaluate
9. stop when no meaningful gain remains

## Responsibilities

- consume Art Director findings and scores
- select one issue at a time
- avoid repeated or dismissed advice
- respect accepted user moves
- generate candidate improvements
- predict visual gain and risk
- run candidate tournaments
- apply safe patches
- maintain iteration memory
- prevent loops and regressions
- compare before/after snapshots
- stop on plateau, regression, or confidence loss
- preserve preview/export parity
- emit final critique history
- expose user-facing Coco messages

## Basic usage

```ts
import { runCocoCritiqueLoop } from "./critiqueLoop";

const result = await runCocoCritiqueLoop({
  initialSnapshot,
  artDirector,
  adapters: {
    applyPatches,
    renderSnapshot,
    evaluateArtwork,
  },
});

console.log(result.finalScore);
console.log(result.history);
```
