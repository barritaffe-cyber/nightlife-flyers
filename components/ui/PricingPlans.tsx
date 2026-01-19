'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Star, Sparkles, Shield } from 'lucide-react';

const features = {
  free: [
    'Limited AI backgrounds',
    'Starter templates',
    'Core text layers (headline, details, venue)',
    'Standard export',
    'Basic icon library',
    'Project save/load (JSON)',
  ],
  starter: [
    'Monthly AI credits',
    'Full template gallery',
    'Magic Blend (limited)',
    'Portrait cleanup',
    'Clean exports up to 2x',
    'Logos + media slots',
  ],
  pro: [
    'Unlimited AI backgrounds + Magic Blend',
    'Cinematic 3D text renders',
    'Advanced text layers + subtag pill',
    '4x export + clean renders',
    'Brand Kit + design library',
    'Priority render quality',
  ],
};

type TierBase = {
  id: 'free' | 'starter' | 'pro';
  name: string;
  price: string;          // base display price; we’ll override from state
  tag?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  gradient: string;
  highlight?: boolean;
};

const tiers: readonly TierBase[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    tag: 'Try the studio',
    icon: Star,
    gradient:
      'bg-gradient-to-br from-neutral-800/60 via-neutral-900 to-black border-neutral-700/70',
  },
  {
    id: 'starter',
    name: 'Creator',
    price: '$10',
    tag: 'For weekly flyers',
    icon: Zap,
    gradient:
      'bg-gradient-to-br from-indigo-700/20 via-indigo-900/20 to-black border-indigo-700/40',
  },
  {
    id: 'pro',
    name: 'Studio Pro',
    price: '$20',
    tag: 'Unlimited studio power',
    icon: Crown,
    highlight: true,
    gradient:
      'bg-gradient-to-br from-fuchsia-700/25 via-indigo-700/30 to-black border-fuchsia-500/40',
  },
] as const;

type TierCardProps = TierBase & {
  price: string;          // computed per billing
  cadence?: string;       // '/mo' | '/yr' | ''
};

function TierCard({
  id,
  name,
  price,
  cadence,
  tag,
  icon: Icon,
  gradient,
  highlight,
}: TierCardProps) {
  const isPro = id === 'pro';
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
          <Sparkles className="h-3.5 w-3.5" /> Best value
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10">
          <Icon className="h-5 w-5 text-white/90" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight">{name}</div>
          <div className="text-xs text-white/60">{tag}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1">
        <div className="text-4xl font-bold leading-none">{price}</div>
        {cadence && <div className="pb-1 text-sm text-white/60">{cadence}</div>}
      </div>

      <ul className="mt-4 space-y-2 text-[13px] leading-5">
        {features[id].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-[2px] h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-white/90">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          className={
            'rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-white/15 transition ' +
            (isPro
              ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:brightness-110'
              : 'bg-white/10 text-white/90 hover:bg-white/15')
          }
        >
          {isPro ? 'Go Pro' : name === 'Creator' ? 'Start Creator' : 'Try Free'}
        </button>
        <button className="rounded-xl px-3 py-2 text-sm text-white/80 ring-1 ring-white/15 hover:bg-white/10">
          View details
        </button>
      </div>

      {id === 'starter' && (
        <p className="mt-3 text-[11px] text-white/55">
          Upgrade anytime. Carry over unused credits for 30 days.
        </p>
      )}
      {id === 'pro' && (
        <p className="mt-3 text-[11px] text-white/70 inline-flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" /> Clean exports remove grids, guides & handles.
        </p>
      )}
    </motion.div>
  );
}

export default function PricingPlans() {
  const [yearly, setYearly] = React.useState(true);

  const price = (id: TierBase['id']) => {
    if (id === 'free') return '$0';
    if (!yearly) return id === 'starter' ? '$10' : '$20';
    return id === 'starter' ? '$100' : '$200'; // ~2 months free
  };

  const cadence = (id: TierBase['id']) => (id === 'free' ? '' : yearly ? '/yr' : '/mo');

  return (
    <div className="min-h-screen w-full bg-neutral-950 py-14 text-white">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            Studio Pricing, Built for Flyers
          </motion.h1>
          <p className="mt-3 text-white/70">
            Create nightclub flyers fast with AI backgrounds, Magic Blend, cinematic text, and pro exports.
          </p>

          {/* Toggle */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setYearly(false)}
              className={
                'rounded-full px-3 py-1.5 text-sm transition ' +
                (!yearly ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10')
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={
                'rounded-full px-3 py-1.5 text-sm transition ' +
                (yearly ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10')
              }
            >
              Yearly <span className="ml-1 text-[11px] opacity-70">(2 months free)</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((t) => (
            <TierCard key={t.id} {...t} price={price(t.id)} cadence={cadence(t.id)} />
          ))}
        </div>

        {/* Feature strip */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'AI Background Studio',
              body: 'Generate cinematic scenes with style presets and subject controls.',
            },
            {
              title: 'Magic Blend',
              body: 'Fuse your subject into the scene with lighting that feels real.',
            },
            {
              title: 'Cinematic Exports',
              body: 'Clean PNG/JPG outputs with 2x or 4x resolution.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
            >
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="mt-1 text-[12px] text-white/70">{item.body}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 grid place-items-center">
          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-5 py-3 text-sm font-medium shadow-[0_10px_30px_rgba(0,0,0,.5)] hover:brightness-110"
          >
            Start designing now
          </motion.a>
          <p className="mt-3 text-xs text-white/60">No credit card required on Free.</p>
        </div>
      </div>
    </div>
  );
}
