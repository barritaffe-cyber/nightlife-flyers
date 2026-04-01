"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type StartupBuildPayload = {
  backgroundFile: File;
  currentText: {
    headline: string;
    head2: string;
    details: string;
    details2: string;
    venue: string;
    subtag: string;
  };
};

export type StartupSelectPayload = {
  startupBackgroundSrc?: string;
  startupBackgroundDataUrl?: string;
};

interface StartupTemplatesProps {
  onSelect: (key: string, payload?: StartupSelectPayload) => void;
  importDesignJSON: (json: string) => void;
  buildForYouEnabled: boolean;
  buildForYouLoading: boolean;
  buildForYouError: string | null;
  onBuildForYou: (payload: StartupBuildPayload) => Promise<void> | void;
  djBackgroundOptions: ReadonlyArray<{
    id: string;
    src: string;
    name: string;
  }>;
}

const templates = [
  {
    key: "club",
    label: "Miami Nights",
    desc: "Ocean Drive glow & neon nightlife",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l1.8 4.7L19 9l-4.2 3.3L16.2 18 12 15.3 7.8 18l1.4-5.7L5 9l5.2-1.3L12 3z" />
      </svg>
    ),
  },
  {
    key: "tropical",
    label: "Latin Tropical Street",
    desc: "Street party energy with warm color",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4v6m0 0l4-4m-4 4L8 6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 20h16M6 16h12M8 12h8" />
      </svg>
    ),
  },
  {
    key: "luxury",
    label: "Atlanta Skyline",
    desc: "City lights, late-night skyline mood",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l8 9-8 9-8-9 8-9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6" />
      </svg>
    ),
  },
  {
    key: "urban",
    label: "Hip Hop Block Party",
    desc: "Street party energy, raw crowd vibe",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 20h18" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 20V8l6-3 6 3v12" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10 20v-4h4v4" />
      </svg>
    ),
  },
] as const;

const categories = [
  {
    key: "dj",
    label: "DJ / Promo",
    desc: "Built for DJs, artists, and performers who need to get the word out fast with polished promo flyers.",
    accent: "border-transparent",
  },
  {
    key: "advanced",
    label: "Creator Studio",
    desc: "Built for promoters, venue owners, and creative teams who need full campaign control, templates, and studio tools.",
    accent: "border-transparent",
  },
] as const;

function hasAnyText(payload: StartupBuildPayload["currentText"]) {
  return Object.values(payload).some((value) => String(value || "").trim().length > 0);
}

