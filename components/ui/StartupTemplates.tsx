"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StartupTemplatesProps {
  onSelect: (key: string) => void;
  importDesignJSON: (json: string) => void;
}

const StartupTemplates: React.FC<StartupTemplatesProps> = ({ onSelect, importDesignJSON }) => {
  const templates = [
    {
      key: "club",
      label: "Club Night",
      desc: "High-energy lighting & neon tones",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l1.8 4.7L19 9l-4.2 3.3L16.2 18 12 15.3 7.8 18l1.4-5.7L5 9l5.2-1.3L12 3z" />
        </svg>
      ),
    },
    {
      key: "tropical",
      label: "Tropical Sunset",
      desc: "Beach, palm trees, warm sunset glow",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4v6m0 0l4-4m-4 4L8 6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 20h16M6 16h12M8 12h8" />
        </svg>
      ),
    },
    {
      key: "luxury",
      label: "Luxury Event",
      desc: "Gold accents, marble textures, upscale vibe",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l8 9-8 9-8-9 8-9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6" />
        </svg>
      ),
    },
    {
      key: "urban",
      label: "Urban Party",
      desc: "Dark club, strobes, graffiti background",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 20h18" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 20V8l6-3 6 3v12" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10 20v-4h4v4" />
        </svg>
      ),
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      >
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-[500px] text-center shadow-2xl">
          <h2 className="text-white text-2xl font-bold mb-1">Choose a Vibe</h2>
          <p className="text-neutral-400 text-sm mb-2">
            Start with a curated template, then customize everything.
          </p>
          <p className="text-neutral-500 text-xs mb-6">
            Pick a vibe to load a full layout (type, colors, background). You can drag elements, swap media, and refine styles anytime.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {templates.map((t) => (
              <button
                key={t.key}
                onClick={() => onSelect(t.key)}
                className="group relative p-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 transition border border-neutral-700 hover:border-fuchsia-400"
              >
                <div className="text-3xl mb-2 text-neutral-200">{t.icon}</div>
                <div className="text-white font-semibold">{t.label}</div>
                <div className="text-neutral-400 text-xs mt-1">{t.desc}</div>
                <div className="absolute inset-0 rounded-xl bg-fuchsia-400/0 group-hover:bg-fuchsia-400/5 transition" />
              </button>
            ))}
          </div>

          <div className="text-[11px] text-neutral-500 mt-6">
            Tip: Use the right panels to edit text, effects, and assets once the template loads.
          </div>
{/* 🧩 Upload Saved Design — Self-Contained & Safe */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <label className="relative flex items-center justify-center w-full px-4 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 border-dashed cursor-pointer transition-colors group">
          
          {/* 1. The input lives right here, no external refs needed */}
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onClick={(e) => {
              // Reset value so you can reload the same file if needed
              (e.target as HTMLInputElement).value = "";
            }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                const result = String(reader.result);
                
                // 2. Send data to parent logic (page.tsx)
                if (importDesignJSON) {
                  importDesignJSON(result);
                }
              };
              reader.readAsText(file);
            }}
          />

          {/* 3. The Visual Button Label */}
          <span className="flex items-center gap-2 text-sm text-neutral-400 group-hover:text-white font-medium">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Saved Design
          </span>
        </label>
      </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StartupTemplates;
