
// lib/presets.ts

// === GOD-TIER BASE CINEMATIC PROMPT ==========================================

export const GOD_TIER_BASE = `
unreal engine 5 render, cinematic photography, 85mm lens, f/1.4 aperture, shallow depth of field,
perfect composition, volumetric lighting, soft rim light, bloom, HDR color grade,
studio film grain, photoreal textures, global illumination,
center-framed shot, empty midsection reserved for text overlay,
silhouettes of people dancing, hands raised, party energy, motion blur,
fog, haze, strobe lights, reflections on floor, nightclub ambience
`;

// === PRESETS ================================================================

export const PRESETS = [
  {
    key: 'edm_tunnel',
    prompt: `A neon laser tunnel at night, vibrant EDM rave atmosphere, lasers and fog, crowd silhouette, ${GOD_TIER_BASE}`,
  },
  {
    key: 'edm_stage_co2',
    prompt: `Massive EDM stage with CO₂ jets, festival lights, vibrant energy, ${GOD_TIER_BASE}`,
  },
  {
    key: 'ladies_pinkchrome',
    prompt: `Glossy pink chrome textures, nightclub interior, ladies night vibe, ${GOD_TIER_BASE}`,
  },
  {
    key: 'kpop_pastel_led',
    prompt: `Soft pastel LED stage, K-pop idol atmosphere, confetti lights, ${GOD_TIER_BASE}`,
  },
  {
    key: 'hiphop_graffiti',
    prompt: `Graffiti alley with urban lights and hip-hop dancers, ${GOD_TIER_BASE}`,
  },
  {
    key: 'hiphop_lowrider',
    prompt: `Lowrider cars under neon lights, street party atmosphere, ${GOD_TIER_BASE}`,
  },
  {
    key: 'dnb_bunker',
    prompt: `Concrete underground bunker club, drum and bass vibe, strobe lighting, ${GOD_TIER_BASE}`,
  },
  {
    key: 'rnb_velvet',
    prompt: `Velvet lounge with smoke, intimate lighting, R&B aesthetic, ${GOD_TIER_BASE}`,
  },
  {
    key: 'disco_mirrorball',
    prompt: `Classic disco mirrorball reflections, retro lights, dance floor, ${GOD_TIER_BASE}`,
  },
  {
    key: 'latin_street_tropical',
    prompt: `Tropical Latin street party, palm trees, warm sunset lighting, ${GOD_TIER_BASE}`,
  },
  {
    key: 'afrobeat_rooftop',
    prompt: `Golden rooftop sunset with Afrobeats vibe, people dancing, ${GOD_TIER_BASE}`,
  },
  {
    key: 'techno_warehouse',
    prompt: `Industrial warehouse with fog, techno rave lights, ${GOD_TIER_BASE}`,
  },
];
