# Coco Copy Architect

A production-oriented copy architecture layer for Nightlife Flyers.

## Position in the pipeline

Scene Interpretation
→ Creative Director
→ Composition Director
→ Copy Architect
→ Typography Director
→ Typography Stack
→ Renderer
→ Art Director / Compliance

The Copy Architect does not choose coordinates or fonts. It converts raw event fields into a
designed information system that downstream typography and rendering must obey.

## Responsibilities

- normalize raw event copy
- infer semantic meaning from each field
- determine information priority
- merge duplicated or fragmented copy
- remove low-value copy
- rewrite long body copy into premium metadata
- build identity, emotion, experience, logistics, venue, badge, presenter, and footer groups
- define line limits and display treatments
- generate multiple copy architectures
- score and select the best architecture
- emit an immutable render contract
- validate the rendered result against the contract

## Basic usage

```ts
import { architectCocoCopy } from "./copyArchitect";

const result = architectCocoCopy({
  event: {
    name: "Mojito Mondaze",
    headline: "MOJITO MONDAZE",
    accent: "Brunch Vibes",
    details: "Tropical rhythms, Afrobeats, Latin, cocktails and island energy",
    date: "Monday",
    time: "4PM til late",
    venue: "Sky Lounge Miami",
    price: "Entry $50",
  },
  creativeDirection,
  scene,
});

console.log(result.winner);
```

## Core output

```ts
{
  groups: [
    { role: "identity", text: "MOJITO\nMONDAZE", treatment: "hero" },
    { role: "emotion", text: "Brunch Vibes", treatment: "accent" },
    { role: "experience", text: "TROPICAL RHYTHMS • AFROBEATS • LATIN\nCOCKTAILS & ISLAND ENERGY", treatment: "metadata" },
    { role: "logistics", text: "MONDAY • 4PM TIL LATE", treatment: "metadata" },
    { role: "venue", text: "SKY LOUNGE MIAMI", treatment: "footer" },
    { role: "badge", text: "ENTRY\n$50", treatment: "badge" }
  ]
}
```
