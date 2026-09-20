export type CenterLayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  align: "left" | "center" | "right";
};

export type CocoCenterLayoutZones = {
  subject: CenterLayoutRect;
  faceProtection: CenterLayoutRect;
  headlineZone: CenterLayoutRect;
  leftZone: CenterLayoutRect;
  rightZone: CenterLayoutRect;
  footerZone: CenterLayoutRect;
  eventName: CenterLayoutRect;
  presenter: CenterLayoutRect;
  dateTime: CenterLayoutRect;
  venueAddress: CenterLayoutRect;
  eventDetails: CenterLayoutRect;
  musicPolicy: CenterLayoutRect;
  rsvpContact: CenterLayoutRect;
  addons: CenterLayoutRect;
  djLineup: CenterLayoutRect;
  entryPrice: CenterLayoutRect;
  social: CenterLayoutRect;
  compliance: CenterLayoutRect;
  qr: CenterLayoutRect;
  identity: CenterLayoutRect;
  hero: CenterLayoutRect;
  heroAccent: CenterLayoutRect;
  leftFact: CenterLayoutRect;
  rightFact: CenterLayoutRect;
  detailsLeft: CenterLayoutRect;
  detailsRight: CenterLayoutRect;
  venueBand: CenterLayoutRect;
  footerLeft: CenterLayoutRect;
  socialRail: CenterLayoutRect;
  footerRight: CenterLayoutRect;
  leftRail: CenterLayoutRect;
  rightRail: CenterLayoutRect;
};

export type CocoCenterComposerZones = {
  subject: CenterLayoutRect;
  headline: CenterLayoutRect;
  script: CenterLayoutRect;
  presenter: CenterLayoutRect;
  leftInfo: CenterLayoutRect;
  rightInfo: CenterLayoutRect;
  date: CenterLayoutRect;
  price: CenterLayoutRect;
  venue: CenterLayoutRect;
  subtag: CenterLayoutRect;
};

/**
 * Converts the semantic center-layout contract into the text-zone vocabulary
 * consumed by the existing Coco renderer. Keeping this mapping in one place
 * prevents startup generation and user-triggered layout changes from drifting.
 */
