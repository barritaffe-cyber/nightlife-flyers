import type { Metadata } from 'next';
import CocoLanding from '../../components/landing/CocoLanding';
export const metadata: Metadata = {
  title: 'NF · Nightlife Flyers — Flyers in 5',
  description: 'Tell Coco about your event. Choose a design. Make it yours. Nightlife flyers in Square + Story, from $5 with no subscription required.',
};
export default function LandingPage() { return <CocoLanding/>; }
