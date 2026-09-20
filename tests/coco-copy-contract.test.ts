import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  fallbackCocoGeneratedCopy,
  materializeCocoComposerCopy,
  sanitizeCocoGeneratedCopy,
} from "../lib/coco/copy.ts";

const FACT_FIELDS = [
  "presenter",
  "venue",
  "date",
  "price",
  "socials",
  "compliance",
  "djLineup",
  "rsvpContact",
] as const;

test("fallback copy keeps unknown facts empty and uses a short event-specific subtag", () => {
  const copy = fallbackCocoGeneratedCopy("Vinyl Listening Room", {
    nightlifeStyle: "rnb-lounge",
    eventDescription: "An intimate R&B listening party for vinyl collectors.",
  });

  for (const field of FACT_FIELDS) assert.equal(copy[field], "");
  assert.equal(copy.subtag, "Slow Grooves • Late Hours");
  assert.ok(copy.subtag.length <= 48);
  assert.equal(copy.subtag.includes("\n"), false);
  assert.doesNotMatch(copy.subtag, /unforgettable atmosphere|timeless memories/i);
});

test("a restrained visual brief cannot inherit rejected neon fallback copy", () => {
  const copy = fallbackCocoGeneratedCopy("Neon Electric Nights", {
    nightlifeStyle: "general-nightlife",
    eventDescription: "Clean understated atmosphere.",
  });

  assert.match(copy.details, /POLISHED LATE NIGHT/);
  assert.equal(copy.subtag, "Understated • After Dark");
  assert.doesNotMatch(
    [copy.details, copy.details2, copy.subtag].join(" "),
    /laser|smoke|bass heavy|system loud/i
  );
});

test("copy sanitizer removes legacy factual placeholders and rejects paragraph subtags", () => {
  const copy = sanitizeCocoGeneratedCopy(
    {
      presenter: "PRESENTER HERE",
      venue: "VENUE NAME\nADDRESS",
      date: "DATE\n10PM",
      price: "",
      socials: "@YOURHANDLE",
      compliance: "",
      djLineup: "MUSIC BY\nDJ NAME",
      rsvpContact: "RSVP / TABLES 0123456789",
      subtag:
        "A NIGHT DESIGNED FOR STYLE, MUSIC, AND UNFORGETTABLE ATMOSPHERE\nFROM THE FIRST TOAST TO THE FINAL SONG\nELEVATED ENERGY AND TIMELESS MEMORIES",
    },
    "Vinyl Listening Room",
    {
      nightlifeStyle: "rnb-lounge",
      eventDescription: "An intimate R&B listening party for vinyl collectors.",
    }
  );

  for (const field of FACT_FIELDS) assert.equal(copy[field], "");
  assert.equal(copy.subtag, "Slow Grooves • Late Hours");
  assert.ok(copy.subtag.length <= 48);
});

test("composer copy materialization preserves supplied facts and rejects invented ones", () => {
  const generated = {
    headline: "Vinyl",
    subheadline: "Listening Room",
    details: "RARE PRESSINGS\nDEEP CUTS\nINTIMATE ROOM",
    details2: "R&B SELECTORS\nANALOG SOUND\nLATE SESSION",
    subtag: "Needle Drops After Dark",
    musicPolicy: "R&B • SOUL • RARE GROOVES",
    presenter: "AI PRESENTS",
    venue: "MADE UP VENUE",
    date: "FRIDAY\n10PM",
    price: "$50",
    socials: "@MADEUP",
    compliance: "18+",
    djLineup: "MUSIC BY\nDJ NAME",
    rsvpContact: "555-0100",
  };
  const supplied = {
    presenterName: "Level 47",
    venueName: "The Vault",
    address: "3712 East Main Street",
    date: "Saturday, August 30",
    startTime: "10 PM",
    endTime: "2 AM",
    entryFee: "$25 early / $35 door",
    socials: "level47.store",
    ageRequirement: "21+ with ID",
    djs: "DJ Nova • DJ Lux",
    rsvpContact: "+1 (555) 0199",
  };

  const copy = materializeCocoComposerCopy(
    generated,
    "Vinyl Listening Room",
    supplied,
    { nightlifeStyle: "rnb-lounge" }
  );

  assert.equal(copy.presenter, supplied.presenterName);
  assert.equal(copy.venue, `${supplied.venueName}\n${supplied.address}`);
  assert.equal(copy.date, `${supplied.date}\n${supplied.startTime} — ${supplied.endTime}`);
  assert.equal(copy.price, supplied.entryFee);
  assert.equal(copy.socials, supplied.socials);
  assert.equal(copy.compliance, supplied.ageRequirement);
  assert.equal(copy.djLineup, supplied.djs);
  assert.equal(copy.rsvpContact, supplied.rsvpContact);
  assert.equal(copy.details, generated.details);

  const withoutFacts = materializeCocoComposerCopy(
    generated,
    "Vinyl Listening Room",
    {},
    { nightlifeStyle: "rnb-lounge" }
  );
  for (const field of FACT_FIELDS) assert.equal(withoutFacts[field], "");
  assert.equal(withoutFacts.subtag, generated.subtag);
});

test("the API contract requests empty unknown facts and a bounded accent subtag", () => {
  const routeSource = readFileSync(
    new URL("../app/api/coco-copy/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /Return an empty string when a fact is unknown/);
  assert.match(routeSource, /three to seven words and no more than 48 characters/);
  assert.match(routeSource, /Never emit placeholders/);
  assert.doesNotMatch(routeSource, /between 115 and 180 characters/);
});
