# Integration Guide

## 1. Run after Art Director

The Art Director evaluates one rendered state.
The Critique Loop repeatedly improves that state.

```ts
const critique = await runCocoCritiqueLoop({
  initialSnapshot,
  initialEvaluation: artDirectorEvaluation,
  adapters: {
    applyPatches,
    renderSnapshot,
    evaluateArtwork,
  },
});
```

## 2. Adapter responsibilities

### applyPatches

Receives the current render snapshot and one candidate's patches.

It should update the authoritative design model, not just temporary DOM state.

### renderSnapshot

Renders the updated authoritative design model and returns a new snapshot.

### evaluateArtwork

Runs the Art Director again against the new rendered snapshot.

## 3. The loop must remain closed

```text
Evaluate
→ Select one issue
→ Generate several fixes
→ Predict outcomes
→ Choose one
→ Apply
→ Render
→ Re-evaluate
→ Accept or roll back
→ Repeat
```

## 4. User-facing behavior

Coco should show one message at a time.

```ts
const message = buildCocoCritiqueMessage(
  iteration.selectedFinding,
  result.memory
);
```

Do not expose:

- scan
- rescan
- issue count
- layout changed
- rule engine
- score delta

Use design language:

- “The title needs to lead.”
- “This text is getting lost.”
- “The spacing rhythm feels uneven.”
- “The subject needs to stay clear.”

## 5. Memory

Persist:

- dismissed findings
- accepted candidates
- rejected candidates
- patch signatures
- target cooldowns
- category cooldowns

This prevents Coco from repeating the same advice.

## 6. Export

The Critique Loop does not replace the Export Gate.

Export is ready only when:

- final Art Director allows export
- preview/export parity is true
- no new blockers were introduced