const StartupTemplates: React.FC<StartupTemplatesProps> = ({
  onSelect,
  importDesignJSON,
  buildForYouEnabled,
  buildForYouLoading,
  buildForYouError,
  onBuildForYou,
  djBackgroundOptions,
}) => {
  const [screen, setScreen] = React.useState<"entry" | "advanced" | "build" | "dj">("entry");
  const [headline, setHeadline] = React.useState("");
  const [head2, setHead2] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [details2, setDetails2] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [subtag, setSubtag] = React.useState("");
  const [backgroundFile, setBackgroundFile] = React.useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!backgroundFile) {
      setBackgroundPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(backgroundFile);
    setBackgroundPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [backgroundFile]);

  const handleBuildSubmit = async () => {
    setLocalError(null);
    if (!buildForYouEnabled) {
      setLocalError("Creator and Studio plans include Build For You.");
      return;
    }
    if (!backgroundFile) {
      setLocalError("Upload a background first.");
      return;
    }

    const currentText = { headline, head2, details, details2, venue, subtag };
    if (!hasAnyText(currentText)) {
      setLocalError("Add at least one text field so AI has something to lay out.");
      return;
    }

    await onBuildForYou({
      backgroundFile,
      currentText,
    });
  };

  const openAdvancedStudio = () => {
    setLocalError(null);
    setScreen("advanced");
  };

  const openBuildForYou = () => {
    setLocalError(null);
    setScreen("build");
  };

  const goBackToEntry = () => {
    setLocalError(null);
    setScreen("entry");
  };

  const goBackToAdvanced = () => {
    setLocalError(null);
    setScreen("advanced");
  };

  const handleDjBackgroundUpload = async (file?: File | null) => {
    if (!file) return;
    setLocalError(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read the uploaded background."));
      reader.readAsDataURL(file);
    }).catch((err) => {
      setLocalError(err instanceof Error ? err.message : "Could not read the uploaded background.");
      return null;
    });
    if (!dataUrl) return;
    onSelect("dj", { startupBackgroundDataUrl: dataUrl });
  };

  const modalClassName =
    screen === "entry"
      ? "w-[min(92vw,420px)] max-h-[84vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      : "w-[min(92vw,620px)] max-h-[84vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      >
        <div className={modalClassName}>
          {screen === "entry" ? (
            <div className="flex min-h-full flex-col justify-center">
              <h2 className="mb-1 text-xl font-semibold text-white">What are you making?</h2>
              <p className="mb-4 text-sm text-neutral-400">
                Choose your lane for tonight.
              </p>

              <div className="mx-auto flex w-full max-w-[360px] flex-col gap-2.5">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    disabled={buildForYouLoading}
                    onClick={() => {
                      if (category.key === "dj") {
                        setLocalError(null);
                        setScreen("dj");
                        return;
                      }
                      if (category.key === "advanced") {
                        openAdvancedStudio();
                        return;
                      }
                      onSelect(category.key);
                    }}
                    className={
                      "group w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-center transition hover:border-cyan-400/30 hover:bg-white/[0.05] disabled:opacity-60 " +
                      category.accent
                    }
                  >
                    <div className="text-[15px] font-semibold text-white">{category.label}</div>
                    <div className="mt-1 text-[12px] leading-4.5 text-neutral-400">{category.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-neutral-500">
                Once you&apos;re in, you can switch the whole vibe.
              </div>
            </div>
          ) : screen === "dj" ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 text-left">
                <div>
                  <h2 className="text-xl font-semibold text-white">DJ / Promo</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Pick the background first, then we&apos;ll open the flyer with the DJ workflow ready.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goBackToEntry}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {djBackgroundOptions.map((background) => (
                  <button
                    key={background.id}
                    type="button"
                    disabled={buildForYouLoading}
                    onClick={() => onSelect("dj", { startupBackgroundSrc: background.src })}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-[#111723] text-left transition hover:border-cyan-400/45 hover:bg-[#151d2b] disabled:opacity-60"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden bg-black">
                      <img
                        src={background.src}
                        alt={background.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="px-3 py-2">
                      <div className="text-[13px] font-semibold text-white">{background.name}</div>
                    </div>
                  </button>
                ))}
              </div>

              <label className="mt-4 flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-600 bg-neutral-800 px-4 py-3 text-sm text-white transition-colors hover:bg-neutral-700">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleDjBackgroundUpload(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
                Upload My Background
              </label>

              {localError && (
                <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
                  {localError}
                </div>
              )}
            </>
          ) : screen === "advanced" ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 text-left">
                <div>
                  <h2 className="text-xl font-semibold text-white">Creator Studio</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Start with a proven flyer template, then customize the layout, copy, and assets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goBackToEntry}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
              </div>

              <div className="border border-white/10 bg-white/[0.03] p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Recommended
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-300">
                    Start Here
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-white">Start From Template</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Fastest path for most flyers. Pick a layout, then swap text, background, portraits, and brand elements.
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.key}
                      onClick={() => onSelect(template.key)}
                      className="group relative border border-white/10 bg-white/[0.03] p-3.5 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="mb-2 text-2xl text-neutral-200">{template.icon}</div>
                      <div className="font-semibold text-white">{template.label}</div>
                      <div className="mt-1 text-[11px] leading-5 text-neutral-400">{template.desc}</div>
                      <div className="pointer-events-none absolute inset-0 bg-white/0 transition group-hover:bg-white/[0.03]" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-left">
                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Other Ways To Start
                </div>
              </div>

              <div className="mt-3 grid gap-4 text-left md:grid-cols-2">
                <div className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Build From Background
                  </div>
                  <div className="mt-2 text-sm text-neutral-300">
                    Upload a background, add your text, and let AI build the first square and story layouts.
                  </div>
                  <button
                    type="button"
                    onClick={openBuildForYou}
                    disabled={buildForYouLoading}
                    className="mt-4 w-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    Build For You
                  </button>
                  {!buildForYouEnabled && (
                    <div className="mt-2 text-[11px] text-amber-300">
                      Upgrade to Creator or Studio to unlock this startup flow.
                    </div>
                  )}
                </div>

                <div className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Open Saved Design
                  </div>
                  <div className="mt-2 text-sm text-neutral-300">
                    Reopen a saved project file and keep working from where you left off.
                  </div>
                  <label className="mt-4 group flex w-full cursor-pointer items-center justify-center border border-dashed border-neutral-600 bg-neutral-800 px-4 py-3 transition-colors hover:bg-neutral-700">
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          importDesignJSON(String(reader.result));
                        };
                        reader.readAsText(file);
                      }}
                    />
                    <span className="flex items-center gap-2 text-sm font-medium text-neutral-400 group-hover:text-white">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Saved Design
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 text-left">
                <div>
                  <h2 className="text-2xl font-bold text-white">Build For You</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Upload your background, enter the text you want to appear, and AI will format both square and story flyers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goBackToAdvanced}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
              </div>

              <div className="grid gap-5 text-left md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Headline
                    </label>
                    <textarea
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      rows={2}
                      placeholder="Main event title"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Headline 2
                    </label>
                    <input
                      value={head2}
                      onChange={(e) => setHead2(e.target.value)}
                      placeholder="Optional sub-headline"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Details
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={4}
                      placeholder={"Date / time / attractions\nLine breaks are preserved"}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Details 2
                    </label>
                    <textarea
                      value={details2}
                      onChange={(e) => setDetails2(e.target.value)}
                      rows={2}
                      placeholder="Optional supporting line"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                        Venue
                      </label>
                      <input
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="Optional venue"
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                        Subtag
                      </label>
                      <input
                        value={subtag}
                        onChange={(e) => setSubtag(e.target.value)}
                        placeholder="Optional pill label"
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Background
                    </label>
                    <label className="flex min-h-[220px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-center transition hover:bg-white/[0.04]">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBackgroundFile(file);
                        }}
                      />
                      {backgroundPreview ? (
                        <img
                          src={backgroundPreview}
                          alt="Background preview"
                          className="max-h-[280px] w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-white">Upload background image</div>
                          <div className="mt-2 text-xs text-neutral-500">
                            AI will analyze this exact image and build square + story layouts from it.
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {(localError || buildForYouError) && (
                    <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                      {localError || buildForYouError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleBuildSubmit()}
                    disabled={buildForYouLoading}
                    className="w-full rounded-lg bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
                  >
                    {buildForYouLoading ? "Building square + story..." : "Build Flyer"}
                  </button>

                  <div className="text-[11px] text-neutral-500">
                    Anything left blank stays out. AI handles layout, font choice, spacing, and color treatment around your supplied text.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StartupTemplates;
