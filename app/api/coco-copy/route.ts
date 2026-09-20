import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  fallbackCocoGeneratedCopy,
  materializeCocoComposerCopy,
  normalizeCocoEventName,
} from "../../../lib/coco/copy";
import {
  eventCopyDescriptionForCocoIntent,
  nightlifeStyleForCocoIntentCopy,
  resolveCocoCreativeIntent,
} from "../../../components/coco/creativeIntent";
import type { CocoNightlifeStyle } from "../../../components/coco/intelligence";

export const runtime = "nodejs";

const COCO_COPY_SYSTEM_PROMPT = [
  "You are Coco's nightlife flyer copywriter.",
  "You receive an event name, a short user-written event description, a categorized eventBrief, Coco's inferred nightlife style, and photo hints.",
  "Return JSON only. Do not return coordinates, zones, measurements, colors, fonts, images, or layout instructions.",
  "Generate compact editable starter strings for a nightlife flyer.",
  "Use the event description as the primary source for event type, atmosphere, audience, music, offers, and flyer direction.",
  "The copy must feel specific to the description, not generic nightlife filler.",
  "Use the inferred style and photo hints when they are provided. If photo hints include cocktail, drink, martini, lounge, bottle, champagne, rooftop, DJ, beach, stage, or crowd, reflect that theme in details/details2.",
  "Use flyer-ready event-description fragments. No paragraphs, no exclamation marks.",
  "Avoid phrases like join us, get ready, do not miss, buy now, or tickets available.",
  "Headline and subheadline should be one to three words each.",
  'Use title case for headline and subheadline, for example "Sunday", not "SUNDAY".',
  "details is the primary short event description block inferred from the user's description.",
  "details2 is the secondary short event description, vibe, audience, music, or offer block inferred from the user's description.",
  "details and details2 should be three to five short lines, each line under 28 characters.",
  "Use the real estate in details and details2. Do not return generic filler like MUSIC or DJ LINEUP unless the event name implies it.",
  "Treat eventBrief as authoritative. Do not invent venue, address, date, time, price, lineup, hosts, performers, offers, contacts, age requirements, or socials. Use supplied facts exactly.",
  "Use eventDetails, experienceFeatures, dressCode, specials, offers, and musicPolicy to write relevant details, details2, subtag, musicPolicy, and addons without duplicating the same phrase across blocks.",
  "Group DJs under MUSIC BY, hosts under HOSTED BY or HYPE, and performers under LIVE when those categories are supplied.",
  "For presenter, venue, address, date, time, price, socials, lineup, RSVP contact, and age, use only supplied eventBrief facts. Return an empty string when a fact is unknown.",
  "Never emit placeholders such as presenter here, VENUE NAME, DATE, 10PM, $50, @YOURHANDLE, DJ NAME, or a fake phone number.",
  "subtag is one short event-specific accent phrase of three to seven words and no more than 48 characters.",
  "Make subtag complementary to details and grounded in the user's event description. Do not write a sentence or generic nightlife slogan.",
  "compliance must use eventBrief.ageRequirement exactly when supplied. Return an empty compliance string when the user did not supply an age; never infer an age from the event style.",
  "djLineup is a compact editable music-by block. Return an empty string when no factual lineup is known.",
  "musicPolicy is a compact genre or event-format line inferred from the event direction.",
  "rsvpContact uses only a supplied RSVP or booking contact and is empty when none was supplied.",
  "addons lists only extras explicitly supplied in eventBrief and is empty when none were supplied.",
  "Use this exact JSON shape:",
  '{"presenter":"","headline":"","subheadline":"","details":"","details2":"","venue":"","date":"","price":"","socials":"","subtag":"","compliance":"","djLineup":"","musicPolicy":"","rsvpContact":"","addons":""}',
  "Keep headline and subheadline short. Use newline characters inside details, details2, venue, date, and price when helpful.",
].join(" ");

