import './globals.css';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nightlifeflyers.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Nightlife Flyers — Studio',
    template: '%s — Nightlife Flyers',
  },
  description: 'Design cinematic club flyers fast with AI backgrounds, Magic Blend, and clean exports.',
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Nightlife Flyers — Studio',
    description:
      'Design cinematic club flyers fast with AI backgrounds, Magic Blend, and clean exports.',
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
    title: 'Nightlife Flyers — Studio',
    description:
      'Design cinematic club flyers fast with AI backgrounds, Magic Blend, and clean exports.',
    images: ['/og.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
