import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Nightlife Flyers for support, billing questions, partnerships, and account help.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
