import type {
  CocoCompositionSystem,
  CocoTournamentRect,
  CocoTournamentZoneMap,
} from "../layoutTournament/types.ts";

export type CocoReferenceZoneMap = Partial<CocoTournamentZoneMap> & {
  compliance?: CocoTournamentRect;
};

export function buildAuthoritativeReferenceComposition(input: {
  base: CocoCompositionSystem;
  layoutId: string;
  zones: CocoReferenceZoneMap;
}): CocoCompositionSystem {
  const blocks: CocoCompositionSystem["blocks"] = [];
  const add = (
    role: CocoCompositionSystem["blocks"][number]["role"],
    source: CocoCompositionSystem["blocks"][number]["source"],
    rect: CocoTournamentRect | undefined,
    priority: 1 | 2 | 3 | 4 | 5
  ) => {
    if (!rect) return;
    blocks.push({
      role,
      source,
      rect: { ...rect },
      align: rect.align ?? input.base.alignment,
      priority,
    });
  };
  add("headline", "headline", input.zones.headline, 1);
  add("accent", "script", input.zones.script, 2);
  add("primaryMeta", "details", input.zones.leftInfo, 3);
  add("secondaryMeta", "details2", input.zones.rightInfo, 3);
  add("footer", "presenter", input.zones.presenter, 3);
  add("dateTime", "date", input.zones.date, 3);
  add("badge", "price", input.zones.price, 3);
  add("venue", "venue", input.zones.venue, 4);
  add("footer", "subtag", input.zones.subtag, 5);
  add("footer", "compliance", input.zones.compliance, 5);
  return {
    ...input.base,
    patternId: "center-hero-event-poster",
    textColumn: input.zones.headline ?? input.base.textColumn,
    blocks,
    allBlocks: blocks,
    explanation: `Authoritative structured template reference: ${input.layoutId}`,
  };
}
