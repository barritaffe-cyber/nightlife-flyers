"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import PublicSiteFooter from "../../components/ui/PublicSiteFooter";
import { getPublicSupportPhone } from "../../lib/publicIdentity";

type SubmitState = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const supportPhone = getPublicSupportPhone();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "bug") {
      setSubject((current) => current || "Bug Report");
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setSubmitState("error");
        setError(data?.error || "Could not send your message.");
        return;
      }
      setSubmitState("sent");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setWebsite("");
    } catch {
      setSubmitState("error");
      setError("Could not send your message.");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/branding/nf-logo.png" alt="Nightlife Flyers" width={30} height={30} className="rounded-md" />
            <span
              className="text-sm tracking-[0.18em] text-white/90"
              style={{ fontFamily: '"LEMONMILK-Bold", "Segoe UI", sans-serif' }}
            >
              NIGHTLIFE FLYERS
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/85 transition hover:border-white/30 hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-fuchsia-400"
            >
              Enter Studio
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">Contact Us</div>
          <h1 className="mt-3 text-3xl leading-tight sm:text-5xl" style={{ fontFamily: '"Nexa-Heavy", "Segoe UI", sans-serif' }}>
            Send us a message.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/68 sm:text-base">
            Use this page for support, billing questions, partnership inquiries, or anything else you need.
          </p>
          <div className="mt-6 space-y-2 text-sm text-white/72">
            <div>Use the form and we’ll reply by email.</div>
            {supportPhone ? <div>Phone: {supportPhone}</div> : null}
          </div>
        </div>

        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_28px_70px_rgba(0,0,0,0.45)] sm:p-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/46">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-3 text-[16px] text-white outline-none transition focus:border-cyan-400/60"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/46">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-3 text-[16px] text-white outline-none transition focus:border-cyan-400/60"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/46">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-3 text-[16px] text-white outline-none transition focus:border-cyan-400/60"
                placeholder="What do you need help with?"
              />
            </label>

            <label className="hidden" aria-hidden="true">
              <span>Website</span>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/46">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 text-[16px] text-white outline-none transition focus:border-cyan-400/60"
                placeholder={subject === "Bug Report" ? "Describe the bug, what device you were using, and what happened." : "Tell us what you need."}
              />
            </label>

            {submitState === "sent" ? (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
                Your message was sent.
              </div>
            ) : null}

            {submitState === "error" && error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitState === "sending"}
              className="w-full rounded-xl bg-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState === "sending" ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
