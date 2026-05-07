import Link from "next/link";

const ADMIN_TOOLS = [
  {
    href: "/admin/analytics",
    title: "Analytics Dashboard",
    description: "Traffic, funnel events, top sources, landing pages, and recent activity.",
  },
  {
    href: "/admin/subscription",
    title: "Subscription Admin",
    description: "Manual subscription override tool for internal testing and support.",
  },
];

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">Admin</div>
          <h1 className="mt-2 text-3xl font-semibold">Internal Tools</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Internal routes for analytics and account operations. Analytics access is still restricted
            to configured admin emails.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {ADMIN_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-2xl border border-white/10 bg-neutral-900 p-5 transition hover:border-white/20 hover:bg-neutral-900/80"
            >
              <div className="text-lg font-semibold">{tool.title}</div>
              <p className="mt-2 text-sm text-white/60">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
