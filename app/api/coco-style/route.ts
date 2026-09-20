import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  COCO_NIGHTLIFE_STYLE_PROFILES,
  decideCocoNightlifeStyleLocal,
  type CocoNightlifeStyle,
  type CocoPhotoSignal,
  type CocoStyleDecision,
} from "../../../components/coco/intelligence";
import { normalizeCocoEventName } from "../../../lib/coco/copy";

export const runtime = "nodejs";

const STYLE_IDS = Object.keys(COCO_NIGHTLIFE_STYLE_PROFILES) as CocoNightlifeStyle[];

const COCO_STYLE_SYSTEM_PROMPT = [
  "You are Coco's nightlife art director.",
  "Classify the intended event style and mood from an event name, the user's short event description, and compact photo signals.",
  "Treat the event description as the strongest signal for event type, atmosphere, audience, music, and venue experience.",
  "Use only the provided style ids. Do not invent new styles.",
  "Resolve ambiguity only when the combined evidence supports it.",
  "If confidence is low, keep askUser true.",
  "Return JSON only with this shape:",
  '{"style":"general-nightlife","mood":"short mood phrase","confidence":0.5,"reason":"short reason","evidence":["short evidence"],"askUser":true}',
].join(" ");

function sanitizePhotoSignal(value: unknown): CocoPhotoSignal | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Record<keyof CocoPhotoSignal, unknown>>;
  const signal: CocoPhotoSignal = {};

  if (source.role === "subject" || source.role === "background" || source.role === "reference") {
    signal.role = source.role;
  }
  if (source.brightness === "bright" || source.brightness === "dark" || source.brightness === "mid") {
    signal.brightness = source.brightness;
  }
  if (source.temperature === "cool" || source.temperature === "neutral" || source.temperature === "warm") {
    signal.temperature = source.temperature;
  }
  if (source.saturation === "balanced" || source.saturation === "muted" || source.saturation === "vivid") {
    signal.saturation = source.saturation;
  }
  if (source.contrast === "balanced" || source.contrast === "high" || source.contrast === "low") {
    signal.contrast = source.contrast;
  }
  if (Array.isArray(source.dominantHints)) {
    signal.dominantHints = source.dominantHints
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }

  return signal;
}

function sanitizeAiDecision(value: unknown, fallback: CocoStyleDecision): CocoStyleDecision {
  if (!value || typeof value !== "object") return fallback;
  const source = value as Record<string, unknown>;
  const style = STYLE_IDS.includes(source.style as CocoNightlifeStyle)
    ? (source.style as CocoNightlifeStyle)
    : fallback.style;
  const confidence = Math.max(0, Math.min(0.98, Number(source.confidence)));
  const safeConfidence = Number.isFinite(confidence) ? confidence : fallback.confidence;
  const evidence = Array.isArray(source.evidence)
    ? source.evidence.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5)
    : fallback.evidence;

  return {
    askUser: typeof source.askUser === "boolean" ? source.askUser : safeConfidence < 0.65,
    confidence: safeConfidence,
    evidence,
    mood: String(source.mood || fallback.mood).trim().slice(0, 80),
    reason: String(source.reason || fallback.reason).trim().slice(0, 180),
    scores: fallback.scores,
    source: "ai",
    style,
  };
}

export async function POST(req: Request) {
  let fallbackDecision: CocoStyleDecision | null = null;
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

    const source = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const eventDescription = String(source.eventDescription ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 600);
    const photoSignals = Array.isArray(source.photoSignals)
      ? source.photoSignals.map(sanitizePhotoSignal).filter((item): item is CocoPhotoSignal => Boolean(item))
      : [];
    const templateId = typeof source.templateId === "string" ? source.templateId : null;
    const templateLabel = typeof source.templateLabel === "string" ? source.templateLabel : null;
    const localDecision = decideCocoNightlifeStyleLocal({
      eventName: [eventName, eventDescription].filter(Boolean).join(" · "),
      photoSignals,
      source: "local",
      templateId,
      templateLabel,
    });
    fallbackDecision = localDecision;

    const shouldAskAi =
      localDecision.askUser ||
      localDecision.confidence < 0.72 ||
      ((localDecision.scores[0]?.score ?? 0) - (localDecision.scores[1]?.score ?? 0)) < 0.18;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey || !shouldAskAi) {
      return NextResponse.json(
        {
          decision: localDecision,
          reason: apiKey ? "local_confident" : "missing_openai_api_key",
          source: "local",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.25,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COCO_STYLE_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            availableStyles: STYLE_IDS,
            candidateScores: localDecision.scores,
            eventName,
            eventDescription,
            photoSignals,
            styleProfiles: Object.fromEntries(
              STYLE_IDS.map((style) => {
                const profile = COCO_NIGHTLIFE_STYLE_PROFILES[style];
                return [
                  style,
                  {
                    avoid: profile.avoid,
                    energy: profile.energy,
                    mood: profile.mood,
                    palette: profile.palette,
                    typography: profile.typography,
                  },
                ];
              })
            ),
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

    const aiDecision = sanitizeAiDecision(parsed, localDecision);
    const decision =
      aiDecision.confidence < 0.52
        ? { ...localDecision, askUser: true, source: "user-needed" as const }
        : aiDecision;

    return NextResponse.json(
      { decision, source: decision.source },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("Coco style decision failed:", error?.message || error);
    return NextResponse.json(
      {
        decision: fallbackDecision ?? decideCocoNightlifeStyleLocal({ source: "fallback" }),
        reason: "ai_failed",
        source: "fallback",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
