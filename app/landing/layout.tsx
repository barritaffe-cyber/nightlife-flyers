import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Flyers for Nightlife, Club, Event, DJ, and Artist Promo Flyers",
  description:
    "Preview Nightlife Flyers, an AI flyer maker for nightlife flyers, club flyers, event flyers, DJ flyers, artist promo flyers, and fast social promo exports.",
  keywords: [
    "nightlife flyers",
    "club flyers",
    "event flyers",
    "dj flyers",
    "artist promo flyer",
    "AI flyers",
  ],
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