export async function POST(req: Request) {
  let safeEventName = "";
  let safeNightlifeStyle = "";
  let safePhotoHints: string[] = [];
  let safeEventDescription = "";
  let safeEventBrief: Record<string, unknown> = {};
  try {
    const body = await req.json().catch(() => null);
    const eventName = normalizeCocoEventName(
      body && typeof body === "object" && "eventName" in body
        ? (body as { eventName?: unknown }).eventName
        : ""
    );
    if (!eventName) {
      return NextResponse.json({ error: "Missing eventName" }, { status: 400 });
    }
    safeEventName = eventName;
    const compactField = (value: unknown, limit: number) =>
      String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
    const eventBriefSource =
      body && typeof body === "object" && "eventBrief" in body && (body as { eventBrief?: unknown }).eventBrief &&
      typeof (body as { eventBrief?: unknown }).eventBrief === "object"
        ? ((body as { eventBrief: Record<string, unknown> }).eventBrief)
        : {};
    const briefField = (key: string, limit: number) => compactField(eventBriefSource[key], limit);
    const eventBrief = Object.fromEntries(
      Object.entries(eventBriefSource)
        .slice(0, 48)
        .map(([key, value]) => [
          key,
          Array.isArray(value)
            ? value.map((item) => compactField(item, 64)).filter(Boolean).slice(0, 12)
            : compactField(value, 400),
        ])
    );
    safeEventBrief = eventBrief;
    const rawEventDescription = compactField(
      body && typeof body === "object" && "eventDescription" in body
        ? (body as { eventDescription?: unknown }).eventDescription
        : eventBrief.description,
      600
    );
    const creativeIntent = resolveCocoCreativeIntent({
      eventDescription: rawEventDescription || compactField(eventBrief.description, 600),
      eventName,
    });
    const eventDescription = eventCopyDescriptionForCocoIntent(
      rawEventDescription || eventBrief.description,
      creativeIntent
    );
    eventBrief.description = eventDescription;
    safeEventDescription = eventDescription;
    const presenterName = briefField("presenterName", 80) || compactField(
      body && typeof body === "object" && "presenterName" in body
        ? (body as { presenterName?: unknown }).presenterName
        : "",
      80
    );
    const djs = briefField("djs", 160) || compactField(
      body && typeof body === "object" && "djs" in body
        ? (body as { djs?: unknown }).djs
        : "",
      160
    );
    const socials = briefField("socials", 100) || compactField(
      body && typeof body === "object" && "socials" in body
        ? (body as { socials?: unknown }).socials
        : "",
      100
    );
    const rsvpContact = briefField("rsvpContact", 120) || compactField(
      body && typeof body === "object" && "rsvpContact" in body
        ? (body as { rsvpContact?: unknown }).rsvpContact
        : "",
      120
    );
    const entryFee = briefField("entryFee", 80) || compactField(
      body && typeof body === "object" && "entryFee" in body
        ? (body as { entryFee?: unknown }).entryFee
        : "",
      80
    );
    const requestedNightlifeStyle =
      body && typeof body === "object" && "nightlifeStyle" in body
        ? String((body as { nightlifeStyle?: unknown }).nightlifeStyle || "").trim()
        : "";
    const nightlifeStyle = nightlifeStyleForCocoIntentCopy(
      creativeIntent,
      (requestedNightlifeStyle || "general-nightlife") as CocoNightlifeStyle
    );
    const photoHints =
      body && typeof body === "object" && Array.isArray((body as { photoHints?: unknown }).photoHints)
        ? ((body as { photoHints?: unknown[] }).photoHints ?? [])
            .map((hint) => String(hint || "").trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 10)
        : [];
    safeNightlifeStyle = nightlifeStyle;
    safePhotoHints = photoHints;

    const copyContext = { nightlifeStyle, photoHints, eventDescription };
    const authoritativeEventBrief = {
      ...eventBrief,
      presenterName,
      djs,
      socials,
      rsvpContact,
      entryFee,
    };
    safeEventBrief = authoritativeEventBrief;
    const fallback = materializeCocoComposerCopy(
      fallbackCocoGeneratedCopy(eventName, copyContext),
      eventName,
      authoritativeEventBrief,
      copyContext
    );
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { copy: fallback, source: "fallback", reason: "missing_openai_api_key" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.85,
      max_tokens: 450,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COCO_COPY_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            eventName,
            eventDescription,
            eventBrief,
            presenterName,
            djs,
            socials,
            rsvpContact,
            entryFee,
            nightlifeStyle,
            photoHints,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    const source =
      parsed && typeof parsed === "object" && "copy" in parsed
        ? (parsed as { copy?: unknown }).copy
        : parsed;
    const copy = materializeCocoComposerCopy(
      source,
      eventName,
      authoritativeEventBrief,
      copyContext
    );

    return NextResponse.json(
      { copy, source: "ai" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("Coco copy generation failed:", error?.message || error);
    const fallbackContext = {
      nightlifeStyle: safeNightlifeStyle,
      photoHints: safePhotoHints,
      eventDescription: safeEventDescription,
    };
    const fallback = materializeCocoComposerCopy(
      fallbackCocoGeneratedCopy(safeEventName, fallbackContext),
      safeEventName,
      safeEventBrief,
      fallbackContext
    );
    return NextResponse.json(
      { copy: fallback, source: "fallback", reason: "ai_failed" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
