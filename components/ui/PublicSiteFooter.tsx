"use client";

import Link from "next/link";
import {
  getPublicLegalName,
  getPublicMerchantAddress,
  getPublicSupportEmail,
  getPublicSupportPhone,
  getPublicTransactionCurrency,
} from "../../lib/publicIdentity";
import PaymentMarks from "./PaymentMarks";

export default function PublicSiteFooter() {
  const legalName = getPublicLegalName();
  const supportEmail = getPublicSupportEmail();
  const supportPhone = getPublicSupportPhone();
  const merchantAddress = getPublicMerchantAddress();
  const currency = getPublicTransactionCurrency();

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-center text-xs text-white/65 sm:px-6 sm:text-left">
        <div className="flex justify-center sm:justify-start">
          <PaymentMarks compact />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
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
          {supportPhone ? <span>{supportPhone}</span> : null}
        </div>
        <div className="space-y-1 text-white/45">
          <div>Nightlife Flyers is operated by {legalName}.</div>
          <div>Transaction currency: {currency}.</div>
          {merchantAddress ? <div>Merchant address: {merchantAddress}</div> : null}
        </div>
      </div>
    </footer>
  );
}
