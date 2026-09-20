import { getVisualRecipe } from "../visualRecipes.ts";
import type { TemplateSpec } from "../templates.ts";

/** Editor container only: never inherit a gallery template's canvas or assets. */
export function buildCocoAuthoredRecipeSeed(recipeId: string | undefined): TemplateSpec {
  const recipe = recipeId ? getVisualRecipe(recipeId) : undefined;
  if (!recipe) throw new Error(`Coco requires an authored recipe: ${recipeId || "none selected"}.`);
  return {
    id: recipe.id,
    label: recipe.name,
    tags: ["Coco", "Authored recipe"],
    preview: "",
    formats: { square: {}, story: {} },
  };
}
