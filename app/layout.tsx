import './globals.css';
import type { Metadata } from 'next';
import AnalyticsTracker from "../components/analytics/AnalyticsTracker";
import { getPublicSiteUrl } from "../lib/publicIdentity";

const siteUrl = getPublicSiteUrl();
const googleAdsTagId = "AW-18139633250";
const siteDescription =
  'Nightlife Flyers is an AI flyer maker for nightlife flyers, club flyers, event flyers, DJ flyers, artist promo flyers, and AI flyers with fast templates, backgrounds, and exports.';
const siteTitle = 'Nightlife Flyers | AI Flyer Maker for Club, Event, DJ, and Artist Promo Flyers';
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nightlife Flyers",
    url: siteUrl,
    logo: `${siteUrl}/branding/nf-logo.png`,
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
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nightlife Flyers",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: siteDescription,
    featureList: [
      "Nightlife flyer maker",
      "Club flyer maker",
      "Event flyer maker",
      "DJ flyer maker",
      "Artist promo flyer maker",
      "AI flyer generation",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
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
  ],
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
