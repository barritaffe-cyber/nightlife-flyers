import assert from "node:assert/strict";
import test from "node:test";

import {
  eventCopyDescriptionForCocoIntent,
  normalizeCreativeIntentText,
  presentationForCocoCreativeIntent,
  resolveCocoCreativeIntent,
} from "../components/coco/creativeIntent.ts";

test("all white minimal is an authoritative minimal visual contract", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "An ALL-WHITE, minimal experience.",
    eventName: "The Guest",
  });

  assert.ok(intent);
  assert.equal(intent.authority, "explicit-user-brief");
  assert.equal(intent.source, "event-description");
  assert.equal(intent.presetId, "all-white-minimal");
  assert.equal(intent.directionId, "modern-minimal");
  assert.equal(intent.palette.family, "white-monochrome");
  assert.equal(intent.palette.policyId, "mono-accent");
  assert.equal(intent.palette.saturation, "restrained");
  assert.equal(intent.palette.imagePaletteInfluence, "none");
  assert.equal(intent.palette.allowPureWhite, true);
  assert.equal(intent.palette.maxStrongColors, 1);
  assert.equal(intent.typography.personality, "minimal");
  assert.equal(intent.typography.headlineTreatment, "clean");
  assert.ok(intent.typography.forbiddenTreatments.includes("glow"));
  assert.equal(intent.effects.policyId, "subtle-texture");
  assert.equal(intent.effects.allowGlow, false);
  assert.equal(intent.effects.oneSignatureEffect, false);
});

test("black and gold luxury controls direction, type, color, and effects", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "Black & gold luxury with an intimate premium feel",
    eventName: "Midnight Society",
  });

  assert.ok(intent);
  assert.equal(intent.presetId, "black-gold-luxury");
  assert.equal(intent.directionId, "luxury-editorial");
  assert.equal(intent.palette.family, "black-gold");
  assert.equal(intent.palette.policyId, "champagne-black");
  assert.equal(intent.typography.personality, "luxury");
  assert.equal(intent.typography.headlineTreatment, "serifLuxury");
  assert.equal(intent.effects.policyId, "soft-glow");
  assert.equal(intent.effects.intensity, "restrained");
});

test("neon electric selects the vivid club contract", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "Electric neon energy and a packed dance floor",
    eventName: "Voltage",
  });

  assert.ok(intent);
  assert.equal(intent.presetId, "neon-electric");
  assert.equal(intent.directionId, "high-energy-club");
  assert.equal(intent.palette.family, "electric-neon");
  assert.equal(intent.palette.saturation, "vivid");
  assert.equal(intent.typography.personality, "nightclub");
  assert.equal(intent.typography.headlineTreatment, "glow");
  assert.equal(intent.effects.intensity, "high-energy");
});

test("retro disco selects throwback typography and analog color treatment", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "A retro disco celebration with mirrorball energy",
    eventName: "Studio Rewind",
  });

  assert.ok(intent);
  assert.equal(intent.presetId, "retro-disco");
  assert.equal(intent.directionId, "retro-celebration");
  assert.equal(intent.palette.policyId, "retro-pop");
  assert.equal(intent.typography.personality, "throwback");
  assert.equal(intent.effects.policyId, "analog-glow");
});

test("an explicit description outranks a conflicting event-name style cue", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "Keep the artwork all white and minimal",
    eventName: "Neon Electric Nights",
  });

  assert.ok(intent);
  assert.equal(intent.source, "event-description");
  assert.equal(intent.directionId, "modern-minimal");
  assert.equal(intent.effects.allowGlow, false);
  assert.ok(intent.palette.forbiddenTones.includes("neon"));
});

test("the event name is a fallback intent source when description has no visual direction", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "Music from 10pm until late",
    eventName: "Retro Disco",
  });

  assert.ok(intent);
  assert.equal(intent.source, "event-name");
  assert.equal(intent.directionId, "retro-celebration");
});

test("ordinary event copy leaves existing Coco inference untouched", () => {
  assert.equal(
    resolveCocoCreativeIntent({
      eventDescription: "Music, cocktails and guest DJs",
      eventName: "Saturday Social",
    }),
    null
  );
});

test("plain childlike wording does not require design vocabulary", () => {
  const examples = [
    ["Make it simple and white. Nothing flashy.", "all-white-minimal"],
    ["It is a white party. Keep everything clean with lots of room.", "all-white-minimal"],
    ["Keep it clean, not too busy, and no bright colors.", "clean-minimal"],
    ["A fancy dress-up night with champagne. Make it expensive, not loud.", "black-gold-luxury"],
    ["This is a huge dance party. Make it bright and full of energy.", "neon-electric"],
    ["A 90s throwback that feels like an old party poster.", "retro-disco"],
  ] as const;

  for (const [eventDescription, presetId] of examples) {
    assert.equal(
      resolveCocoCreativeIntent({ eventDescription })?.presetId,
      presetId,
      eventDescription
    );
  }
});

