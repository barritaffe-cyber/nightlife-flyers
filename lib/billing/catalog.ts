export type BillingCycle = "monthly" | "yearly";
export type BillingPlanId = "basic" | "full" | "creator" | "studio";
export type BillingOfferId = "one-flyer" | "night-pass" | "weekend-pass";
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

const PLAN_ITEMS: Partial<Record<`${BillingPlanId}:${BillingCycle}`, BillingCatalogItem>> = {
  "basic:monthly": {
    key: "basic:monthly", kind: "plan", name: "Coco",
    description: "20 flyers per month. Flyers in Five, quick editing, logo upload, saved flyers and remembered brand details. Square + Story count together.",
    price: 10, cadence: "monthly", status: "active", plan: "basic", durationHours: 24 * 30,
  },
  "full:monthly": {
    key: "full:monthly", kind: "plan", name: "Coco + Studio",
    description: "20 flyers per month. Everything in Coco plus Full Studio, personal photos, backgrounds, subjects, full assets and template requests.",
    price: 15, cadence: "monthly", status: "active", plan: "full", durationHours: 24 * 30,
  },
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
    description: "180 generations per month with Creator Auto Layout, Build It For You, Extract Subject cutouts, multi-brand profiles, and expanded Studio libraries.",
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
    description: "Yearly Studio access for Creator Auto Layout, Build It For You, Extract Subject cutouts, expanded libraries, and multi-brand workflows.",
    price: 390,
    cadence: "yearly",
    status: "active",
    plan: "studio",
    durationHours: 24 * 365,
  },
};

const OFFER_ITEMS: Record<BillingOfferId, BillingCatalogItem> = {
  "one-flyer": {
    key: "one-flyer", kind: "offer", name: "One Flyer",
    description: "One flyer with Coco, the full template library, quick edits, your logo and Square + Story. Includes seven days of corrections after first export.",
    price: 5, cadence: "one-time", status: "one_flyer", plan: "one_flyer", durationHours: 24 * 7,
  },
  "night-pass": {
    key: "night-pass",
    kind: "offer",
    name: "Event Pass",
    description: "24-hour access window with 5 paid generations and clean exports.",
    price: 9,
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
    price: 14,
    cadence: "one-time",
    status: "weekend_pass",
    plan: "weekend_pass",
    durationHours: 72,
  },
};

export function isBillingPlanId(value: string | null | undefined): value is BillingPlanId {
  return value === "basic" || value === "full" || value === "creator" || value === "studio";
}

export function isBillingCycle(value: string | null | undefined): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function isBillingOfferId(value: string | null | undefined): value is BillingOfferId {
  return value === "one-flyer" || value === "night-pass" || value === "weekend-pass";
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
    if (["basic", "full"].includes(input.plan) && input.billing && input.billing !== "monthly") return null;
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
  const item = PLAN_ITEMS[`${selection.plan}:${selection.billing}`];
  if (!item) throw new Error("Unsupported billing cycle.");
  return item;
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
  // New monthly subscriptions expire on the next calendar billing date, clamped
  // for shorter months. Keep legacy receipt calculations unchanged.
  if (selection.kind === "plan" && isPublicBillingSelection(selection)) {
    const end = new Date(from);
    const day = end.getUTCDate();
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(day, lastDay));
    return end.toISOString();
  }
  return new Date(from.getTime() + item.durationHours * 60 * 60 * 1000).toISOString();
}

/** Legacy selections remain parseable for existing payments, but cannot start a new sale. */
export function isPublicBillingSelection(selection: BillingSelection): boolean {
  return (selection.kind === "offer" && selection.offer === "one-flyer") || selection.kind === "plan" && selection.billing === "monthly" && ["basic", "full"].includes(selection.plan);
}
