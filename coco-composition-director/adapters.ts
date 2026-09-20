import type { CompositionCandidate } from "./types.ts";
export function toTypographyStackAuthority(c:CompositionCandidate){return{rect:c.textColumn,alignment:c.alignment,owns:c.owns,blocks:c.blocks.filter(b=>!b.hidden),rhythm:c.rhythm,eyeFlow:c.eyeFlow,signatureMove:c.signatureMove}}
export function toRendererAuthority(c:CompositionCandidate){return{id:c.id,subjectRect:c.subjectRect,textColumn:c.textColumn,blocks:c.blocks,owns:c.owns,alignment:c.alignment,family:c.family,signatureMove:c.signatureMove}}
export function toExportAuthority(c:CompositionCandidate){return toRendererAuthority(c)}
