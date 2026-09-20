import { NextResponse } from "next/server";
import { supabaseAuth } from "../../../lib/supabase/auth";
import { analyzeFinishedVisualReferencesWithOpenAI } from "../../../lib/coco/openAiVisualReferenceAnalyzer";
import { OPTIMIZED_VISUAL_REFERENCE_CATALOG } from "../../../components/coco/referenceLayouts/optimizedVisualReferenceCatalog";
import {
  hydrateSelectedReferenceConstruction,
  rankFinishedVisualReferences,
} from "../../../components/coco/referenceLayouts/visualReferenceSearch";
import { filterVisualReferencesBySubjectMode } from "../../../components/coco/referenceLayouts/optimizedVisualReferences";

export const runtime = "nodejs";

const MAX_CANVAS_DATA_URL_LENGTH = 8_000_000;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Login required for visual reference search." }, { status: 401 });
    }
    const { data, error } = await supabaseAuth().auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await request.json() as {
      currentCanvasImage?: unknown;
      creativeBrief?: unknown;
      subjectMode?: unknown;
    };
    const currentCanvasImage = typeof body.currentCanvasImage === "string"
      ? body.currentCanvasImage
      : "";
    if (!currentCanvasImage.startsWith("data:image/") || currentCanvasImage.length > MAX_CANVAS_DATA_URL_LENGTH) {
      return NextResponse.json({ error: "A valid rendered canvas image is required." }, { status: 400 });
    }
    const creativeBrief = String(body.creativeBrief ?? "Nightlife flyer").trim().slice(0, 1200);
    const subjectMode = body.subjectMode === "none"
      ? "none"
      : body.subjectMode === "required"
        ? "required"
        : "any";
    const eligibleCatalog = filterVisualReferencesBySubjectMode(
      OPTIMIZED_VISUAL_REFERENCE_CATALOG,
      subjectMode
    );
    if (!eligibleCatalog.length) {
      return NextResponse.json(
        { error: "No compatible flyer recipes are available for this image choice." },
        { status: 422 }
      );
    }
    const ranked = await rankFinishedVisualReferences({
      analyzer: analyzeFinishedVisualReferencesWithOpenAI,
      catalog: eligibleCatalog,
      creativeBrief,
      currentCanvasImage,
      limit: 5,
    });
    const hydrated = hydrateSelectedReferenceConstruction(
      ranked,
      eligibleCatalog
    );
    return NextResponse.json(
      {
        references: hydrated.map((reference) => ({
          id: reference.id,
          imageUrl: reference.imageUrl,
          rank: reference.rank,
          score: reference.score,
          reason: reference.reason,
          profile: reference.profile,
          templateId: reference.templateId,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Coco visual reference search failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Visual reference search failed." },
      { status: 500 }
    );
  }
}
