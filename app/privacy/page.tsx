import Link from "next/link";
import { getPublicLegalName } from "../../lib/publicIdentity";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Nightlife Flyers.",
};

const EFFECTIVE_DATE = "March 28, 2026";

function getContactEmail() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nightlife-flyers.com";
  const siteHost = siteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "nightlife-flyers.com";
  const fromValue = process.env.EMAIL_FROM || "";
  const emailMatch =
    fromValue.match(/<([^>]+)>/) ||
    fromValue.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const extracted = emailMatch?.[1] || emailMatch?.[0] || "";

  if (extracted && !/^no-reply@/i.test(extracted)) {
    return extracted;
  }

  return `support@${siteHost}`;
}

const CONTACT_EMAIL = getContactEmail();
const LEGAL_NAME = getPublicLegalName();

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-white">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-neutral-950/90 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide text-fuchsia-400 transition hover:text-fuchsia-300"
        >
          ← Back to Studio
        </Link>
        <h1 className="text-lg font-semibold text-white/90">Privacy Policy</h1>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-200">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-neutral-400">Effective date: {EFFECTIVE_DATE}</p>
          <p>
            This Privacy Policy explains how Nightlife Flyers collects, uses, stores, and
            shares information when you use the website, design studio, AI-assisted tools,
            billing flows, and related services.
          </p>
          <p className="text-neutral-400">Nightlife Flyers is operated by {LEGAL_NAME}.</p>
        </div>

        <div className="mt-8 space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Information We Collect</h2>
            <p>
              We may collect information you provide directly, including your name, email
              address, login credentials handled through our authentication providers, billing
              details provided through our payment provider, support messages, uploaded images,
              logos, text content, and other design assets you submit to the service.
            </p>
            <p>
              We also collect technical and usage information needed to operate the product,
              such as device and browser details, session information, log data, project usage,
              feature activity, and generation or export activity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. How We Use Information</h2>
            <p>
              We use information to provide and secure the service, authenticate users,
              process payments, manage subscriptions or passes, deliver exports, operate AI
              features, respond to support requests, prevent abuse, monitor reliability, and
              improve the product.
            </p>
            <p>
              We do not sell your personal information for money. We may use aggregated or
              de-identified usage information to understand product performance and improve the
              service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. AI and Service Providers</h2>
            <p>
              When you use AI-assisted features, uploaded content, prompts, and related inputs
              may be processed by third-party providers that help us generate results, remove
              backgrounds, or perform related image operations.
            </p>
            <p>
              We may also use third-party providers for hosting, storage, authentication,
              analytics, email delivery, and payments. These providers may process information
              on our behalf to operate the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">4. Payments and Billing Data</h2>
            <p>
              Payments are processed by our payment provider. We do not store full payment card
              numbers on our own servers. We may store limited billing-related information such
              as plan status, current billing period, payment provider customer IDs, and
              subscription identifiers to manage account access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">5. Data Retention</h2>
            <p>
              We keep information for as long as reasonably necessary to operate the service,
              maintain account history, enforce our terms, comply with legal obligations,
              resolve disputes, and support legitimate business operations.
            </p>
            <p>
              Some project data may also persist in local browser storage on your device until
              it is cleared, overwritten, or removed by you or by browser behavior.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">6. Sharing of Information</h2>
            <p>
              We may share information with service providers, payment providers, hosting and
              infrastructure providers, analytics providers, AI feature providers, legal
              advisors, or authorities where reasonably necessary to operate the service,
              enforce our terms, protect rights and security, or comply with law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">7. Your Choices</h2>
            <p>
              You may choose what content you upload, whether to continue using paid services,
              and whether to contact us for account or privacy requests. You may also stop
              using the service at any time.
            </p>
            <p>
              If you want to request deletion of account-related personal information that we
              control, contact us using the email below. We may retain certain information
              where required for legal, security, fraud prevention, billing, or recordkeeping
              purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">8. Security</h2>
            <p>
              We use reasonable administrative, technical, and organizational measures to help
              protect information, but no system can be guaranteed completely secure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version becomes
              effective when posted on this page unless otherwise stated.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">10. Contact</h2>
            <p>
              For privacy questions or requests, contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
