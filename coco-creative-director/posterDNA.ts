import type { PosterDNA, PosterIdentity, SceneInterpretationLike } from "./types.ts";
export const DNA_IDENTITIES:Record<PosterDNA,PosterIdentity[]>={
  "editorial-fashion":["fashion-campaign","luxury-editorial","lifestyle-editorial"],
  "luxury-hospitality":["luxury-editorial","product-luxury","lifestyle-editorial"],
  "nightlife-promo":["premium-nightlife","high-energy-club","minimal-event"],
  "music-festival":["high-energy-club","cinematic-event","artist-led"],
  "urban-culture":["artist-led","premium-nightlife","high-energy-club"],
  "retro-era":["retro-cultural","premium-nightlife","minimal-event"],
  "minimal-swiss":["minimal-event","luxury-editorial","fashion-campaign"],
  "cinematic-key-art":["cinematic-event","artist-led","premium-nightlife"],
  "product-campaign":["product-luxury","lifestyle-editorial","luxury-editorial"],
  "tropical-lifestyle":["lifestyle-editorial","premium-nightlife","luxury-editorial"],
  "underground-rave":["underground-industrial","high-energy-club","minimal-event"],
  "social-day-party":["lifestyle-editorial","premium-nightlife","minimal-event"]
};
export function recommendPosterDNA(scene:SceneInterpretationLike):PosterDNA[]{
 const s=scene.creativeDecisions.story; const m:Record<string,PosterDNA[]>={
  "luxury-tropical-brunch":["tropical-lifestyle","social-day-party","editorial-fashion"],
  "premium-ladies-night":["editorial-fashion","luxury-hospitality","nightlife-promo"],
  "afrobeats-sunset":["tropical-lifestyle","music-festival","social-day-party"],
  "rnb-lounge":["luxury-hospitality","cinematic-key-art","editorial-fashion"],
  "vip-bottle-service":["luxury-hospitality","product-campaign","nightlife-promo"],
  "latin-night":["music-festival","social-day-party","nightlife-promo"],
  "hiphop-showcase":["urban-culture","cinematic-key-art","nightlife-promo"],
  "throwback-party":["retro-era","nightlife-promo","urban-culture"],
  "rooftop-lifestyle":["editorial-fashion","social-day-party","tropical-lifestyle"],
  "pool-day-party":["social-day-party","tropical-lifestyle","music-festival"],
  "high-energy-club":["nightlife-promo","music-festival","urban-culture"],
  "edm-rave":["music-festival","underground-rave","nightlife-promo"],
  "techno-underground":["underground-rave","minimal-swiss","cinematic-key-art"],
  "editorial-fashion":["editorial-fashion","minimal-swiss","luxury-hospitality"]};
 return m[s]??["nightlife-promo","cinematic-key-art","minimal-swiss"];
}
