"use client";

import Link from "next/link";
import { getPublicLegalName, getPublicSupportEmail } from "../../lib/publicIdentity";

export default function PublicSiteFooter() {
  const legalName = getPublicLegalName();
  const supportEmail = getPublicSupportEmail();

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-white/65 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link href="/terms" className="transition hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy
          </Link>
          <Link href="/terms#billing-refunds" className="transition hover:text-white">
            Refunds & Cancellation
          </Link>
          <a href={`mailto:${supportEmail}`} className="transition hover:text-white">
            {supportEmail}
          </a>
        </div>
        <div className="text-white/45">
          Nightlife Flyers is operated by {legalName}.
        </div>
      </div>
    </footer>
  );
}
