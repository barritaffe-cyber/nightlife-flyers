'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Shield, Sparkles, Star, Users, Zap } from 'lucide-react';
import { buildBillingCheckoutHref } from '../../lib/billing/catalog';
import { supabaseBrowser } from '../../lib/supabase/client';

type BillingCycle = 'monthly' | 'yearly';
type PlanId = 'free' | 'creator' | 'studio';
type OfferId = 'night-pass' | 'weekend-pass';

type Plan = {
  id: PlanId;
  name: string;
  audience: string;
  tagline: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  gradient: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlight?: boolean;
  limits: { label: string; value: string }[];
  features: string[];
  cta: string;
};

type Offer = {
  id: OfferId;
  name: string;
  audience: string;
  tagline: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  gradient: string;
  price: number;
  details: string[];
  cta: string;
};

type FoundingOfferPrice = {
  original_price: number;
  effective_price: number;
  founding_discount_applied: boolean;
  founding_discount_percent: number;
};

type FoundingOfferState = {
  active: boolean;
  retained_for_user: boolean;
  total_slots: number;
  claimed_slots: number;
  reserved_slots: number;
  remaining_slots: number;
  discount_percent: number;
  prices: {
    creator: {
      monthly: FoundingOfferPrice;
      yearly: FoundingOfferPrice;
    };
    studio: {
      monthly: FoundingOfferPrice;
      yearly: FoundingOfferPrice;
    };
  };
};

function formatPrice(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

const plans: readonly Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    audience: 'For first-time users',
    tagline: 'Try the editor with a tiny starter trial before moving into paid production.',
    icon: Star,
    gradient:
      'bg-gradient-to-br from-neutral-800/60 via-neutral-900 to-black border-neutral-700/70',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: [
      { label: 'AI generations', value: '3 total' },
      { label: 'Template access', value: 'Starter selection' },
      { label: 'Trial extras', value: '1 upload + 1 clean export' },
    ],
    features: [
      'Access to DJ / Promo and Creator Studio entry flows',
      'Browse templates and edit flyer layout basics',
      'Core text editing and on-canvas adjustments',
      'Starter trial includes up to 3 AI generations total after sign-in',
      'Starter trial includes one portrait or logo upload and one clean export',
      'Background uploads, Extract Subject, project files, and repeated clean exports stay paid',
    ],
    cta: 'Start Free',
  },
  {
    id: 'creator',
    name: 'Creator',
    audience: 'For weekly promoters, DJs, and venue marketers',
    tagline: 'Full access to DJ / Promo, Creator Studio, and Build For You for weekly flyer production.',
    icon: Zap,
    gradient:
      'bg-gradient-to-br from-indigo-700/20 via-indigo-900/20 to-black border-indigo-700/40',
    monthlyPrice: 19,
    yearlyPrice: 190,
    limits: [
      { label: 'AI generations', value: '90 / month' },
      { label: 'Workflow access', value: 'Full paid workflow' },
      { label: 'Exports', value: 'Clean exports included' },
    ],
    features: [
      'Full template library plus premium editing controls',
      'DJ / Promo flow with Main Face, Lighting Studio, and Brand Vault',
      'Creator Studio workflow with AI Background, Magic Blend, and Cinematic 3D',
      'Does not include Extract Subject',
      'Build For You startup workflow',
      'Uploads for backgrounds, portraits, logos, icons, and custom graphics',
      'One saved DJ brand profile with reusable face, logo, palette, and fonts',
      'Project save/load files and clean exports',
    ],
    cta: 'Choose Creator',
  },
  {
    id: 'studio',
    name: 'Studio',
    audience: 'For agencies, venue groups, and multi-brand teams',
    tagline: 'Higher-volume access with more AI headroom, expanded libraries, and multi-brand DJ workflows.',
    icon: Crown,
    highlight: true,
    gradient:
      'bg-gradient-to-br from-fuchsia-700/25 via-indigo-700/30 to-black border-fuchsia-500/40',
    monthlyPrice: 39,
    yearlyPrice: 390,
    limits: [
      { label: 'AI generations', value: '180 / month' },
      { label: 'Brand profiles', value: 'Multiple saved' },
      { label: 'Studio library', value: 'Expanded assets' },
    ],
    features: [
      'Multiple reusable DJ brand profiles',
      'Create, duplicate, and manage brand kits for artists, venues, or clients',
      'DJ / Promo, Creator Studio, and Build For You included',
      'AI Background, Magic Blend, and Cinematic 3D tools',
      'Extract Subject tool with stored scene cutout layers',
      'Expanded graphics, stickers, and flare libraries',
      'More generation headroom for high-volume weekly production',
      'Project files and clean exports for multi-client workflows',
    ],
    cta: 'Choose Studio',
  },
] as const;

