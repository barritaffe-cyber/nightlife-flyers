import './globals.css';
import type { Metadata } from 'next';
import AnalyticsTracker from "../components/analytics/AnalyticsTracker";
import ErrorReporter from "../components/monitoring/ErrorReporter";
import { getPublicSiteUrl, getPublicSupportEmail } from "../lib/publicIdentity";

const siteUrl = getPublicSiteUrl();
const supportEmail = getPublicSupportEmail();
const googleAdsTagId = "AW-18139633250";
const metaPixelId = "1949907151927593";
const siteDescription =
  'Nightlife Flyers is an AI flyer maker for nightlife flyers, club flyers, event flyers, DJ flyers, artist promo flyers, and social promo flyers with editable templates, AI backgrounds, subject cutouts, brand assets, and clean exports.';
const siteTitle = 'Nightlife Flyers | AI Flyer Maker for Club, Event, DJ, and Artist Promo Flyers';
const appFeatures = [
  "AI flyer maker for nightlife, club, event, DJ, and artist promo flyers",
  "Editable square post and vertical story formats",
  "Ready-made nightlife flyer templates",
  "AI-assisted backgrounds and style prompts",
  "Subject cutout editing with scale, blur, rotation, shadow, and layering controls",
  "Logo, social icon, design element, flare, and texture libraries",
  "Palette controls and color grading for fast visual variations",
  "Project save/load for repeat flyer production",
  "Clean PNG and JPG exports",
];
const targetUseCases = [
  "nightlife flyers",
  "club flyers",
  "event flyers",
  "DJ flyers",
  "artist promo flyers",
  "party flyers",
  "Instagram story flyers",
  "Instagram post flyers",
  "bar and lounge promo flyers",
];
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nightlife Flyers",
    url: siteUrl,
    logo: `${siteUrl}/branding/nf-logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: supportEmail,
      availableLanguage: "English",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nightlife Flyers",
    alternateName: [
      "AI Flyers",
      "DJ Flyers",
      "Club Flyers",
      "Event Flyers",
    ],
    url: siteUrl,
    description: siteDescription,
    inLanguage: "en-US",
    potentialAction: {
      "@type": "UseAction",
      target: `${siteUrl}/?studio=1`,
      name: "Open the Nightlife Flyers design studio",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: "Nightlife Flyers",
    applicationCategory: "DesignApplication",
    applicationSubCategory: "AI flyer maker",
    operatingSystem: "Web",
    url: siteUrl,
    image: `${siteUrl}/og.svg`,
    description: siteDescription,
    featureList: appFeatures,
    keywords: targetUseCases.join(", "),
    audience: [
      {
        "@type": "Audience",
        audienceType: "DJs",
      },
      {
        "@type": "Audience",
        audienceType: "event promoters",
      },
      {
        "@type": "Audience",
        audienceType: "nightclubs, bars, lounges, venues, and artists",
      },
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "9",
      highPrice: "390",
      offerCount: 6,
      url: `${siteUrl}/pricing`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Nightlife Flyers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nightlife Flyers is a web-based AI flyer maker for club flyers, nightlife flyers, event flyers, DJ flyers, artist promo flyers, and social promo flyers.",
        },
      },
      {
        "@type": "Question",
        name: "Who is Nightlife Flyers for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nightlife Flyers is built for DJs, party promoters, nightlife venues, bars, lounges, artists, and creators who need polished flyer designs quickly.",
        },
      },
      {
        "@type": "Question",
        name: "Can Nightlife Flyers create both post and story flyers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Templates support editable square post layouts and vertical story layouts for social promotion.",
        },
      },
      {
        "@type": "Question",
        name: "What can users edit in Nightlife Flyers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Users can edit text, typography, colors, backgrounds, subject cutouts, logos, social icons, effects, design elements, flares, textures, and export settings.",
        },
      },
      {
        "@type": "Question",
        name: "What makes Nightlife Flyers different from a general flyer maker?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nightlife Flyers focuses on nightlife-specific flyer design, including club-ready templates, cinematic backgrounds, AI-assisted visual tools, square and story formats, and fast export workflows for event promotion.",
        },
      },
    ],
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Nightlife Flyers',
  title: {
    default: siteTitle,
    template: '%s | Nightlife Flyers',
  },
  description: siteDescription,
  keywords: [
    'nightlife flyers',
    'club flyers',
    'event flyers',
    'dj flyers',
    'artist promo flyer',
    'AI flyers',
    'AI flyer maker',
    'DJ flyer maker',
    'club flyer maker',
    'nightlife flyer maker',
    'event flyer maker',
    'artist promo flyer maker',
    'party flyer maker',
    'Instagram flyer maker',
    'AI club flyer generator',
    'nightclub flyer maker',
    'bar flyer maker',
    'lounge flyer maker',
  ],
  alternates: {
    canonical: siteUrl,
  },
  category: "DesignApplication",
  creator: "Nightlife Flyers",
  publisher: "Nightlife Flyers",
  manifest: "/site.webmanifest",
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Nightlife Flyers',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'Nightlife Flyers Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/og.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  other: {
    "ai-purpose": "AI flyer maker for nightlife, club, DJ, event, artist promo, party, and social flyers",
    "ai-use-cases": targetUseCases.join(", "),
    "llms-txt": `${siteUrl}/llms.txt`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsTagId}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAdsTagId}');
          `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />`,
          }}
        />
        <AnalyticsTracker />
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
