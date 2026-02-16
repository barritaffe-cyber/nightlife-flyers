'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Shield, Sparkles, Star, Users, Zap } from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';
type PlanId = 'free' | 'creator' | 'studio';

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

const plans: readonly Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    audience: 'For first-time users',
    tagline: 'Learn the workflow, test templates, and export your first flyers.',
    icon: Star,
    gradient:
      'bg-gradient-to-br from-neutral-800/60 via-neutral-900 to-black border-neutral-700/70',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: [
      { label: 'AI generations', value: '0 / month' },
      { label: 'Template access', value: '4 starter templates' },
      { label: 'Exports', value: 'Watermarked' },
    ],
    features: [
      'Templates: EDM Rave, EDM Stage, Hip-Hop Low Rider, Afrobeat',
      'Core text editing (headline, details, venue)',
      'No uploads (backgrounds, portraits, logos)',
      'No project save/load JSON files',
      'No DJ/Artist Branding panel access',
    ],
    cta: 'Start Free',
  },
  {
    id: 'creator',
    name: 'Creator',
    audience: 'For weekly promoters & resident DJs',
    tagline: 'Fast turnaround plan for regular nightlife events.',
    icon: Zap,
    gradient:
      'bg-gradient-to-br from-indigo-700/20 via-indigo-900/20 to-black border-indigo-700/40',
    monthlyPrice: 19,
    yearlyPrice: 190,
    limits: [
      { label: 'AI generations', value: '250 / month' },
      { label: 'Magic Blend', value: '120 / month' },
      { label: 'Exports', value: '2x clean export' },
    ],
    features: [
      'Full template library',
      'DJ Brand Kit (logos, main face, signature styles)',
      'Cinematic 3D text generator',
      'Priority queue over Starter plan',
      'Commercial use for club/event promotion',
    ],
    cta: 'Choose Creator',
  },
  {
    id: 'studio',
    name: 'Studio',
    audience: 'For teams & power users',
    tagline: 'Maximum output for agencies and multi-venue operators.',
    icon: Crown,
    highlight: true,
    gradient:
      'bg-gradient-to-br from-fuchsia-700/25 via-indigo-700/30 to-black border-fuchsia-500/40',
    monthlyPrice: 39,
    yearlyPrice: 390,
    limits: [
      { label: 'AI generations', value: '1000 / month' },
      { label: 'Magic Blend', value: '500 / month' },
      { label: 'Exports', value: '4x clean export' },
    ],
    features: [
      'Everything in Creator',
      'Highest render priority',
      'Expanded library + overlays',
      'Multi-brand workflow support',
      'Early access to new tools',
    ],
    cta: 'Choose Studio',
  },
] as const;

type PlanCardProps = Plan & { billing: BillingCycle };

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
}: PlanCardProps) {
  const currentPrice = billing === 'yearly' ? yearlyPrice : monthlyPrice;
  const cadence = currentPrice === 0 ? '' : billing === 'yearly' ? '/yr' : '/mo';
  const savings =
    monthlyPrice > 0 && yearlyPrice > 0 ? Math.max(0, monthlyPrice * 12 - yearlyPrice) : 0;
  const href = `/login?plan=${id}&billing=${billing}`;

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
          {currentPrice === 0 ? '$0' : `$${currentPrice}`}
        </div>
        {cadence && <div className="pb-1 text-sm text-white/60">{cadence}</div>}
      </div>
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
          Upgrade or downgrade any time. Your profile data stays intact.
        </p>
      )}
      {id === 'studio' && (
        <p className="mt-3 text-[11px] text-white/70 inline-flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" /> Clean exports remove guides, handles, and overlays.
        </p>
      )}
    </motion.div>
  );
}

export default function PricingPlans() {
  const [billing, setBilling] = React.useState<BillingCycle>('monthly');

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
            Designed for promoters, resident DJs, and teams shipping flyers every week.
          </p>

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
            <PlanCard key={plan.id} {...plan} billing={billing} />
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'Built for Nightlife',
              body: 'Templates, typography, and visual controls tuned for event promotion.',
              icon: Users,
            },
            {
              title: 'AI + Manual Control',
              body: 'Generate fast, then fine-tune every layer for a polished final flyer.',
              icon: Zap,
            },
            {
              title: 'Export-Ready Output',
              body: 'Deliver clean posts and stories for Instagram, print, and promo assets.',
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
