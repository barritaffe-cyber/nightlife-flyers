export type BillingCycle = "monthly" | "yearly";
export type BillingPlanId = "creator" | "studio";
export type BillingOfferId = "night-pass" | "weekend-pass";
export type BillingSelection =
  | { kind: "plan"; plan: BillingPlanId; billing: BillingCycle }
  | { kind: "offer"; offer: BillingOfferId };

export type BillingCatalogItem = {
  key: string;
  kind: BillingSelection["kind"];
  name: string;
  description: string;
  price: number;
  cadence: string;
  status: string;
  plan: string;
  durationHours: number;
};

const PLAN_ITEMS: Record<`${BillingPlanId}:${BillingCycle}`, BillingCatalogItem> = {
  "creator:monthly": {
    key: "creator:monthly",
    kind: "plan",
    name: "Creator Monthly",
    description: "90 generations per month with Creator Auto Layout, Build It For You, AI tools, uploads, project files, and clean exports.",
    price: 19,
    cadence: "monthly",
    status: "active",
    plan: "creator",
    durationHours: 24 * 30,
  },
  "creator:yearly": {
    key: "creator:yearly",
    kind: "plan",
    name: "Creator Yearly",
    description: "Yearly Creator access with Creator Auto Layout, Build It For You, and the full paid studio workflow.",
    price: 190,
    cadence: "yearly",
    status: "active",
    plan: "creator",
    durationHours: 24 * 365,
  },
  "studio:monthly": {
    key: "studio:monthly",
    kind: "plan",
    name: "Studio Monthly",
    description: "180 generations per month with Creator Auto Layout, Build It For You, multi-brand profiles, and expanded Studio libraries.",
    price: 39,
    cadence: "monthly",
    status: "active",
    plan: "studio",
    durationHours: 24 * 30,
  },
  "studio:yearly": {
    key: "studio:yearly",
    kind: "plan",
    name: "Studio Yearly",
    description: "Yearly Studio access for Creator Auto Layout, Build It For You, expanded libraries, and multi-brand workflows.",
    price: 390,
    cadence: "yearly",
    status: "active",
    plan: "studio",
    durationHours: 24 * 365,
  },
};

const OFFER_ITEMS: Record<BillingOfferId, BillingCatalogItem> = {
  "night-pass": {
    key: "night-pass",
    kind: "offer",
    name: "Night Pass",
    description: "24-hour access window with 5 paid generations and clean exports.",
    price: 12,
    cadence: "one-time",
    status: "night_pass",
    plan: "night_pass",
    durationHours: 24,
  },
  "weekend-pass": {
    key: "weekend-pass",
    kind: "offer",
    name: "Weekend Pass",
    description: "72-hour access window with 18 paid generations and clean exports.",
    price: 24,
    cadence: "one-time",
    status: "weekend_pass",
    plan: "weekend_pass",
    durationHours: 72,
  },
};

export function isBillingPlanId(value: string | null | undefined): value is BillingPlanId {
  return value === "creator" || value === "studio";
}

export function isBillingCycle(value: string | null | undefined): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function isBillingOfferId(value: string | null | undefined): value is BillingOfferId {
  return value === "night-pass" || value === "weekend-pass";
}

export function resolveBillingSelection(input: {
  plan?: string | null;
  billing?: string | null;
  offer?: string | null;
}): BillingSelection | null {
  if (isBillingOfferId(input.offer)) {
    return { kind: "offer", offer: input.offer };
  }
  if (isBillingPlanId(input.plan)) {
    return {
      kind: "plan",
      plan: input.plan,
      billing: isBillingCycle(input.billing) ? input.billing : "monthly",
    };
  }
  return null;
}

export function getBillingCatalogItem(selection: BillingSelection): BillingCatalogItem {
  if (selection.kind === "offer") {
    return OFFER_ITEMS[selection.offer];
  }
  return PLAN_ITEMS[`${selection.plan}:${selection.billing}`];
}

export function buildBillingCheckoutHref(selection: BillingSelection): string {
  if (selection.kind === "offer") {
    return `/billing/checkout?offer=${selection.offer}`;
  }
  return `/billing/checkout?plan=${selection.plan}&billing=${selection.billing}`;
}

export function buildBillingLoginHref(selection: BillingSelection): string {
  const next = encodeURIComponent(buildBillingCheckoutHref(selection));
  return `/login?next=${next}`;
}

export function computeBillingPeriodEnd(selection: BillingSelection, from = new Date()): string {
  const item = getBillingCatalogItem(selection);
  return new Date(from.getTime() + item.durationHours * 60 * 60 * 1000).toISOString();
}
