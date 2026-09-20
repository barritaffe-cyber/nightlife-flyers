import { buildVisualReferenceContactSheet } from "./buildVisualReferenceContactSheet.ts";
import type {
  VisualReferenceAnalysisInput,
  VisualReferenceJudgment,
} from "../../components/coco/referenceLayouts/visualReferenceSearch.ts";

type FetchLike = typeof fetch;

function extractJson(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed) as { references?: VisualReferenceJudgment[] };
}

export function buildVisualReferenceVisionRequest(input: {
  analysis: VisualReferenceAnalysisInput;
  contactSheetDataUrl: string;
  model: string;
}) {
  const allowedIds = input.analysis.references.map((reference) => reference.id);
  return {
    model: input.model,
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are Coco's visual-reference critic. Judge only the finished pixels shown. " +
          "Do not infer coordinates, font sizes, template objects, or hidden construction data. " +
          "The user's first image may be an uploaded source photo with no typography, not a finished canvas. " +
          "For that image, judge subject and face position, crop, silhouette, and usable negative space. " +
          "Prefer references whose subject placement and text-lane grammar can transfer to that photo. " +
          "Then compare subject/type relationship, balance, hierarchy, negative-space use, density, " +
          "reading path, and intentional overlap.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Creative brief: ${input.analysis.creativeBrief}\n` +
              `Allowed visual ids: ${allowedIds.join(", ")}\n` +
              "The first image is the user's uploaded photo or current canvas. The second image is a labeled contact sheet of finished flyer references. " +
              "Rank the five most visually compatible references. Return JSON as " +
              '{"references":[{"id":"allowed-id","score":0,"reason":"visual reason","profile":{"balance":"asymmetric|centered|split","density":"low|medium|high","headlineMass":"light|medium|dominant","subjectInteraction":"avoid|frame|overlap","subjectPosition":"left|center|right|none","facePosition":"left|center|right|none"}}]}. ' +
              "subjectPosition and facePosition describe each finished reference.",
          },
          {
            type: "image_url",
            image_url: { url: input.analysis.currentCanvasImage, detail: "high" },
          },
          {
            type: "image_url",
            image_url: { url: input.contactSheetDataUrl, detail: "high" },
          },
        ],
      },
    ],
  };
}

export async function analyzeFinishedVisualReferencesWithOpenAI(
  analysis: VisualReferenceAnalysisInput,
  options: {
    apiKey?: string;
    fetchImpl?: FetchLike;
    model?: string;
  } = {}
): Promise<readonly VisualReferenceJudgment[]> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for visual reference analysis.");
  const contactSheet = await buildVisualReferenceContactSheet(analysis.references);
  const body = buildVisualReferenceVisionRequest({
    analysis,
    contactSheetDataUrl: contactSheet.dataUrl,
    model: options.model ?? process.env.OPENAI_LAYOUT_MODEL ?? "gpt-4o-2024-08-06",
  });
  const response = await (options.fetchImpl ?? fetch)("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Visual reference analysis failed: ${response.status} ${await response.text()}`);
  }
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Visual reference analysis returned no content.");
  return extractJson(content).references ?? [];
}