const offers: readonly Offer[] = [
  {
    id: 'night-pass',
    name: 'Night Pass',
    audience: 'For one-off flyers and quick promo runs',
    tagline: 'One-time access to the paid workflow when you only need the studio for a short run.',
    icon: Sparkles,
    gradient:
      'bg-gradient-to-br from-cyan-700/20 via-sky-900/20 to-black border-cyan-500/30',
    price: 12,
    details: [
      '24-hour access window',
      'Clean exports during the pass',
      'Uploads, DJ / Promo, and Creator Studio paid tools unlocked',
      'Does not include Extract Subject',
      'No recurring billing',
    ],
    cta: 'Get Night Pass',
  },
  {
    id: 'weekend-pass',
    name: 'Weekend Pass',
    audience: 'For multi-event weekends and festival runs',
    tagline: 'Best for multiple drops, revisions, and exports across a full weekend.',
    icon: Shield,
    gradient:
      'bg-gradient-to-br from-emerald-700/20 via-teal-900/20 to-black border-emerald-500/30',
    price: 24,
    details: [
      '72-hour access window',
      'Clean exports during the pass',
      'Full paid workflow including DJ / Promo and Creator Studio',
      'Does not include Extract Subject',
      'No recurring billing',
    ],
    cta: 'Get Weekend Pass',
  },
] as const;

type PlanCardProps = Plan & { billing: BillingCycle; foundingOffer: FoundingOfferState | null };

