import {
  applyCompositionToZones,
  buildCocoCompositionSystemFromLayout,
  chooseCocoComposition as chooseBaseCocoComposition,
} from "../compositionDirector";
import type { CocoCompositionPickerInput } from "./types";

export { applyCompositionToZones, buildCocoCompositionSystemFromLayout };

export function chooseCocoComposition(input: CocoCompositionPickerInput) {
  return chooseBaseCocoComposition({
    backgroundOnlyHero: input.backgroundOnlyHero,
    brief: input.brief,
    eventName: input.eventName,
    faceZone: input.faceZone,
    format: input.format,
    hasSubject: input.hasSubject,
    layoutId: input.layout.layoutId,
    scene: input.scene ?? null,
    subjectZone: input.subjectZone,
    text: input.text,
    zones: input.layout.zones,
  });
}
