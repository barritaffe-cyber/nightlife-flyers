import type { Metadata } from 'next';
import CocoLanding from '../../components/landing/CocoLanding';
export const metadata: Metadata = {
  title: 'Nightlife Flyers — Flyers in Five.',
  description: 'You bring the event. Coco brings the design. Pick your look. Make it yours. Square + Story, ready to post. From $5.',
};
export default function LandingPage() { return <CocoLanding/>; }