test("plain language is read by meaning, scope, and negation", () => {
  assert.equal(
    resolveCocoCreativeIntent({ eventDescription: "Use white letters." }),
    null,
    "a text color request must not turn the whole flyer monochrome"
  );
  assert.equal(
    resolveCocoCreativeIntent({
      eventDescription: "Not a huge dance party. Keep it calm and easy to read.",
    })?.presetId,
    "clean-minimal"
  );
  assert.equal(
    resolveCocoCreativeIntent({ eventDescription: "No neon. Make it exciting." }),
    null,
    "a color ban alone must not be mistaken for a minimal style request"
  );
  assert.equal(
    resolveCocoCreativeIntent({
      eventDescription: "Make it classy, elegant and grown-up.",
    })?.presetId,
    "black-gold-luxury"
  );
  assert.equal(
    resolveCocoCreativeIntent({
      eventDescription: "A romantic dinner with a soft warm glow.",
    }),
    null,
    "a soft romantic glow is not an electric-neon instruction"
  );
});

test("white headline copy does not erase an explicitly colorful composition", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription:
      "Use cyan clouds and red flowers, make the headline huge and white, then keep the footer clean.",
  });
  assert.equal(intent?.presetId, "clean-minimal");
  assert.notEqual(intent?.presetId, "all-white-minimal");
});

test("a luxury request can explicitly avoid gold", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "Make it fancy and expensive, but do not use gold.",
  });
  assert.ok(intent);
  assert.equal(intent.directionId, "luxury-editorial");
  assert.ok(intent.palette.forbiddenTones.includes("gold"));
  assert.ok(intent.palette.requiredTones.includes("silver"));
  const presentation = presentationForCocoCreativeIntent(intent);
  assert.equal(presentation.colorways.length, 4);
  assert.ok(presentation.colorways.every((colorway) => !/gold/i.test(colorway.name)));
});

test("description negation prevents a neon event name from leaking into the design", () => {
  const intent = resolveCocoCreativeIntent({
    eventDescription: "Please do not use neon. Make it clean and white instead.",
    eventName: "Neon Electric Nights",
  });

  assert.ok(intent);
  assert.equal(intent.presetId, "all-white-minimal");
  assert.equal(intent.effects.allowGlow, false);
});

test("visual directions guide the design without becoming flyer copy", () => {
  const visualOnly = "Please do not use neon. Make it simple and white. Nothing flashy.";
  const visualIntent = resolveCocoCreativeIntent({
    eventDescription: visualOnly,
    eventName: "Neon Electric Nights",
  });
  assert.equal(
    eventCopyDescriptionForCocoIntent(visualOnly, visualIntent),
    "Clean understated atmosphere."
  );

  const mixed = "It is a white party. Keep everything clean with lots of room.";
  const mixedIntent = resolveCocoCreativeIntent({ eventDescription: mixed });
  assert.equal(
    eventCopyDescriptionForCocoIntent(mixed, mixedIntent),
    "It is a white party."
  );

  const ordinary = "Music, cocktails and guest DJs from 10pm until late.";
  assert.equal(eventCopyDescriptionForCocoIntent(ordinary, null), ordinary);

  const runOn = "It’s a birthday party and I want a blue playful flyer.";
  assert.equal(
    eventCopyDescriptionForCocoIntent(runOn, null),
    "It’s a birthday party."
  );

  assert.equal(
    eventCopyDescriptionForCocoIntent("Can you make this fun and colorful?", null),
    ""
  );
});

test("all-white presentation is monochrome, clean, and cycles only compatible options", () => {
  const intent = resolveCocoCreativeIntent({ eventDescription: "Make everything white and simple" });
  assert.ok(intent);
  const presentation = presentationForCocoCreativeIntent(intent);

  assert.equal(presentation.colorways.length, 4);
  assert.equal(presentation.fonts.headline[0], "LEMONMILK-Bold");
  assert.equal(presentation.headline.glow, 0);
  assert.equal(presentation.headline.gradient, false);
  assert.ok(presentation.effects.saturation < 0.3);
  for (const colorway of presentation.colorways) {
    for (const color of Object.values(colorway.roles)) {
      const channels = color.slice(1).match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) ?? [];
      assert.ok(Math.max(...channels) - Math.min(...channels) <= 15, `${colorway.name}: ${color}`);
    }
  }
});

test("intent resolution is deterministic across case, whitespace, and punctuation", () => {
  const variants = [
    "all white minimal",
    " ALL   WHITE   MINIMAL ",
    "All-white, minimal.",
  ].map((eventDescription) => resolveCocoCreativeIntent({ eventDescription }));

  assert.deepEqual(variants[1], variants[0]);
  assert.notDeepEqual(variants[2], variants[0], "evidence retains normalized source wording");
  assert.equal(variants[2]?.presetId, variants[0]?.presetId);
  assert.equal(normalizeCreativeIntentText("  ALL\tWHITE  "), "all white");
});
