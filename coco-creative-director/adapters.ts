import type {CreativeDirection} from './types.ts';
export const toCompositionAuthority=(d:CreativeDirection)=>({family:d.composition.family,typeField:d.composition.typeField,alignment:d.composition.alignment,stackRect:d.composition.stackRect,overlapPolicy:d.composition.overlapPolicy,hardConstraints:d.constraints.filter(c=>c.severity==='hard').map(c=>c.id)});
export const toCopyArchitectureAuthority=(d:CreativeDirection)=>({groups:d.copyArchitecture,maxVisibleGroups:d.informationDensity==='minimal'?4:d.informationDensity==='low'?5:d.informationDensity==='medium'?6:8,hideLowPriority:['minimal','low'].includes(d.informationDensity)});
export const toTypographyAuthority=(d:CreativeDirection)=>({contract:d.typography,hierarchy:d.hierarchy,signatureMove:d.signatureMove});
export const toPaletteAuthority=(d:CreativeDirection)=>d.palette;
export const toEffectsAuthority=(d:CreativeDirection)=>d.effects;
