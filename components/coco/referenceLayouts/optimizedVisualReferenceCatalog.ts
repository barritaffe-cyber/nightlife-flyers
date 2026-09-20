import { TEMPLATE_GALLERY } from "../../../lib/templates.ts";
import { mapOptimizedVisualsToTemplates } from "./optimizedVisualReferences.ts";

// This is the application-facing catalog. Search/ranking must inspect the
// finished imageUrl first; only after a visual is shortlisted should the
// Composition Director read `construction` from the paired template.
export const OPTIMIZED_VISUAL_REFERENCE_CATALOG = mapOptimizedVisualsToTemplates(
  TEMPLATE_GALLERY
);
