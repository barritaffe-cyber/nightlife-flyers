import Link from "next/link";
import {
  getPublicLegalName,
  getPublicMerchantAddress,
  getPublicSupportPhone,
  getPublicTransactionCurrency,
} from "../../lib/publicIdentity";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Nightlife Flyers.",
};

const EFFECTIVE_DATE = "March 12, 2026";
const LEGAL_NAME = getPublicLegalName();
const MERCHANT_ADDRESS = getPublicMerchantAddress();
const SUPPORT_PHONE = getPublicSupportPhone();
const TRANSACTION_CURRENCY = getPublicTransactionCurrency();

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: [
      "These Terms of Service govern your access to and use of Nightlife Flyers, including the design studio, templates, AI-assisted tools, exports, subscriptions, passes, and related services.",
      "By accessing or using Nightlife Flyers, you agree to these Terms. If you do not agree, do not use the service.",
    ],
  },
  {
    id: "eligibility-accounts",
    title: "2. Eligibility and Accounts",
    body: [
      "You must be legally able to enter into a binding agreement to use the service. If you create an account, you are responsible for maintaining the security of your login credentials and for activity under your account.",
      "You may not share paid access in a way that circumvents device limits, pass windows, generation caps, or other access controls.",
    ],
  },
  {
    id: "starter-paid-access",
    title: "3. Starter Access and Paid Access",
    body: [
      "Nightlife Flyers may offer a starter mode that allows limited template browsing and layout editing without paid AI access. Starter mode may include watermarked previews or exports and may restrict uploads, project save/load, premium tools, or other features.",
      "Paid access may be offered through subscriptions or one-time passes. Paid access unlocks the features, export rights, and generation allowances shown in the app or at checkout.",
    ],
  },
  {
    id: "billing-refunds",
    title: "4. Passes, Subscriptions, Billing, Refunds, and Cancellation",
    body: [
      "Subscriptions renew automatically on the billing cycle shown at checkout until canceled. If you cancel, your subscription remains active through the end of the then-current billing period unless otherwise stated at checkout.",
      "For recurring subscription purchases, the checkout page presents the recurring payment agreement details before purchase, including the amount, whether the amount is fixed or variable, the recurring schedule, whether the schedule date is fixed or variable, and the communication method used for cardholder correspondence.",
      "Recurring subscription charges are intended to be fixed in amount for the selected plan unless we notify you of a qualifying change. Renewal dates are intended to follow the same billing date pattern as the initial purchase date for the selected monthly or yearly cycle.",
      "Recurring payment confirmations and recurring-agreement notices will be sent by email to the email address associated with your Nightlife Flyers account or the contact email used at checkout. We aim to provide initial recurring-agreement confirmation within two business days of consent.",
      "If more than six months have elapsed since the last recurring payment, if a trial period, introductory offer, or promotional activity expires, or if the recurring amount or recurring payment date changes, we will provide advance notice by email before the next recurring payment is taken. Where required by the applicable card-scheme rule, that notice will be sent at least seven working days in advance.",
      "You can cancel a subscription before its next renewal through the billing portal when available or by contacting support at the email listed below. Canceling stops future renewal charges; it does not rewind or shorten the current paid billing period.",
      "One-time passes do not renew automatically. Passes expire at the end of the access window shown at checkout, even if all included generations are not used.",
      "Generation limits, access windows, and feature availability are part of the product offering. Unused generations do not roll over unless we expressly say otherwise. We may block further paid-tool use after a plan or pass limit is reached.",
      "Fees are non-refundable except where required by law or where we expressly provide otherwise at checkout or in writing. This means we generally do not provide refunds for partial subscription periods, unused time remaining in a billing cycle, expired passes, or unused generations.",
      "If you believe you were charged in error, charged more than once for the same purchase, or experienced a billing problem caused by our system, contact support promptly so we can review the charge and, where appropriate, issue a correction or refund.",
    ],
  },
  {
    id: "privacy-data-use",
    title: "5. Privacy and Data Use",
    body: [
      "Your use of Nightlife Flyers is also subject to our Privacy Policy, which explains how we collect, use, store, and share account information, uploaded assets, generated content, usage data, and support communications.",
      "By using the service, you acknowledge that we may process your information as described in the Privacy Policy, including through service providers and AI feature providers used to operate the product.",
    ],
  },
  {
    id: "user-content",
    title: "6. User Content",
    body: [
      "You retain ownership of content you upload or submit, including images, logos, text, and other assets. You grant Nightlife Flyers a limited license to host, process, transform, and display that content solely to operate the service for you.",
      "You represent that you have the rights needed to upload, edit, generate from, export, and use your content and the resulting materials.",
    ],
  },
  {
    id: "ai-features",
    title: "7. AI Features and Outputs",
    body: [
      "AI-assisted tools may generate variable or unexpected results. You are responsible for reviewing all outputs before using, publishing, printing, advertising, or distributing them.",
      "You may not use the service to generate or process unlawful, infringing, deceptive, defamatory, abusive, or rights-violating content.",
    ],
  },
  {
    id: "acceptable-use",
    title: "8. Acceptable Use",
    body: [
      "You may not misuse the service, interfere with other users, attempt unauthorized access, reverse engineer protected parts of the service, scrape the service at scale, or use automated methods to avoid payment, quotas, device limits, watermarks, or other restrictions.",
      "We may suspend or terminate access if we reasonably believe your use violates these Terms, creates risk to the service, or exposes us or other users to legal or operational harm.",
    ],
  },
  {
    id: "storage-reliability",
    title: "9. Project Storage and Reliability",
    body: [
      "Local browser storage, temporary snapshots, and in-session design recovery are convenience features only. They are not guaranteed backups and may be cleared, overwritten, or lost due to browser behavior, storage limits, logout events, device changes, or service updates.",
      "You are responsible for saving any project files or exported outputs you want to keep. Nightlife Flyers is not responsible for lost work, lost drafts, or corrupted local session data.",
    ],
  },
  {
    id: "delivery-policy",
    title: "10. Delivery Policy",
    body: [
      "Nightlife Flyers is a digital service. Access to plans, passes, and related paid features is delivered electronically after successful payment and account confirmation.",
      "Subscription access generally becomes available after the payment provider confirms the transaction. One-time pass access activates for the purchase window shown at checkout. Delivery may be delayed by payment review, fraud checks, provider outages, account-authentication issues, or other security controls.",
    ],
  },
  {
    id: "export-restrictions",
    title: "11. Export Restrictions and Prohibited Use",
    body: [
      "You may not use the service in violation of applicable export controls, sanctions, payment restrictions, or other laws governing digital services and software access.",
      "If export, sanctions, banking, or card-network restrictions apply to your location, entity, or intended use, you are responsible for complying with them before purchase or use.",
    ],
  },
  {
    id: "intellectual-property",
    title: "12. Intellectual Property",
    body: [
      "Nightlife Flyers and its underlying software, branding, templates, interface elements, and service design are owned by Nightlife Flyers or its licensors and are protected by applicable intellectual property laws.",
      "These Terms do not transfer ownership of the service or our intellectual property to you. Except as expressly allowed by the service, you may not copy, resell, license, or distribute the service itself.",
    ],
  },
  {
    id: "service-availability",
    title: "13. Service Changes and Availability",
    body: [
      "We may add, remove, limit, or modify features, templates, quotas, pricing, providers, or access rules at any time. We may also suspend or discontinue the service, in whole or in part.",
      "We do not guarantee uninterrupted availability, error-free operation, permanent storage, or compatibility with every device, browser, or third-party provider.",
    ],
  },
  {
    id: "disclaimers",
    title: "14. Disclaimers",
    body: [
      "The service is provided on an 'as is' and 'as available' basis to the fullest extent permitted by law. We disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted availability.",
    ],
  },
  {
    id: "liability",
    title: "15. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, Nightlife Flyers and its operators, affiliates, service providers, and licensors will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost data, lost goodwill, or business interruption arising out of or related to your use of the service.",
      "To the fullest extent permitted by law, our total liability for any claim arising out of or relating to the service will not exceed the amount you paid to Nightlife Flyers for the service giving rise to the claim during the 12 months before the event giving rise to liability.",
    ],
  },
  {
    id: "termination",
    title: "16. Termination",
    body: [
      "You may stop using the service at any time. We may suspend or terminate your access at any time if we believe you violated these Terms, misused the service, failed to pay, or created legal, billing, security, or operational risk.",
      "Sections that by their nature should survive termination will survive, including provisions on payment obligations, intellectual property, disclaimers, limitation of liability, and dispute-related terms.",
    ],
  },
  {
    id: "changes",
    title: "17. Changes to These Terms",
    body: [
      "We may update these Terms from time to time. The updated version becomes effective when posted on this page unless otherwise stated. Your continued use of the service after an update means you accept the revised Terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-white">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-neutral-950/90 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide text-fuchsia-400 transition hover:text-fuchsia-300"
        >
          ← Back to Studio
        </Link>
        <h1 className="text-lg font-semibold text-white/90">Terms of Service</h1>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-200">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-neutral-400">Effective date: {EFFECTIVE_DATE}</p>
          <p>
            These Terms are written to match the current Nightlife Flyers product, including
            starter access, watermarked exports, one-time passes, subscriptions, and
            generation-based paid tools.
          </p>
          <p className="text-neutral-400">Nightlife Flyers is operated by {LEGAL_NAME}.</p>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-50">
          <h2 className="text-base font-semibold text-white">Billing, Refund, and Cancellation Summary</h2>
          <p>
            Subscriptions renew automatically until canceled. Canceling stops future renewals and
            does not end the current paid period early.
          </p>
          <p>
            Passes do not renew. Fees are generally non-refundable, including unused time,
            unused generations, and expired pass access, except where required by law or where
            we choose to make an exception.
          </p>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-neutral-200">
          <h2 className="text-base font-semibold text-white">Privacy Summary</h2>
          <p>
            Your use of Nightlife Flyers is also subject to our{" "}
            <Link href="/privacy" className="text-white underline underline-offset-4">
              Privacy Policy
            </Link>
            , which explains how we handle account data, uploads, generated content, and
            service usage information.
          </p>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-neutral-200">
          <h2 className="text-base font-semibold text-white">Merchant and Purchase Information</h2>
          <p>Transaction currency: {TRANSACTION_CURRENCY}.</p>
          <p>
            Customer service: <Link href="/contact" className="text-white underline underline-offset-4">Contact us</Link>
            {SUPPORT_PHONE ? <span>{` · ${SUPPORT_PHONE}`}</span> : null}
          </p>
          {MERCHANT_ADDRESS ? <p>Merchant address: {MERCHANT_ADDRESS}</p> : null}
          <p>
            Payment card details are transmitted through encrypted HTTPS/TLS connections to the
            hosted payment flow. Nightlife Flyers does not store full payment card numbers on its own servers.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title} id={section.id} className="scroll-mt-24 space-y-2">
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">18. Contact</h2>
            <p>
              Questions about these Terms can be sent through our{" "}
              <Link href="/contact" className="text-white underline underline-offset-4">
                contact page
              </Link>
              {SUPPORT_PHONE ? <span>{` or ${SUPPORT_PHONE}`}</span> : null}
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
