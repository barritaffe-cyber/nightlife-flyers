import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { GREY_RAVE_FESTIVAL_RECIPE } from "../lib/recipes/greyRaveFestival.ts";
import { getVisualRecipe } from "../lib/visualRecipes.ts";

test("Grey Rave Festival is an authoritative sponsor-free portable recipe", async () => {
  assert.equal(getVisualRecipe("grey-rave-festival"), GREY_RAVE_FESTIVAL_RECIPE);
  assert.equal(GREY_RAVE_FESTIVAL_RECIPE.targetAssets?.backgroundUrl, "/generated-flyers/assets/grey%20assets-bg.png");
  assert.match(GREY_RAVE_FESTIVAL_RECIPE.avoid.join(" "), /sponsor logos/i);
  const html = await readFile(new URL("../public/generated-flyers/grey-rave-reference-master.html", import.meta.url), "utf8");
  assert.match(html, /data-coco-role="headline"/);
  assert.match(html, /data-coco-role="djLineup"/);
  assert.match(html, /data-coco-role="compliance"/);
  assert.match(html, /data-coco-role="social"/);
  assert.match(html, /data-coco-role="footerDetails"/);
  assert.doesNotMatch(html, /Johnnie Walker|Veuve Clicquot/i);
  for (const format of ["square", "story"] as const) {
    const elements = GREY_RAVE_FESTIVAL_RECIPE.runtime.formats[format].elements;
    assert.equal(elements.background.type, "image");
    assert.equal(elements.headline.semanticRole, "headline");
    assert.equal(elements["dj-lineup"].semanticRole, "djLineup");
    assert.equal(elements.details.semanticRole, "compliance");
    assert.equal(elements.subtag.semanticRole, "social");
    assert.equal(elements.footer.semanticRole, "footerDetails");
  }
});

test("compiled Grey Rave Festival maps each visible fact to its dedicated Coco field", async () => {
  const project = JSON.parse(await readFile(new URL("../public/generated-flyers/grey-rave-festival.nflyer", import.meta.url), "utf8"));
  for (const format of ["square", "story"] as const) {
    const session = project.state.session[format];
    assert.equal(session.date, "Sat 28 May");
    assert.equal(session.headline, "Rave");
    assert.equal(session.head2line, "Festival");
    assert.equal(session.djLineupLabel, "Line Up");
    assert.equal(session.djLineupLabelFamily, "Road Rage");
    assert.equal(session.details2, "Dormun\nFran Di Rocco\nTato Lerner\nThomy Dome");
    assert.equal(session.venueAddress, "Pilare");
    assert.equal(session.venue, "Zona Noble");
    assert.equal(session.venueAddressFamily, "Road Rage");
    assert.equal(session.venueFamily, "LEMONMILK-Regular");
    assert.equal(session.details2Family, "LEMONMILK-Regular");
    assert.equal(session.compliance, "+18");
    assert.equal(session.price, "$20");
    assert.equal(session.priceEnabled, true);
    assert.equal(session.priceLabel, "ENTRY");
    assert.equal(session.priceLabelSize, 8);
    assert.equal(session.cocoSocialHandle, "@rave.festivall");
    assert.equal(session.rightRail, "Keep the date");
    assert.equal(session.subtag, undefined);
    assert.equal(session.cocoCssCompiler.semanticObjects.entry.stateField, "price");
    assert.equal(
      session.emojiList.find((asset: { cocoCompiledObjectId?: string }) => asset.cocoCompiledObjectId === "background")?.locked,
      true,
    );
    assert.equal(session.cocoCssCompiler.semanticObjects["age-restriction"].stateField, "compliance");
  }
});
