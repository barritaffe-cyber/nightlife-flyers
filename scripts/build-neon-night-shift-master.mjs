import { pathToFileURL } from "node:url";
import { compileCssRecipeAdapter } from "./lib/coco-css-recipe-compiler.mjs";
import { NEON_NIGHT_SHIFT_RECIPE } from "../lib/recipes/neonNightShift.ts";

const masterPath = new URL("../public/generated-flyers/neon-night-shift-reference-master.html", import.meta.url);
const outputPath = new URL("../public/generated-flyers/neon-night-shift.nflyer", import.meta.url);
const refinementPath = new URL("../public/generated-flyers/neon-night-shift-refinements.json", import.meta.url);
// Build from a clean root. Inheriting another .nflyer also inherits its
// renderer switches, saved controls, migrations, and layout snapshots.
const id = "neon-night-shift";
const version = 10;
const summary = "A centered neon portrait inside a cyan-magenta circular field, crossed by an oversized condensed NIGHT and hot-pink script Shift, with balanced side facts and a structured footer.";

const svgData = (body, viewBox = "0 0 160 160") =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="none">${body}</svg>`).toString("base64")}`;
const svgMarkup = (body, viewBox = "0 0 160 160") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="none">${body}</svg>`;

const asset = (format, key, label, url, x, y, scale, opacity = 1, rotation = 0, layerOffset = -2, cssBounds = null) => ({
  id: `coco_neon_night_shift_${key}_${format}`, cocoAssetRole: key, label, url, x, y, scale, opacity, rotation,
  locked: false, blendMode: "normal", isFlare: false, isSticker: true, isTexture: false,
  isExtracted: key === "subject", isLogo: false, isBrandFace: false, isShapeGraphic: false,
  isDesignElement: key !== "subject",
  isSeparator: false, isNightlifeGraphic: false, shapeKind: "shape_square", shapeGradient: true,
  shapeLength: 100, shapeSkew: 0, tint: 0, tintMode: "hue", layerOffset,
  showLabel: false, labelBg: true,
  ...(cssBounds ? { cocoCssBounds: cssBounds, cocoCssFit: "contain" } : {}),
});

function assets(format) {
  const zones = NEON_NIGHT_SHIFT_RECIPE.runtime.formats[format].zones;
  const centeredBounds = (rect) => ({ ...rect, centerX: rect.x + rect.width / 2, centerY: rect.y + rect.height / 2 });
  const nativeShape = (key, label, body, color, bounds, layerOffset, opacity = 1, viewBox = "0 0 160 160", options = {}) => {
    const template = svgMarkup(body, viewBox);
    return {
      ...asset(format, key, label, svgData(body.replaceAll("{{COLOR}}", color), viewBox), bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, 1, opacity, options.rotation ?? 0, layerOffset, centeredBounds(bounds)),
      cocoCssFit: "fill",
      svgTemplate: template,
      iconColor: color,
      paletteRole: color === "#F50087" ? "primary" : color === "#00D9E9" ? "secondary" : color === "#F2F0ED" ? "neutral" : "base",
      ...options,
    };
  };
  return [
    nativeShape("background", "Wet wall", '<defs><linearGradient id="base" x2="1"><stop offset="0" stop-color="#6C0030" stop-opacity=".72"/><stop offset=".375" stop-color="#6C0030" stop-opacity=".72"/><stop offset=".3751" stop-color="#020305" stop-opacity=".96"/><stop offset="1" stop-color="#020305" stop-opacity=".96"/></linearGradient><radialGradient id="pink" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(173 346) scale(367 653)"><stop stop-color="#F50087" stop-opacity=".28"/><stop offset="1" stop-color="#F50087" stop-opacity="0"/></radialGradient><radialGradient id="cyan" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(799 595) scale(270 480)"><stop stop-color="#00D9E9" stop-opacity=".18"/><stop offset="1" stop-color="#00D9E9" stop-opacity="0"/></radialGradient><pattern id="drops" width="17" height="29" patternUnits="userSpaceOnUse"><ellipse cx="8.5" cy="14.5" rx="1" ry="1" fill="#fff" opacity=".18"/></pattern><pattern id="glint" width="73" height="91" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><rect x="35" width="2" height="91" fill="#fff" opacity=".08"/></pattern></defs><rect width="1080" height="1920" fill="#020305"/><rect width="1080" height="1920" fill="url(#base)"/><rect width="1080" height="1920" fill="url(#pink)"/><rect width="1080" height="1920" fill="url(#cyan)"/><g opacity=".58" style="mix-blend-mode:screen"><rect width="1080" height="1920" fill="url(#drops)"/><rect width="1080" height="1920" fill="url(#glint)"/></g>', "#020305", zones.background, -12, 1, "0 0 1080 1920"),
    nativeShape("leftContrast", "Left contrast", '<defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#6F002E" stop-opacity=".42"/><stop offset="1" stop-color="#460025" stop-opacity=".2"/></linearGradient></defs><rect width="159" height="160" fill="url(#g)"/><rect x="159" width="1" height="160" fill="{{COLOR}}" opacity=".1"/>', "#F50087", zones.leftContrast, -10),
    nativeShape("footerContrast", "Footer contrast", '<defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="{{COLOR}}" stop-opacity="0"/><stop offset=".35" stop-color="{{COLOR}}" stop-opacity=".85"/><stop offset="1" stop-color="{{COLOR}}"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/>', "#020305", zones.footerContrast, -9),
    nativeShape("paintLeft", "Left edge paint", '<defs><clipPath id="clip"><polygon points="0,0 104,9.6 132.8,46.4 100.8,86.4 147.2,123.2 105.6,160 0,160"/></clipPath><radialGradient id="c" cx="55%" cy="80%" r="54%"><stop stop-color="{{COLOR}}" stop-opacity=".56"/><stop offset="1" stop-color="{{COLOR}}" stop-opacity="0"/></radialGradient><linearGradient id="p" gradientTransform="rotate(112 .5 .5)"><stop stop-color="#F50087" stop-opacity=".4"/><stop offset=".64" stop-color="#F50087" stop-opacity="0"/></linearGradient></defs><g clip-path="url(#clip)"><rect width="160" height="160" fill="url(#p)"/><rect width="160" height="160" fill="url(#c)"/></g>', "#00D9E9", zones.paintLeft, -8, .78),
    nativeShape("paintRight", "Right edge paint", '<defs><clipPath id="clip"><polygon points="44.8,0 160,11.2 160,160 35.2,160 65.6,124.8 22.4,88 54.4,46.4"/></clipPath><radialGradient id="c" cx="42%" cy="65%" r="55%"><stop stop-color="#00D9E9" stop-opacity=".58"/><stop offset="1" stop-color="#00D9E9" stop-opacity="0"/></radialGradient><linearGradient id="p" gradientTransform="rotate(250 .5 .5)"><stop stop-color="{{COLOR}}" stop-opacity=".42"/><stop offset=".58" stop-color="{{COLOR}}" stop-opacity="0"/></linearGradient></defs><g clip-path="url(#clip)"><rect width="160" height="160" fill="url(#p)"/><rect width="160" height="160" fill="url(#c)"/></g>', "#F50087", zones.paintRight, -8, .78),
    nativeShape("subjectDisc", "Subject disc", '<defs><clipPath id="disc"><circle cx="80" cy="80" r="78"/></clipPath><linearGradient id="g" x2="1" y2=".4"><stop offset="0" stop-color="#E9E8E3"/><stop offset=".38" stop-color="#E9E8E3"/><stop offset=".39" stop-color="{{COLOR}}"/><stop offset=".58" stop-color="{{COLOR}}"/><stop offset=".59" stop-color="#01DCE9"/><stop offset="1" stop-color="#01DCE9"/></linearGradient><linearGradient id="slash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".44" stop-color="#000" stop-opacity="0"/><stop offset=".45" stop-color="#000" stop-opacity=".35"/><stop offset=".62" stop-color="#000" stop-opacity=".35"/><stop offset=".63" stop-color="#000" stop-opacity="0"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00D9E9" flood-opacity=".22"/></filter></defs><circle cx="80" cy="80" r="77" fill="url(#g)" filter="url(#shadow)"/><g clip-path="url(#disc)" opacity=".38" transform="translate(-16 -16) scale(1.2) rotate(-8 80 80)"><g fill="none" stroke="#000" stroke-opacity=".36" stroke-width=".75"><circle cx="38.4" cy="67.2" r="2.4"/><circle cx="38.4" cy="67.2" r="5.7"/><circle cx="38.4" cy="67.2" r="9"/><circle cx="38.4" cy="67.2" r="12.3"/><circle cx="38.4" cy="67.2" r="15.6"/><circle cx="38.4" cy="67.2" r="18.9"/><circle cx="38.4" cy="67.2" r="22.2"/><circle cx="38.4" cy="67.2" r="25.5"/><circle cx="38.4" cy="67.2" r="28.8"/><circle cx="38.4" cy="67.2" r="32.1"/><circle cx="38.4" cy="67.2" r="35.4"/><circle cx="38.4" cy="67.2" r="38.7"/><circle cx="38.4" cy="67.2" r="42"/><circle cx="38.4" cy="67.2" r="45.3"/><circle cx="38.4" cy="67.2" r="48.6"/><circle cx="38.4" cy="67.2" r="51.9"/><circle cx="38.4" cy="67.2" r="55.2"/><circle cx="38.4" cy="67.2" r="58.5"/><circle cx="38.4" cy="67.2" r="61.8"/><circle cx="38.4" cy="67.2" r="65.1"/><circle cx="38.4" cy="67.2" r="68.4"/><circle cx="38.4" cy="67.2" r="71.7"/><circle cx="38.4" cy="67.2" r="75"/></g><rect width="160" height="160" fill="url(#slash)"/></g>', "#F50087", zones.subjectDisc, -4),
    asset(format, "subject", "Replaceable subject", "/scene-assets/sugar-rush/subject-cutout.png", zones.subject.x + zones.subject.width / 2, zones.subject.y + zones.subject.height / 2, 1, 1, 0, -1, centeredBounds(zones.subject)),
    { ...nativeShape("subjectGrade", "Subject color grade", '<defs><linearGradient id="g"><stop stop-color="{{COLOR}}" stop-opacity=".28"/><stop offset=".5" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="1" stop-color="#00D9E9" stop-opacity=".2"/></linearGradient><radialGradient id="m"><stop offset=".52" stop-color="#fff"/><stop offset=".73" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="mask"><rect width="160" height="160" fill="url(#m)"/></mask></defs><rect width="160" height="160" fill="url(#g)" mask="url(#mask)"/>', "#F50087", zones.subjectGrade, 1, 1), blendMode: "color" },
    nativeShape("scriptUnderline", "Shift underline", '<path d="M4 49 C108 24 207 23 309 17 C407 11 505 14 613 4 C529 28 435 34 344 40 C231 47 124 61 19 67 Z" fill="{{COLOR}}"/>', "#F50087", zones.scriptUnderline, 24, 1, "0 0 620 70", { rotation: -7 }),
    nativeShape("doorsRules", "Doors rules", '<path d="M0 2.5H160M0 157.5H160" stroke="{{COLOR}}" stroke-width="5"/>', "#F50087", zones.doorsRules, 14),
    nativeShape("manifestoRules", "Night callout rules", '<path d="M0 2H160M0 158H160" stroke="{{COLOR}}" stroke-width="4"/>', "#00D9E9", zones.manifestoRules, 14),
    nativeShape("supportRule", "Support divider", '<path d="M80 0V160" stroke="{{COLOR}}" stroke-width="5"/>', "#F2F0ED", zones.supportRule, 18),
    nativeShape("lineupTag", "Music label block", '<rect width="160" height="160" fill="{{COLOR}}"/>', "#F50087", zones.lineupTag, 17),
    nativeShape("offerTag", "Special label block", '<rect width="160" height="160" fill="{{COLOR}}"/>', "#00D9E9", zones.offerTag, 17),
    nativeShape("offerRule", "Special underline", '<rect width="160" height="160" fill="{{COLOR}}"/>', "#00D9E9", zones.offerRule, 17),
    nativeShape("contactFrame", "VIP contact frame", '<rect x="3" y="3" width="154" height="154" fill="none" stroke="{{COLOR}}" stroke-width="6"/>', "#F50087", zones.contactFrame, 18),
    nativeShape("contactLabelPlate", "VIP label plate", '<rect width="160" height="160" fill="{{COLOR}}"/>', "#020305", zones.contactLabelPlate, 19),
    nativeShape("venuePin", "Venue pin", '<path d="M11.5 1C17.3 1 22 5.7 22 11.5S17.3 22 11.5 22H1V11.5C1 5.7 5.7 1 11.5 1Z" fill="none" stroke="{{COLOR}}" stroke-width="2"/>', "#F50087", zones.venuePin, 18, 1, "0 0 23 30", { rotation: -45 }),
    nativeShape("accentTop", "Top triangle", '<path d="M0 42L25 0l25 42z" fill="{{COLOR}}"/>', "#F50087", zones.accentTop, 20, 1, "0 0 50 42", { rotation: 26 }),
    nativeShape("accentBottom", "Bottom triangle", '<path d="M0 42L25 0l25 42z" fill="{{COLOR}}"/>', "#00D9E9", zones.accentBottom, 20, 1, "0 0 50 42", { rotation: 165 }),
    { ...asset(format, "photoChip", "Photo chip", "/scene-assets/ladies-night-pink-chrokme/background.jpg", zones.photoChip.x + zones.photoChip.width / 2, zones.photoChip.y + zones.photoChip.height / 2, 1, .62, 0, -3, centeredBounds(zones.photoChip)), cocoCssFit: "cover", cocoCssClipPath: "polygon(0 4%,100% 0,100% 100%,8% 100%)" },
  ];
}

function materialize(format, sourceVariant, compiledZones) {
  const story = format === "story";
  const nativeAssets = assets(format);
  const recipeZones = compiledZones;
  const zones = { ...recipeZones, dress: recipeZones.dressCode };
  const rendererZones = {
    headline:{...zones.headline,align:"left"},script:{...zones.script,align:"center"},date:{...zones.date,align:"left"},
    leftInfo:{...zones.manifesto,align:"left"},rightInfo:{...zones.lineup,align:"left"},venue:{...zones.venue,align:"center"},
    presenter:{...zones.compliance,align:"center"},compliance:{...zones.compliance,align:"center"},subtag:{...zones.dress,align:"center"},
    price:{...zones.offer,align:"left"},rightRail:{...zones.offer,align:"left"},leftRail:{...zones.contact,align:"center"},doors:{...zones.doors,align:"left"},
  };
  const blocks = Object.entries(rendererZones).map(([source,rect],index)=>({source,rect,align:rect.align,priority:index+1,role:source}));
  const variant = {
    ...sourceVariant,
    format,
    cocoCampaignDirectionId: id,
    cocoCampaignId: "coco-neon-night-shift-master",
    cocoEventName: "Night Shift",
    cocoGeneratedCopy: {
      headline: "NIGHT", subheadline: "Shift", date: "SAT JUN 15", time: "10:00PM",
      compliance: "18+ ID REQUIRED", details: "STEP INTO THE NIGHT", details2: "DJ NOVA\nDJ KAIRO\nDJ VYBE",
      djLineup: "DJ NOVA\nDJ KAIRO\nDJ VYBE", musicPolicy: "MUSIC BY", addons: "VIP TABLES\nHOOKAH",
      rsvpContact: "VIP TABLES & INFO\n555 123 4567", venue: "142 NIGHT AVE, DOWNTOWN DISTRICT", subtag: "DRESS TO IMPRESS",
      presenter: "", price: "", socials: "", entryRestrictions: "",
    },
    cocoEventBrief: {
      description: "Neon black-wall nightlife campaign with a centered portrait, cyan-magenta disc, condensed NIGHT title and pink Shift script.",
      subtitle: "Shift", presenterName: "", date: "SAT JUN 15", startTime: "10:00PM", endTime: "",
      venueName: "142 NIGHT AVE", address: "DOWNTOWN DISTRICT", djs: "DJ NOVA, DJ KAIRO, DJ VYBE",
      hosts: "", performers: "", additionalActs: "", musicPolicy: "MUSIC BY", eventDetails: "STEP INTO THE NIGHT",
      dressCode: "DRESS TO IMPRESS", experienceFeatures: ["VIP TABLES", "HOOKAH"], mainPromotion: "",
      bottleSpecials: "", drinkSpecials: "", foodSpecials: "", hookahSpecials: "HOOKAH", promotionDeadline: "",
      additionalOffers: "VIP TABLES", socials: "", socialPlatforms: [], rsvpContact: "555 123 4567",
      bookingContact: "", website: "", email: "", ticketLink: "", entryFee: "", freeEntryCondition: "",
      ageRequirement: "18", entryRestrictions: "ID REQUIRED", responsibleDrinking: "", qrDestination: "",
      qrLabel: "SCAN HERE", requestedAssetIds: [],
    },
    cocoVisualRecipeId: id,
    cocoVisualRecipeSummary: summary,
    cocoVisualRecipeVersion: version,
    cocoVisualRecipeMaterializedVersion: version,
    cocoCompositionSystem: { ...(sourceVariant.cocoCompositionSystem || {}), patternId: id, rendererZones, blocks, allBlocks:blocks, authority: { layout: "recipe-format-zones", palette: "recipe-palette", crop: "recipe-image-fit", assets: "recipe-assets", background: "recipe-assets" } },
    cocoCompositionMap: { patternId:id, rendererZones },
    cocoRenderPlan: null,
    cocoTypographyStack: null,
    cocoSubjectLayoutId: "subject-center",
    cocoCenterLayoutOptionId: "subject-center",
    palette: { bgFrom: "#020305", bgTo: "#09010A", primary: "#F50087", secondary: "#00D9E9", neutral: "#F2F0ED" },
    backgroundUrl: "",
    bgUploadUrl: "",
    headline: "NIGHT",
    headlineFamily: "Anton",
    headlineSize: story ? 178 : 144,
    headSize: story ? 178 : 144,
    headManualPx: story ? 178 : 144,
    headSizeAuto: false,
    headColor: "#F2F0ED",
    headX: zones.headline.x,
    headY: zones.headline.y,
    textColWidth: story ? 61 : 63,
    headAlign: "left",
    headTracking: -0.055,
    headlineUppercase: true,
    headShadow: true,
    headShadowStrength: .35,
    textFx: { ...(sourceVariant.textFx || {}), color: "#F2F0ED", alpha: 1, gradient: false, glow: 0, strokeWidth: 0, tracking: -.055, uppercase: true, shadowEnabled: true, shadow: .35 },
    head2Enabled: true,
    headline2Enabled: true,
    head2: "Shift",
    head2line: "Shift",
    head2Family: "Open Script",
    head2Size: story ? 83 : 68,
    head2SizePx: story ? 83 : 68,
    head2Color: "#F50087",
    head2X: zones.script.x,
    head2Y: zones.script.y,
    head2ColWidth: story ? 49 : 50,
    head2Align: "center",
    head2Rotate: -7,
    head2Fx: { ...(sourceVariant.head2Fx || {}), color: "#F50087", alpha: 1, gradient: false, glow: 0, strokeWidth: 0, tracking: 0, uppercase: false, shadowEnabled: true, shadow: .25 },
    dateEnabled: true,
    date: "SAT\nJUN\n15",
    timeLabel: "DOORS OPEN",
    timeLabelSize: story ? 11 : 8,
    timeLabelColor: "#F50087",
    timeLabelBgColor: "transparent",
    time: "10:00PM",
    timeX: zones.doors.x,
    timeY: zones.doors.y,
    dateFamily: "Bebas Neue",
    dateColor: "#F2F0ED",
    dateSize: story ? 24 : 19,
    dateX: zones.date.x,
    dateY: zones.date.y,
    dateAlign: "left",
    dateLineHeight: .82,
    cocoRushDateStyles: {
      metaSize: story ? 24 : 19,
      monthSize: story ? 22 : 17,
      daySize: story ? 68 : 54,
      openingSize: story ? 11 : 8,
      timeLabelSize: story ? 11 : 8,
      timeSize: story ? 13 : 9,
      metaColor: "#F2F0ED",
      monthColor: "#F50087",
      dayColor: "#F2F0ED",
      openingColor: "#F50087",
      timeLabelColor: "#F50087",
      timeColor: "#F2F0ED",
      ruleColor: "#F50087",
    },
    complianceEnabled: true,
    complianceLabel: "ID REQUIRED",
    complianceLabelSize: story ? 8 : 7,
    complianceLabelColor: "#F2F0ED",
    complianceLabelBgColor: "transparent",
    compliance: "18+",
    complianceFamily: "LEMONMILK-Regular",
    complianceColor: "#F2F0ED",
    complianceSize: story ? 11 : 9,
    complianceX: zones.compliance.x,
    complianceY: zones.compliance.y,
    complianceAlign: "center",
    complianceLineHeight: 1,
    detailsEnabled: true,
    details: "STEP\nINTO\nTHE\nNIGHT",
    detailsLabel: "",
    cocoSourceDetails: "STEP\nINTO\nTHE\nNIGHT",
    detailsFamily: "LEMONMILK-Bold",
    detailsColor: "#00D9E9",
    detailsSize: story ? 13 : 10,
    detailsX: zones.manifesto.x,
    detailsY: zones.manifesto.y,
    detailsAlign: "left",
    detailsLineHeight: 1.12,
    details2Enabled: true,
    details2: "DJ NOVA\nDJ KAIRO\nDJ VYBE",
    cocoSourceDetails2: "DJ NOVA\nDJ KAIRO\nDJ VYBE",
    djLineupLabel: "MUSIC BY",
    djLineupLabelSize: story ? 10 : 8,
    djLineupLabelColor: "#020305",
    djLineupLabelBgColor: "transparent",
    details2Family: "LEMONMILK-Regular",
    details2Color: "#F2F0ED",
    details2Size: story ? 15 : 12,
    details2X: zones.lineup.x,
    details2Y: zones.lineup.y,
    details2Align: "left",
    details2LineHeight: 1.05,
    rightRailEnabled: true,
    rightRailLabel: "SPECIAL",
    rightRailLabelSize: story ? 9 : 7,
    rightRailLabelColor: "#020305",
    rightRailLabelBgColor: "#00D9E9",
    rightRail: "VIP TABLES\nHOOKAH",
    rightRailFamily: "LEMONMILK-Regular",
    rightRailColor: "#F2F0ED",
    rightRailSize: story ? 15 : 12,
    rightRailX: zones.offer.x,
    rightRailY: zones.offer.y,
    rightRailAlign: "left",
    rightRailRotation: 0,
    leftRailEnabled: true,
    leftRailLabel: "VIP TABLES & INFO",
    leftRailLabelSize: story ? 9 : 7,
    leftRailLabelColor: "#F50087",
    leftRailLabelBgColor: "#020305",
    leftRail: "555 123 4567",
    cocoNeonSemanticFields: {
      timeLabel: "DOORS OPEN",
      time: "10:00PM",
      complianceLabel: "ID REQUIRED",
      compliance: "18+",
      offerLabel: "SPECIAL",
      offerCopy: "VIP TABLES\nHOOKAH",
      rsvpLabel: "VIP TABLES & INFO",
      rsvpContact: "555 123 4567",
    },
    leftRailFamily: "LEMONMILK-Regular",
    leftRailColor: "#F50087",
    leftRailSize: story ? 13 : 10,
    leftRailX: zones.contact.x,
    leftRailY: zones.contact.y,
    leftRailAlign: "center",
    leftRailRotation: 0,
    venueEnabled: true,
    venue: "142 NIGHT AVE, DOWNTOWN DISTRICT",
    cocoSourceVenue: "142 NIGHT AVE\nDOWNTOWN DISTRICT",
    venueAddress: "",
    venueFamily: "LEMONMILK-Regular",
    venueColor: "#F2F0ED",
    venueSize: story ? 10 : 8,
    venueX: zones.venue.x,
    venueY: zones.venue.y,
    venueAlign: "center",
    subtagEnabled: true,
    subtag: "DRESS TO IMPRESS",
    subtagFamily: "LEMONMILK-Regular",
    subtagTextColor: "#00D9E9",
    subtagSize: story ? 9 : 7,
    subtagX: zones.dress.x,
    subtagY: zones.dress.y,
    subtagAlign: "center",
    subtagBgColor: "rgba(0,0,0,0)",
    subtagAlpha: 0,
    priceEnabled: false,
    presenterEnabled: false,
    qrEnabled: false,
    cocoSocialHandleEnabled: false,
    emojiList: nativeAssets,
    portraits: nativeAssets,
  };
  return variant;
}

export const objectMap = {
  subject: { stateField: "portraits.subject", zone: "subject" },
  headline: { stateField: "headline", zone: "headline" },
  subheadline: { stateField: "head2line", zone: "script" },
  date: { stateField: "date", zone: "date" },
  time: { stateField: "time", zone: "doors" },
  compliance: { stateField: "compliance", zone: "compliance" },
  details: { stateField: "details", zone: "manifesto" },
  djLineup: { stateField: "details2", zone: "lineup" },
  offer: { stateField: "rightRail", zone: "offer" },
  rsvp: { stateField: "leftRail", zone: "contact" },
  venue: { stateField: "venue", zone: "venue" },
  subtag: { stateField: "subtag", zone: "dressCode" },
};

export const semanticBindingRules = {
  djLineup: {
    valueField: "details2",
    labelField: "djLineupLabel",
    labelRoles: ["lineupLabel"],
    transform: "uppercase",
  },
  time: {
    valueField: "time",
    labelField: "timeLabel",
    labelRoles: ["doorsLabel"],
    transform: "uppercase",
    mirror: { field: "cocoNeonSemanticFields", labelKey: "timeLabel", valueKey: "time" },
  },
  compliance: {
    valueField: "compliance",
    labelField: "complianceLabel",
    labelRoles: ["complianceLabel"],
    transform: "uppercase",
    mirror: { field: "cocoNeonSemanticFields", labelKey: "complianceLabel", valueKey: "compliance" },
  },
  offer: {
    valueField: "rightRail",
    labelField: "rightRailLabel",
    labelRoles: ["offerLabel"],
    transform: "uppercase",
    mirror: { field: "cocoNeonSemanticFields", labelKey: "offerLabel", valueKey: "offerCopy" },
  },
  rsvp: {
    valueField: "leftRail",
    labelField: "leftRailLabel",
    labelRoles: ["rsvpLabel"],
    transform: "uppercase",
    mirror: { field: "cocoNeonSemanticFields", labelKey: "rsvpLabel", valueKey: "rsvpContact" },
  },
};

export const coordinateBindings = [
  { zone: "headline", xField: "headX", yField: "headY" },
  { zone: "script", xField: "head2X", yField: "head2Y" },
  { zone: "date", xField: "dateX", yField: "dateY" },
  { zone: "doors", xField: "timeX", yField: "timeY" },
  { zone: "compliance", xField: "complianceX", yField: "complianceY" },
  { zone: "leftInfo", xField: "detailsX", yField: "detailsY" },
  { zone: "rightInfo", xField: "details2X", yField: "details2Y" },
  { zone: "rightRail", xField: "rightRailX", yField: "rightRailY" },
  { zone: "leftRail", xField: "leftRailX", yField: "leftRailY" },
  { zone: "venue", xField: "venueX", yField: "venueY" },
  { zone: "subtag", xField: "subtagX", yField: "subtagY" },
];

export const cocoCssRecipeAdapter = {
  id,
  geometryScriptId: "neon-night-shift-css-master-geometry",
  masterPath,
  objectMap,
  outputPath,
  refinementPath,
  recipe: NEON_NIGHT_SHIFT_RECIPE,
  coordinateBindings,
  semanticBindingRules,
  materializeFormat: (format, compileContext) => ({
    ...materialize(format, {}, compileContext.geometry.formats[format].zones),
    cocoCssCompiler: {
      schemaVersion: 1,
      sourceHash: compileContext.sourceHash,
      semanticObjects: objectMap,
      semanticTextBindings: compileContext.semanticTextBindings,
      semanticAssets: compileContext.semanticAssets,
    },
  }),
};

export async function buildNeonNightShiftMaster(overrides = {}) {
  const result = await compileCssRecipeAdapter(cocoCssRecipeAdapter, overrides);
  const destination = overrides.outputPath || outputPath;
  console.log(`Compiled ${destination.pathname || destination} from ${(overrides.masterPath || masterPath).pathname || (overrides.masterPath || masterPath)}`);
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) await buildNeonNightShiftMaster();