export function centerLayoutZonesToComposerZones(
  zones: CocoCenterLayoutZones
): CocoCenterComposerZones {
  return {
    subject: zones.subject,
    headline: zones.hero,
    script: zones.heroAccent,
    presenter: zones.identity,
    leftInfo: zones.detailsLeft,
    rightInfo: zones.detailsRight,
    date: zones.leftFact,
    price: zones.rightFact,
    venue: zones.venueBand,
    subtag: zones.addons,
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  align: CenterLayoutRect["align"] = "center"
): CenterLayoutRect => ({
  x: clamp(x, 0, 100),
  y: clamp(y, 0, 100),
  width: clamp(width, 1, 100 - clamp(x, 0, 100)),
  height: clamp(height, 1, 100 - clamp(y, 0, 100)),
  align,
});

export type CocoCenterAuthorityZones = Pick<
  CocoCenterLayoutZones,
  "subject" | "faceProtection" | "headlineZone" | "leftZone" | "rightZone" | "footerZone"
>;

/**
 * The center layout has one composition authority: four large regions around
 * a protected central face. Template style is applied only after these parent
 * zones exist, so a sparse reference cannot remove required nightlife content.
 *
 * The proportions are based on the supplied Sunday center-subject flyer:
 * - headline across the upper canvas,
 * - compact information pockets at middle-left and middle-right,
 * - a full-width utility/footer system at the bottom.
 */
export function buildCenterAuthorityZones({
  face,
  format,
  subject,
}: {
  face: CenterLayoutRect;
  format: "square" | "story";
  subject: CenterLayoutRect;
}): CocoCenterAuthorityZones {
  const story = format === "story";
  const safeX = 6;
  const faceProtection = rect(
    face.x - 2,
    face.y - 1.25,
    face.width + 4,
    face.height + 4.25
  );
  const footerY = story ? 80 : 78;
  const sideY = clamp(
    faceProtection.y + (story ? 11 : 12),
    story ? 31 : 32,
    story ? 39 : 40
  );
  const pocketWidth = story ? 21 : 22;
  const headlineY = clamp(
    face.y + face.height + (story ? 1.5 : 1),
    story ? 38 : 40,
    footerY - (story ? 31 : 30)
  );
  const sideHeight = Math.max(story ? 10 : 11, headlineY - sideY - 2);

  return {
    subject: rect(subject.x, subject.y, subject.width, subject.height),
    faceProtection,
    headlineZone: rect(safeX, headlineY, 100 - safeX * 2, footerY - headlineY - 5),
    leftZone: rect(safeX, sideY, pocketWidth, sideHeight, "left"),
    rightZone: rect(100 - safeX - pocketWidth, sideY, pocketWidth, sideHeight, "right"),
    footerZone: rect(safeX, footerY, 100 - safeX * 2, 100 - footerY - 3),
  };
}

/**
 * Builds the semantic placement contract used by the center-subject family.
 * Every value is in the editor's normalized 0-100 canvas coordinate system.
 * The face establishes the vertical break; the subject establishes the side
 * pockets; the remaining lower canvas becomes a coordinated hero/details/footer.
 */
export function buildCenterLayoutZones({
  face,
  format,
  subject,
}: {
  face: CenterLayoutRect;
  format: "square" | "story";
  subject: CenterLayoutRect;
}): CocoCenterLayoutZones {
  const story = format === "story";
  const safeX = 6;
  const authority = buildCenterAuthorityZones({ face, format, subject });
  const {
    faceProtection,
    footerZone,
    headlineZone,
    leftZone,
    rightZone,
  } = authority;

  const identity = rect(
    headlineZone.x + (story ? 9 : 12),
    Math.max(story ? 3.5 : 4, faceProtection.y - (story ? 5.5 : 5)),
    headlineZone.width - (story ? 18 : 24),
    story ? 4.5 : 4
  );
  // Center design uses the torso as foreground typography space. The face is
  // protected, then the hero lockup begins across the chest at nearly the full
  // canvas span.
  const heroTop = headlineZone.y;
  const hero = rect(
    story ? 24 : 29,
    heroTop,
    story ? 52 : 50,
    story ? 9 : 10
  );
  const heroAccent = rect(
    hero.x,
    hero.y + hero.height - 1,
    hero.width,
    story ? 10 : 11
  );

  // The primary accents share one top alignment line: date/time/venue at left,
  // presenter in the middle, and QR at right.
  const primaryTop = identity.y;
  const leftFact = rect(leftZone.x, primaryTop, leftZone.width, story ? 14 : 13, "left");
  const eventDetails = rect(
    leftZone.x,
    leftZone.y,
    leftZone.width,
    leftZone.height,
    "left"
  );
  const djLineup = rect(rightZone.x, rightZone.y, rightZone.width, rightZone.height * 0.52, "right");
  const footerLeft = rect(footerZone.x, footerZone.y + 5, story ? 21 : 22, 9, "left");
  const footerRight = rect(100 - safeX - (story ? 18 : 20), footerZone.y + 6, story ? 18 : 20, 8, "right");
  const footerCenterX = footerLeft.x + footerLeft.width + 2;
  const footerCenterRight = footerRight.x - 2;
  const footerCenterWidth = footerCenterRight - footerCenterX;
  const addons = rect(
    hero.x,
    heroAccent.y + heroAccent.height + (story ? 1.4 : 1.2),
    hero.width,
    story ? 4 : 3.5
  );
  const venueBand = rect(
    footerCenterX,
    footerZone.y,
    footerCenterWidth,
    3.5
  );
  const musicPolicy = rect(footerCenterX, footerZone.y + 5, footerCenterWidth, 3.5, "center");
  const rsvpContact = rect(
    footerCenterX,
    footerZone.y + 9.5,
    footerCenterWidth,
    3,
    "center"
  );
  const socialRail = rect(footerRight.x, footerRight.y, footerRight.width, footerRight.height, "right");
  const rightFact = rect(
    footerLeft.x,
    footerLeft.y,
    footerLeft.width * 0.48,
    footerLeft.height,
    "left"
  );
  const compliance = rect(
    footerLeft.x + footerLeft.width * 0.56,
    footerLeft.y,
    footerLeft.width * 0.38,
    footerLeft.height,
    "center"
  );
  const qrSize = story ? 9 : 10;
  const qr = rect(
    100 - safeX - qrSize,
    primaryTop,
    qrSize,
    qrSize,
    "right"
  );
  const detailsLeft = eventDetails;
  const detailsRight = djLineup;

  return {
    ...authority,
    faceProtection,
    headlineZone,
    leftZone,
    rightZone,
    footerZone,
    // Semantic roles come first so debug guides display the content contract,
    // not the legacy renderer aliases that share the same rectangles.
    eventName: hero,
    presenter: identity,
    dateTime: leftFact,
    venueAddress: venueBand,
    eventDetails,
    musicPolicy,
    rsvpContact,
    addons,
    djLineup,
    entryPrice: rightFact,
    social: socialRail,
    compliance,
    qr,
    identity,
    hero,
    heroAccent,
    leftFact,
    rightFact,
    detailsLeft,
    detailsRight,
    venueBand,
    footerLeft,
    socialRail,
    footerRight,
    leftRail: rect(1.5, 13, 3.5, story ? 34 : 30, "center"),
    rightRail: rect(95, 13, 3.5, story ? 34 : 30, "center"),
  };
}
