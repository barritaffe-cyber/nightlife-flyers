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

export type StartupTemplateOption = {
  key: string;
  label: string;
  desc: string;
  preview?: string;
};

interface StartupTemplatesProps {
  onSelect: (key: string, payload?: StartupSelectPayload) => void;
  onLoadProjectFile: (file: File) => Promise<void> | void;
  buildForYouEnabled: boolean;
  buildForYouLoading: boolean;
  buildForYouError: string | null;
  onBuildForYou: (payload: StartupBuildPayload) => Promise<void> | void;
  guestMode?: boolean;
  templateOptions?: ReadonlyArray<StartupTemplateOption>;
  djBackgroundOptions: ReadonlyArray<{
    id: string;
    src: string;
    name: string;
  }>;
}

const categories = [
  {
    key: "dj",
    label: "DJ / Promo",
    desc: "Built for DJs, artists, and performers who need to get the word out fast with polished promo flyers.",
    accent:
      "bg-[linear-gradient(135deg,rgba(10,14,20,0.98),rgba(14,31,49,0.92))] hover:bg-[linear-gradient(135deg,rgba(12,18,26,1),rgba(16,42,66,0.98))]",
    iconWrap:
      "bg-[linear-gradient(135deg,rgba(10,18,28,0.96),rgba(16,34,48,0.9))] text-cyan-100",
    icon: (
      <svg width="34" height="34" viewBox="0 0 64 64" fill="none" stroke="currentColor">
        <circle cx="24" cy="34" r="16" strokeWidth="2.1" opacity="0.9" />
        <circle cx="24" cy="34" r="9" strokeWidth="1.8" opacity="0.75" />
        <circle cx="24" cy="34" r="2.6" fill="currentColor" stroke="none" />
        <path strokeWidth="2.1" d="M40 17h10" />
        <path strokeWidth="2.1" d="M50 17v18.5" />
        <path strokeWidth="2.1" d="M50 35.5c0 4.1-3.4 7.5-7.5 7.5S35 39.6 35 35.5s3.4-7.5 7.5-7.5c1.9 0 3.5.6 4.8 1.7" />
        <path strokeWidth="2.1" d="M33.5 24.5l10 6.5" />
        <path strokeWidth="1.8" d="M10 50h28" opacity="0.45" />
      </svg>
    ),
  },
  {
    key: "advanced",
    label: "Creator Studio",
    desc: "Built for promoters, venue owners, and creative teams who need full campaign control, templates, and studio tools.",
    accent:
      "bg-[linear-gradient(135deg,rgba(10,14,20,0.98),rgba(31,22,44,0.94))] hover:bg-[linear-gradient(135deg,rgba(12,18,26,1),rgba(44,29,62,0.98))]",
    iconWrap:
      "bg-[linear-gradient(135deg,rgba(16,18,28,0.96),rgba(34,24,46,0.92))] text-fuchsia-100",
    icon: (
      <svg width="34" height="34" viewBox="0 0 64 64" fill="none" stroke="currentColor">
        <path strokeWidth="2" d="M32 12 49 22 49 42 32 52 15 42 15 22 32 12Z" />
        <path strokeWidth="1.8" opacity="0.9" d="M32 12v40" />
        <path strokeWidth="1.8" opacity="0.9" d="M15 22l17 10 17-10" />
        <path strokeWidth="1.8" opacity="0.9" d="M15 42l17-10 17 10" />
        <path strokeWidth="1.8" opacity="0.55" d="M22 17l20 30" />
        <path strokeWidth="1.8" opacity="0.45" d="M10 56h44" />
      </svg>
    ),
  },
] as const;

function hasAnyText(payload: StartupBuildPayload["currentText"]) {
  return Object.values(payload).some((value) => String(value || "").trim().length > 0);
}