function PlanCard({
  id,
  name,
  audience,
  tagline,
  icon: Icon,
  gradient,
  highlight,
  limits,
  features,
  cta,
  monthlyPrice,
  yearlyPrice,
  billing,
  foundingOffer,
}: PlanCardProps) {
  const foundingPlan =
    id === 'creator' || id === 'studio' ? foundingOffer?.prices?.[id]?.[billing] : null;
  const currentPrice = foundingPlan?.effective_price ?? (billing === 'yearly' ? yearlyPrice : monthlyPrice);
  const cadence = currentPrice === 0 ? '' : billing === 'yearly' ? '/yr' : '/mo';
  const savings =
    monthlyPrice > 0 && yearlyPrice > 0 ? Math.max(0, monthlyPrice * 12 - yearlyPrice) : 0;
  const href =
    id === 'free'
      ? '/'
      : buildBillingCheckoutHref({ kind: 'plan', plan: id, billing });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={
        'relative rounded-2xl border p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,.45)] ' +
        gradient
      }
    >
      {highlight && (
        <div className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] text-fuchsia-200">
          <Sparkles className="h-3.5 w-3.5" /> Most popular
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10">
          <Icon className="h-5 w-5 text-white/90" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight">{name}</div>
          <div className="text-xs text-white/60">{audience}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1">
        <div className="text-4xl font-bold leading-none">
          {currentPrice === 0 ? '$0' : `$${formatPrice(currentPrice)}`}
        </div>
        {cadence && <div className="pb-1 text-sm text-white/60">{cadence}</div>}
      </div>
      {foundingPlan?.founding_discount_applied ? (
        <div className="mt-1 flex items-center gap-2 text-[11px] text-amber-200">
          <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 uppercase tracking-[0.16em]">
            Founding 50
          </span>
          <span>
            <span className="line-through text-white/40">${formatPrice(foundingPlan.original_price)}</span>
            {" "}save {foundingPlan.founding_discount_percent}%
          </span>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-white/70">{tagline}</p>
      {billing === 'yearly' && savings > 0 && (
        <p className="mt-1 text-[11px] text-emerald-300">Save ${savings}/year vs monthly billing</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2">
        {limits.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[12px]"
          >
            <span className="text-white/70">{item.label}</span>
            <span className="font-medium text-white">{item.value}</span>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2 text-[13px] leading-5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-[2px] h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-white/90">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-2">
        <a
          href={href}
          className={
            'grid place-items-center rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-white/15 transition ' +
            (id === 'studio'
              ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:brightness-110'
              : 'bg-white/10 text-white/90 hover:bg-white/15')
          }
        >
          {cta}
        </a>
      </div>

      {id === 'creator' && (
        <p className="mt-3 text-[11px] text-white/55">
          Renews automatically on the selected billing cycle until canceled. Upgrade or downgrade any time.
        </p>
      )}
      {id === 'studio' && (
        <p className="mt-3 text-[11px] text-white/70 inline-flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" /> Renews automatically until canceled. Clean exports remove guides, handles, and overlays.
        </p>
      )}
    </motion.div>
  );
}

function OfferCard({ name, audience, tagline, icon: Icon, gradient, price, details, cta, id }: Offer) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={
        'relative rounded-2xl border p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,.45)] ' +
        gradient
      }
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10">
          <Icon className="h-5 w-5 text-white/90" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight">{name}</div>
          <div className="text-xs text-white/60">{audience}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1">
        <div className="text-4xl font-bold leading-none">${price}</div>
        <div className="pb-1 text-sm text-white/60">one-time</div>
      </div>
      <p className="mt-2 text-xs text-white/70">{tagline}</p>

      <ul className="mt-4 space-y-2 text-[13px] leading-5">
        {details.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-[2px] h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-white/90">{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-2">
        <a
          href={buildBillingCheckoutHref({ kind: 'offer', offer: id })}
          className="grid place-items-center rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white/90 ring-1 ring-white/15 transition hover:bg-white/15"
        >
          {cta}
        </a>
      </div>
    </motion.div>
  );
}

export default function PricingPlans() {
  const [billing, setBilling] = React.useState<BillingCycle>('monthly');
  const [foundingOffer, setFoundingOffer] = React.useState<FoundingOfferState | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadFoundingOffer = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const res = await fetch('/api/billing/founding-offer', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = (await res.json().catch(() => null)) as FoundingOfferState | null;
        if (!cancelled && res.ok && json) {
          setFoundingOffer(json);
        }
      } catch {}
    };

    void loadFoundingOffer();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full py-8 text-white sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Pick a Plan That Matches Your Workflow
          </motion.h1>
          <p className="mt-3 text-white/70">
            Choose between DJ / Promo, Creator Studio, and on-demand passes based on how often you ship flyers.
          </p>
          {foundingOffer && (foundingOffer.active || foundingOffer.retained_for_user) ? (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]">Founding 50</div>
              <div className="mt-1">
                Save {foundingOffer.discount_percent}% on Creator and Studio subscriptions.
                {foundingOffer.active
                  ? ` ${foundingOffer.remaining_slots} of ${foundingOffer.total_slots} spots remain.`
                  : ' The public founder spots are gone, but this account still keeps the founding price.'}
              </div>
            </div>
          ) : null}

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={
                'rounded-full px-3 py-1.5 text-sm transition ' +
                (billing === 'monthly' ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10')
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={
                'rounded-full px-3 py-1.5 text-sm transition ' +
                (billing === 'yearly' ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10')
              }
            >
              Yearly <span className="ml-1 text-[11px] opacity-70">(save 2 months)</span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} {...plan} billing={billing} foundingOffer={foundingOffer} />
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Need Clean Exports Without a Subscription?</h2>
          <p className="mt-3 text-white/70">
            Use a pass when you need the paid workflow for a night, a weekend, or a one-off campaign.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
            <OfferCard key={offer.id} {...offer} />
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'Two Creation Paths',
              body: 'Use DJ / Promo for fast artist drops or Creator Studio for broader flyer builds.',
              icon: Users,
            },
            {
              title: 'AI + Manual Control',
              body: 'Generate backgrounds, blend subjects, or fine-tune every layer by hand.',
              icon: Zap,
            },
            {
              title: 'Project File Safety',
              body: 'Paid access includes project files and clean exports for repeatable weekly production.',
              icon: Shield,
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <item.icon className="h-4 w-4 text-white/80" />
                {item.title}
              </div>
              <div className="mt-1 text-[12px] text-white/70">{item.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-white/60">
          Need enterprise invoicing or bulk seats? Contact support from your profile page.
        </div>
      </div>
    </div>
  );
}
