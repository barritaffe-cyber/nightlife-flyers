'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Shield, Sparkles, Users, Zap } from 'lucide-react';
import { buildBillingCheckoutHref } from '../../lib/billing/catalog';
import { supabaseBrowser } from '../../lib/supabase/client';
import { cn } from '../../lib/utils';

type BillingCycle = 'monthly' | 'yearly';
type PlanId = 'creator' | 'studio';
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

const cardShellClass =
  'relative flex h-full flex-col overflow-hidden rounded-[8px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(13,16,25,0.90),rgba(4,6,11,0.96))] p-5 shadow-[0_24px_72px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-[3px] sm:p-6';

const iconTileClass =
  'grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.09]';

const secondaryCtaClass =
  'grid place-items-center rounded-[7px] bg-white/[0.07] px-3 py-2.5 text-sm font-medium text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.11] hover:text-white';

const premiumCtaClass =
  'grid place-items-center rounded-[7px] bg-[linear-gradient(100deg,#d052f2_0%,#9f8cf9_48%,#80dbea_100%)] px-3 py-2.5 text-sm font-semibold text-black shadow-[0_16px_38px_rgba(128,219,234,0.20)] transition hover:brightness-110';

const plans: readonly Plan[] = [
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
      'Creator Studio workflow with AI Background and Cinematic 3D',
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
      'AI Background and Cinematic 3D tools',
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
  const href = buildBillingCheckoutHref({ kind: 'plan', plan: id, billing });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        cardShellClass,
        'min-h-[620px] lg:min-h-[748px]',
        highlight && 'border-white/[0.11] shadow-[0_26px_82px_rgba(0,0,0,0.62),0_0_48px_rgba(192,132,252,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]'
      )}
    >
      {highlight && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/78 ring-1 ring-inset ring-white/[0.08]">
          <Sparkles className="h-3 w-3 text-cyan-100" /> Most popular
        </div>
      )}

      <div className={cn('flex items-center gap-3', highlight && 'pr-24')}>
        <div className={iconTileClass}>
          <Icon className="h-5 w-5 text-cyan-100" />
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
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 uppercase tracking-[0.16em] text-white/78 ring-1 ring-inset ring-white/[0.08]">
            Founding 50
          </span>
          <span>
            <span className="line-through text-white/40">${formatPrice(foundingPlan.original_price)}</span>
            {" "}save {foundingPlan.founding_discount_percent}%
          </span>
        </div>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-white/58">{tagline}</p>
      {billing === 'yearly' && savings > 0 && (
        <p className="mt-1 text-[11px] text-emerald-300">Save ${savings}/year vs monthly billing</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2">
        {limits.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-[6px] border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
          >
            <span className="text-white/70">{item.label}</span>
            <span className="font-medium text-white">{item.value}</span>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2 text-[13px] leading-5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-[2px] h-4 w-4 shrink-0 text-cyan-200" />
            <span className="text-white/78">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto grid gap-2 pt-5">
        <a
          href={href}
          className={id === 'studio' ? premiumCtaClass : secondaryCtaClass}
        >
          {cta}
        </a>

        {id === 'creator' && (
          <p className="text-[11px] leading-4 text-white/55">
            Renews automatically on the selected billing cycle until canceled. Upgrade or downgrade any time.
          </p>
        )}
        {id === 'studio' && (
          <p className="inline-flex items-start gap-1 text-[11px] leading-4 text-white/62">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Renews automatically until canceled. Clean exports remove guides, handles, and overlays.
          </p>
        )}
      </div>
    </motion.div>
  );
}

function OfferCard({ name, audience, tagline, icon: Icon, price, details, cta, id }: Offer) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        cardShellClass,
        'min-h-[350px]',
        id === 'weekend-pass' && 'bg-[linear-gradient(180deg,rgba(13,21,24,0.88),rgba(4,8,11,0.96))]'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={iconTileClass}>
          <Icon className="h-5 w-5 text-cyan-100" />
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
      <p className="mt-2 text-xs leading-5 text-white/58">{tagline}</p>

      <ul className="mt-4 space-y-2 text-[13px] leading-5">
        {details.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-[2px] h-4 w-4 shrink-0 text-cyan-200" />
            <span className="text-white/78">{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto grid gap-2 pt-5">
        <a
          href={buildBillingCheckoutHref({ kind: 'offer', offer: id })}
          className={secondaryCtaClass}
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
    <div className="w-full pb-8 text-white sm:pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_3px_22px_rgba(0,0,0,0.78)] sm:text-5xl"
            style={{ fontFamily: '"Nexa-Heavy", "Segoe UI", sans-serif' }}
          >
            Pick a Plan That Matches Your Workflow
          </motion.h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
            Choose between DJ / Promo, Creator Studio, and on-demand passes based on how often you ship flyers.
          </p>

          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/35 p-1 shadow-[0_18px_48px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
            <button
              onClick={() => setBilling('monthly')}
              className={
                'rounded-full px-3 py-1.5 text-sm transition ' +
                (billing === 'monthly' ? 'bg-white text-black shadow-[0_6px_18px_rgba(255,255,255,0.10)]' : 'text-white/72 hover:bg-white/[0.08] hover:text-white')
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={
                'rounded-full px-3 py-1.5 text-sm transition ' +
                (billing === 'yearly' ? 'bg-white text-black shadow-[0_6px_18px_rgba(255,255,255,0.10)]' : 'text-white/72 hover:bg-white/[0.08] hover:text-white')
              }
            >
              Yearly <span className="ml-1 text-[11px] opacity-70">(save 2 months)</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.88fr_1fr_1fr] lg:items-stretch">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
            {offers.map((offer) => (
              <OfferCard key={offer.id} {...offer} />
            ))}
          </div>
          {plans.map((plan) => (
            <PlanCard key={plan.id} {...plan} billing={billing} foundingOffer={foundingOffer} />
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
            <div key={item.title} className="rounded-[8px] border border-white/[0.07] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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