const StartupTemplates: React.FC<StartupTemplatesProps> = ({
  onSelect,
  onLoadProjectFile,
  buildForYouEnabled,
  buildForYouLoading,
  buildForYouError,
  onBuildForYou,
  guestMode = false,
  templateOptions = [],
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
    guestMode && screen === "entry"
      ? "w-[min(94vw,780px)] max-h-[86vh] overflow-y-auto bg-[linear-gradient(180deg,rgba(9,11,16,0.99),rgba(13,16,24,0.98))] p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      : screen === "entry"
      ? "w-[min(92vw,420px)] max-h-[84vh] overflow-y-auto bg-[linear-gradient(180deg,rgba(10,12,18,0.99),rgba(13,16,24,0.98))] p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      : screen === "advanced"
      ? "w-[min(94vw,920px)] max-h-[84vh] overflow-y-auto bg-[linear-gradient(180deg,rgba(10,12,18,0.99),rgba(13,16,24,0.98))] p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      : "w-[min(92vw,620px)] max-h-[84vh] overflow-y-auto bg-[linear-gradient(180deg,rgba(10,12,18,0.99),rgba(13,16,24,0.98))] p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]";

  const startupButtonClass =
    "bg-white/[0.03] px-4 py-3 text-sm font-medium text-white shadow-[inset_0_0_0_0_rgba(0,0,0,0)] transition hover:bg-white/[0.06] disabled:opacity-60";
  const startupSecondaryButtonClass =
    "bg-white/[0.04] px-3 py-2 text-xs text-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-white/[0.07]";
  const advancedCardClass =
    "bg-[linear-gradient(180deg,rgba(55,31,71,0.22),rgba(14,17,25,0.92))] p-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition hover:bg-[linear-gradient(180deg,rgba(72,40,94,0.28),rgba(17,20,29,0.95))]";
  const advancedTemplateCardClass =
    "group relative overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(58,33,74,0.22),rgba(18,21,31,0.9))] text-left text-white shadow-[0_14px_32px_rgba(0,0,0,0.18)] transition hover:border-fuchsia-200/30 hover:bg-[linear-gradient(180deg,rgba(76,43,98,0.3),rgba(20,23,33,0.95))]";
  const advancedLabelClass = "text-[11px] uppercase tracking-[0.16em] text-fuchsia-100/55";
  const advancedButtonClass =
    startupButtonClass + " bg-fuchsia-500/[0.07] shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:bg-fuchsia-500/[0.11]";
  const advancedUploadClass =
    "mt-4 group flex w-full cursor-pointer items-center justify-center bg-fuchsia-500/[0.06] px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-colors hover:bg-fuchsia-500/[0.10]";
  const advancedBackButtonClass =
    startupSecondaryButtonClass + " bg-fuchsia-500/[0.06] text-fuchsia-50 hover:bg-fuchsia-500/[0.10]";
  const handleProjectFilePick = async (file?: File | null) => {
    if (!file) return;
    await onLoadProjectFile(file);
  };

  const renderTemplateCard = (template: StartupTemplateOption) => (
    <button
      key={template.key}
      type="button"
      disabled={buildForYouLoading}
      onClick={() => onSelect(template.key)}
      className={advancedTemplateCardClass}
    >
      <div className="aspect-[1.35] w-full overflow-hidden bg-black">
        {template.preview ? (
          <img
            src={template.preview}
            alt={template.label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-500">
            Template
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate text-sm font-semibold text-white">{template.label}</div>
          <div className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-fuchsia-100/60 transition group-hover:text-fuchsia-100">
            Start
          </div>
        </div>
        <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-neutral-300">
          {template.desc}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white/0 transition group-hover:bg-fuchsia-400/[0.04]" />
    </button>
  );

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
            guestMode ? (
              <div className="flex min-h-full flex-col justify-center text-left">
                <div className="mx-auto w-full max-w-[680px] text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                    Try the studio
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Pick one template to start</h2>
                  <p className="mt-2 text-sm text-neutral-400">
                    Choose any template and start editing before you sign up.
                  </p>
                </div>

                <div className="mx-auto mt-5 grid w-full max-w-[680px] grid-cols-1 gap-3 sm:grid-cols-2">
                  {templateOptions.map(renderTemplateCard)}
                </div>

                <div className="mx-auto mt-4 max-w-[680px] text-center text-[11px] text-neutral-500">
                  You can switch templates later inside Nightlife Flyers.
                </div>
              </div>
            ) : (
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
                      }
                    }}
                    className={
                      "group w-full px-4 py-4 text-left shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition duration-200 disabled:opacity-60 " +
                      category.accent
                    }
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={
                          "flex h-14 w-14 shrink-0 items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.2)] " +
                          category.iconWrap
                        }
                      >
                        {category.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[15px] font-semibold tracking-[0.01em] text-white">{category.label}</div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 transition group-hover:text-white/70">
                            Enter
                          </div>
                        </div>
                        <div className="mt-1 text-[12px] leading-4.5 text-white/80">{category.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <label className="mx-auto mt-3 flex w-full max-w-[360px] cursor-pointer items-center justify-center bg-fuchsia-500/[0.06] px-4 py-3 text-sm font-medium text-fuchsia-50 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-colors hover:bg-fuchsia-500/[0.10]">
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = "";
                  }}
                  onChange={(e) => {
                    void handleProjectFilePick(e.target.files?.[0]);
                  }}
                />
                Load Saved File
              </label>

              <div className="mt-3 text-[11px] text-neutral-500">
                Once you&apos;re in, you can switch the whole vibe.
              </div>
            </div>
            )
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
                  className={startupSecondaryButtonClass}
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
                    className="group overflow-hidden bg-[linear-gradient(180deg,rgba(19,24,34,0.98),rgba(16,20,29,0.98))] text-left shadow-[0_18px_40px_rgba(0,0,0,0.2)] transition hover:bg-[linear-gradient(180deg,rgba(22,28,40,1),rgba(18,23,33,1))] disabled:opacity-60"
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

              <label className="mt-4 flex w-full cursor-pointer items-center justify-center bg-neutral-800 px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-colors hover:bg-neutral-700">
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
                <div className="mt-3 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
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
                  className={advancedBackButtonClass}
                >
                  Back
                </button>
              </div>

              <div className={advancedCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div className={advancedLabelClass}>
                    Recommended
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-fuchsia-100/72">
                    Start Here
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-white">Start From Template</div>
                <div className="mt-1 text-sm text-neutral-300">
                  Fastest path for most flyers. Pick a layout, then swap text, background, portraits, and brand elements.
                </div>
                <div className="mt-4 max-h-[48vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {templateOptions.map(renderTemplateCard)}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-left">
                <div className={advancedLabelClass}>
                  Other Ways To Start
                </div>
              </div>

              <div className="mt-3 grid gap-4 text-left md:grid-cols-2">
                <div className={advancedCardClass}>
                  <div className={advancedLabelClass}>
                    Build From Background
                  </div>
                  <div className="mt-2 text-sm text-neutral-200">
                    Upload a background, add your text, and let AI build the first square and story layouts.
                  </div>
                  <button
                    type="button"
                    onClick={openBuildForYou}
                    disabled={buildForYouLoading}
                    className={advancedButtonClass + " mt-4 w-full"}
                  >
                    Build For You
                  </button>
                  {!buildForYouEnabled && (
                    <div className="mt-2 text-[11px] text-amber-300">
                      Upgrade to Creator or Studio to unlock this startup flow.
                    </div>
                  )}
                </div>

                <div className={advancedCardClass}>
                  <div className={advancedLabelClass}>
                    Open Saved Design
                  </div>
                  <div className="mt-2 text-sm text-neutral-200">
                    Reopen a saved project file and keep working from where you left off.
                  </div>
                  <label className={advancedUploadClass}>
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                      onChange={(e) => {
                        void handleProjectFilePick(e.target.files?.[0]);
                      }}
                    />
                    <span className="flex items-center gap-2 text-sm font-medium text-fuchsia-50 group-hover:text-white">
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
                  className={startupSecondaryButtonClass}
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
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
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
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
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
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
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
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
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
                        className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
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
                        className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Background
                    </label>
                    <label className="flex min-h-[220px] cursor-pointer items-center justify-center bg-black/20 p-4 text-center shadow-[0_14px_32px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.04]">
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
                          className="max-h-[280px] w-full object-cover"
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
                    <div className="bg-amber-400/10 px-3 py-2 text-xs text-amber-200 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                      {localError || buildForYouError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleBuildSubmit()}
                    disabled={buildForYouLoading}
                    className="w-full bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
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
