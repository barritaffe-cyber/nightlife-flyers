"use client";

import * as React from "react";
import clsx from "clsx";
import {
  ChevronDown,
  Download,
  ImagePlus,
  Palette,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";

export type CocoQuickEditFormat = "square" | "story";

export type CocoQuickEditFieldName =
  | "eventName"
  | "date"
  | "time"
  | "venue"
  | "address"
  | "lineup"
  | "details"
  | "offer"
  | "rsvp"
  | "rsvpLabel"
  | "presenter"
  | "entry"
  | "age"
  | "responsible"
  | "social";

export type CocoQuickEditFields = {
  eventName: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  lineup: string;
  details: string;
  /** Pass an empty string to show an optional offer or promotion field. */
  offer?: string;
  /** Pass an empty string to show an optional RSVP or booking contact field. */
  rsvp?: string;
  /** Pass an empty string to expose the recipe's editable RSVP label. */
  rsvpLabel?: string;
  /** Pass an empty string to show an optional field with no current value. */
  presenter?: string;
  /** Pass an empty string to show an optional field with no current value. */
  entry?: string;
  /** Pass an empty string to show an optional field with no current value. */
  age?: string;
  /** Pass an empty string to expose the recipe's responsible-drinking object. */
  responsible?: string;
  /** Pass an empty string to show an optional field with no current value. */
  social?: string;
};

export type CocoQuickEditProps = {
  guide?: React.ReactNode;
  styleScopeLabel?: string;
  renderSizeControls?: (field: string) => React.ReactNode;
  eventBriefEditor?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  disabledFields?: Partial<Record<CocoQuickEditFieldName, boolean>>;
  disabledFormats?: Partial<Record<CocoQuickEditFormat, boolean>>;
  fieldLabels?: Partial<Record<CocoQuickEditFieldName, string>>;
  fields: CocoQuickEditFields;
  format: CocoQuickEditFormat;
  formatTransitioning?: boolean;
  isCyclingPalette?: boolean;
  isExporting?: boolean;
  isImprovingCutout?: boolean;
  isReplacingScene?: boolean;
  isReplacingSubject?: boolean;
  canReplaceScene?: boolean;
  canReplaceSubject?: boolean;
  isReplacingLogo?: boolean;
  isSaving?: boolean;
  onCyclePalette: () => void;
  onExportBoth: () => void;
  onFieldChange: (field: CocoQuickEditFieldName, value: string) => void;
  /** Useful for debounced layout fitting without keeping a second field draft. */
  onFieldCommit?: (field: CocoQuickEditFieldName, value: string) => void;
  dateSize?: number;
  timeSize?: number;
  timeLineHeight?: number;
  onDateSizeChange?: (value: number) => void;
  onTimeSizeChange?: (value: number) => void;
  onTimeLineHeightChange?: (value: number) => void;
  onFineTune: () => void;
  onFormatChange: (format: CocoQuickEditFormat) => void;
  onImproveCutout?: () => void;
  onOpenMasterGrade: () => void;
  onReplaceScene: () => void;
  onReplaceSubject: () => void;
  onReplaceLogo?: () => void;
  onResetPalette?: () => void;
  onSave: () => void;
  paletteColors: readonly string[];
  paletteLabel?: string;
  showImproveCutout?: boolean;
  statusMessage?: string | null;
};

type FieldDefinition = {
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  multiline?: boolean;
  name: CocoQuickEditFieldName;
  placeholder: string;
  rows?: number;
};

const MAIN_FIELDS: readonly FieldDefinition[] = [
  {
    name: "eventName",
    label: "Event name",
    placeholder: "Sunday Takeover",
    autoComplete: "off",
  },
  { name: "date", label: "Date", placeholder: "Sat.\nAug 30", multiline: true, rows: 2 },
  { name: "time", label: "Time", placeholder: "Doors open\n10 PM", multiline: true, rows: 2 },
  { name: "venue", label: "Venue", placeholder: "Venue name", autoComplete: "organization" },
  {
    name: "address",
    label: "Address",
    placeholder: "Full address",
    autoComplete: "street-address",
  },
  {
    name: "lineup",
    label: "DJs / lineup",
    placeholder: "One name per line",
    multiline: true,
    rows: 2,
  },
  {
    name: "details",
    label: "Event details",
    placeholder: "Dress code, parking, or other guest info",
    multiline: true,
    rows: 2,
  },
] as const;

const OPTIONAL_FIELDS: readonly FieldDefinition[] = [
  {
    name: "presenter",
    label: "Presenter / promoter",
    placeholder: "Presented by",
    autoComplete: "organization",
  },
  {
    name: "entry",
    label: "Entry",
    placeholder: "$20",
    inputMode: "text",
    autoComplete: "off",
  },
  {
    name: "age",
    label: "Age",
    placeholder: "21+",
    inputMode: "text",
    autoComplete: "off",
  },
  {
    name: "responsible",
    label: "Responsible drinking",
    placeholder: "Drink responsibly",
    inputMode: "text",
    autoComplete: "off",
  },
  {
    name: "social",
    label: "Social handle",
    placeholder: "@yourhandle",
    inputMode: "text",
    autoComplete: "off",
  },
  {
    name: "offer",
    label: "Offer / special",
    placeholder: "Bottle special, hookah deal, or promotion",
    multiline: true,
    rows: 2,
  },
  {
    name: "rsvpLabel",
    label: "Reservations label",
    placeholder: "For info & reservations:",
    autoComplete: "off",
  },
  {
    name: "rsvp",
    label: "RSVP / contact",
    placeholder: "Phone number, email, or booking link",
    autoComplete: "off",
  },
] as const;

const FIELD_TEST_IDS: Record<CocoQuickEditFieldName, string> = {
  eventName: "coco-quick-event-name",
  date: "coco-quick-date",
  time: "coco-quick-time",
  venue: "coco-quick-venue",
  address: "coco-quick-address",
  lineup: "coco-quick-lineup",
  details: "coco-quick-details",
  offer: "coco-quick-offer",
  rsvp: "coco-quick-rsvp",
  rsvpLabel: "coco-quick-rsvp-label",
  presenter: "coco-quick-presenter",
  entry: "coco-quick-entry",
  age: "coco-quick-age",
  responsible: "coco-quick-responsible",
  social: "coco-quick-social",
};

const fieldClassName =
  "min-h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-[16px] leading-5 text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-cyan-300/70 focus:bg-black/50 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm";

function QuickField({
  definition,
  disabled,
  onChange,
  onCommit,
  value,
}: {
  definition: FieldDefinition;
  disabled: boolean;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  value: string;
}) {
  const inputId = React.useId();
  const commonProps = {
    "aria-label": definition.label,
    className: fieldClassName,
    "data-testid": FIELD_TEST_IDS[definition.name],
    disabled,
    id: inputId,
    name: `coco-quick-${definition.name}`,
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onCommit?.(event.currentTarget.value),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.currentTarget.value),
    placeholder: definition.placeholder,
    value,
  };

  return (
    <label className="block min-w-0" htmlFor={inputId}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {definition.label}
      </span>
      {definition.multiline ? (
        <textarea
          {...commonProps}
          rows={definition.rows ?? 2}
          className={clsx(fieldClassName, "resize-none")}
        />
      ) : (
        <input
          {...commonProps}
          autoComplete={definition.autoComplete}
          inputMode={definition.inputMode}
          type="text"
        />
      )}
    </label>
  );
}

function QuickSizeSlider({
  label,
  onChange,
  testId,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  testId: string;
  value: number;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        <span>{label}</span>
        <span className="tabular-nums text-white/65">{Math.round(value)} px</span>
      </span>
      <input
        aria-label={label}
        className="h-3 w-full accent-cyan-300"
        data-testid={testId}
        min={5}
        max={160}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={1}
        type="range"
        value={value}
      />
    </label>
  );
}

function QuickLeadingSlider({
  label,
  onChange,
  testId,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  testId: string;
  value: number;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        <span>{label}</span>
        <span className="tabular-nums text-white/65">{value.toFixed(2)}</span>
      </span>
      <input
        aria-label={label}
        className="h-3 w-full accent-cyan-300"
        data-testid={testId}
        min={0.5}
        max={1.8}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={0.02}
        type="range"
        value={value}
      />
    </label>
  );
}

function ActionButton({
  busy,
  children,
  className,
  disabled,
  icon,
  onClick,
  testId,
}: {
  busy?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      aria-busy={busy || undefined}
      className={clsx(
        "inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-2.5 text-center text-[10px] font-semibold leading-4 text-white transition hover:border-white/20 hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-45 sm:gap-2 sm:px-3 sm:text-[11px]",
        className
      )}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span className="min-w-0 whitespace-normal">{children}</span>
    </button>
  );
}

export default function CocoQuickEdit({
  guide,
  styleScopeLabel,
  renderSizeControls,
  className,
  dateSize,
  disabled = false,
  disabledFields,
  disabledFormats,
  fieldLabels,
  eventBriefEditor,
  fields,
  format,
  formatTransitioning = false,
  isCyclingPalette = false,
  isExporting = false,
  isImprovingCutout = false,
  isReplacingScene = false,
  isReplacingSubject = false,
  canReplaceSubject = true,
  isReplacingLogo = false,
  isSaving = false,
  onCyclePalette,
  onExportBoth,
  onFieldChange,
  onFieldCommit,
  onDateSizeChange,
  onFineTune,
  onFormatChange,
  onImproveCutout,
  onOpenMasterGrade,
  canReplaceScene = true,
  onReplaceScene,
  onReplaceSubject,
  onReplaceLogo,
  onResetPalette,
  onSave,
  onTimeSizeChange,
  onTimeLineHeightChange,
  paletteColors,
  paletteLabel = "Try another color",
  showImproveCutout = false,
  statusMessage,
  timeSize,
  timeLineHeight,
}: CocoQuickEditProps) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const titleId = React.useId();
  const moreRegionId = React.useId();
  const optionalFields = OPTIONAL_FIELDS.filter(
    (definition) => fields[definition.name] !== undefined
  );
  const displayedPalette = paletteColors.filter(Boolean).slice(0, 5);
  const allActionsDisabled = disabled || formatTransitioning;

  const renderField = (definition: FieldDefinition) => (
    <div key={definition.name} className="min-w-0">
    <QuickField
      key={definition.name}
      definition={{
        ...definition,
        label: fieldLabels?.[definition.name] ?? definition.label,
      }}
      disabled={disabled || Boolean(disabledFields?.[definition.name])}
      value={String(fields[definition.name] ?? "")}
      onChange={(value) => onFieldChange(definition.name, value)}
      onCommit={
        onFieldCommit ? (value) => onFieldCommit(definition.name, value) : undefined
      }
    />
    {renderSizeControls?.(definition.name)}
    </div>
  );

  return (
    <section
      aria-labelledby={titleId}
      className={clsx(
        "panel flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-950/90 text-white shadow-[0_22px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:max-h-[calc(100vh-120px)]",
        className
      )}
      data-testid="coco-quick-edit"
    >
      <div className="relative shrink-0 overflow-hidden border-b border-white/10 px-4 pb-4 pt-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/75">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Coco Quick Edit
            </div>
            <h2 id={titleId} className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-white">
              Your flyer is ready.
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-white/45">
              Edit your details, move text on the canvas, or download both formats.
            </p>
          </div>
          <button
            type="button"
            aria-label="Edit on canvas"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/75 transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-45"
            data-testid="coco-quick-fine-tune"
            disabled={disabled}
            onClick={onFineTune}
          >
            <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
            Edit on canvas
          </button>
        </div>

        <div
          aria-label="Campaign format"
          className="relative mt-4 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/30 p-1"
          role="group"
        >
          {(["square", "story"] as const).map((candidate) => {
            const active = format === candidate;
            const label = candidate === "square" ? "Square" : "Story";
            return (
              <button
                key={candidate}
                type="button"
                aria-label={`Edit ${label} format`}
                aria-pressed={active}
                className={clsx(
                  "min-h-10 rounded-md px-3 text-[11px] font-bold uppercase tracking-[0.13em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-40",
                  active
                    ? "bg-white text-black shadow-[0_8px_22px_rgba(0,0,0,0.22)]"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                )}
                data-testid={`coco-quick-format-${candidate}`}
                disabled={
                  disabled ||
                  formatTransitioning ||
                  Boolean(disabledFormats?.[candidate])
                }
                onClick={() => onFormatChange(candidate)}
              >
                {formatTransitioning && !active ? "Switching..." : label}
              </button>
            );
          })}
        </div>

        <div
          className="relative mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2"
          data-testid="coco-quick-project-actions"
        >
          <ActionButton
            busy={isSaving}
            disabled={allActionsDisabled || isSaving || isExporting}
            icon={<Save aria-hidden="true" className="h-4 w-4 shrink-0" />}
            onClick={onSave}
            testId="coco-quick-save"
          >
            {isSaving ? "Saving..." : "Save project"}
          </ActionButton>
          <ActionButton
            disabled={allActionsDisabled || isSaving || isExporting}
            icon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4 shrink-0 text-fuchsia-200" />}
            onClick={onOpenMasterGrade}
            testId="coco-quick-master-grade"
          >
            Finish & effects
          </ActionButton>
          <ActionButton
            busy={isExporting}
            className="col-span-2 border-cyan-200/50 bg-cyan-200 text-black hover:border-white hover:bg-white"
            disabled={allActionsDisabled || isSaving || isExporting}
            icon={<Download aria-hidden="true" className="h-4 w-4 shrink-0" />}
            onClick={onExportBoth}
            testId="coco-quick-export-both"
          >
            {isExporting ? "Downloading..." : "Download Square + Story"}
          </ActionButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {guide}
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                Event copy
              </div>
              <div className="mt-1 text-xs text-white/55">Edit only what guests need.</div>
            </div>
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-200/65">
              Live preview
            </span>
          </div>

          <div className="space-y-3">
            {renderSizeControls && <p className="text-xs leading-5 text-cyan-100/75">{styleScopeLabel ?? `Text sizes apply to ${format === 'square' ? 'Square' : 'Story'} only. Switch formats to adjust the other version.`}</p>}
            {renderField(MAIN_FIELDS[0])}
            {eventBriefEditor ?? <>
            <div className="grid grid-cols-2 gap-2">
              {renderField(MAIN_FIELDS[1])}
              {renderField(MAIN_FIELDS[2])}
            </div>
            {(dateSize != null && onDateSizeChange) || (timeSize != null && onTimeSizeChange) ? (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-2.5">
                {dateSize != null && onDateSizeChange ? (
                  <QuickSizeSlider
                    label="Date size"
                    onChange={onDateSizeChange}
                    testId="coco-quick-date-size"
                    value={dateSize}
                  />
                ) : <span />}
                {timeSize != null && onTimeSizeChange ? (
                  <QuickSizeSlider
                    label="Time size"
                    onChange={onTimeSizeChange}
                    testId="coco-quick-time-size"
                    value={timeSize}
                  />
                ) : null}
              </div>
            ) : null}
            {timeLineHeight != null && onTimeLineHeightChange ? (
              <div className="rounded-lg border border-white/[0.07] bg-black/20 p-2.5">
                <QuickLeadingSlider
                  label="Time leading"
                  onChange={onTimeLineHeightChange}
                  testId="coco-quick-time-leading"
                  value={timeLineHeight}
                />
              </div>
            ) : null}
            {renderField(MAIN_FIELDS[3])}
            {renderField(MAIN_FIELDS[4])}
            {renderField(MAIN_FIELDS[5])}
            {renderField(MAIN_FIELDS[6])}
            </>}
          </div>

          {!eventBriefEditor && optionalFields.length > 0 ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                type="button"
                aria-controls={moreRegionId}
                aria-expanded={moreOpen}
                className="flex min-h-10 w-full items-center justify-between rounded-lg px-1 text-left text-[11px] font-semibold text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                data-testid="coco-quick-more-toggle"
                disabled={disabled}
                onClick={() => setMoreOpen((current) => !current)}
              >
                <span>More event details</span>
                <ChevronDown
                  aria-hidden="true"
                  className={clsx("h-4 w-4 transition-transform", moreOpen && "rotate-180")}
                />
              </button>
              {moreOpen ? (
                <div
                  id={moreRegionId}
                  className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3"
                  data-testid="coco-quick-more-fields"
                >
                  {optionalFields.map((definition) => (
                    <div
                      key={definition.name}
                      className={clsx(
                        "min-w-0",
                        definition.name === "presenter" ||
                        definition.name === "social" ||
                        definition.name === "offer" ||
                        definition.name === "rsvpLabel" ||
                        definition.name === "rsvp"
                          ? "col-span-2"
                          : "col-span-1"
                      )}
                    >
                      {renderField(definition)}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Palette aria-hidden="true" className="h-4 w-4 shrink-0 text-fuchsia-200/80" />
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  Campaign color
                </div>
                <div className="mt-1 truncate text-xs text-white/55">Square + Story stay matched.</div>
              </div>
            </div>
            <div
              aria-label="Current campaign colors"
              className="flex h-7 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/30"
              role="img"
            >
              {displayedPalette.length > 0 ? (
                displayedPalette.map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    aria-hidden="true"
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))
              ) : (
                <span className="h-full w-full bg-[linear-gradient(90deg,#111827,#22d3ee,#f0abfc)]" />
              )}
            </div>
          </div>
          <div className={clsx("mt-3 grid gap-2", onResetPalette ? "grid-cols-[1fr_auto]" : "grid-cols-1")}>
            <ActionButton
              busy={isCyclingPalette}
              className="border-fuchsia-300/25 bg-fuchsia-300/[0.08] text-fuchsia-50 hover:border-fuchsia-200/45 hover:bg-fuchsia-300/[0.13]"
              disabled={allActionsDisabled || isCyclingPalette}
              icon={
                <RefreshCw
                  aria-hidden="true"
                  className={clsx("h-4 w-4 shrink-0", isCyclingPalette && "animate-spin")}
                />
              }
              onClick={onCyclePalette}
              testId="coco-quick-cycle-palette"
            >
              {isCyclingPalette ? "Finding color..." : paletteLabel}
            </ActionButton>
            {onResetPalette ? (
              <button
                type="button"
                aria-label="Reset campaign colors"
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-45"
                data-testid="coco-quick-reset-palette"
                disabled={allActionsDisabled || isCyclingPalette}
                onClick={onResetPalette}
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            Images
          </div>
          <div className={clsx("grid gap-2", onReplaceLogo ? "grid-cols-3" : "grid-cols-2")}>
            <ActionButton
              busy={isReplacingScene}
              disabled={!canReplaceScene || allActionsDisabled || isReplacingScene || isReplacingSubject || isImprovingCutout}
              icon={<ImagePlus aria-hidden="true" className="h-4 w-4 shrink-0 text-cyan-200" />}
              onClick={onReplaceScene}
              testId="coco-quick-replace-scene"
            >
              {isReplacingScene ? "Replacing..." : "Replace scene"}
            </ActionButton>
            <ActionButton
              busy={isReplacingSubject}
              disabled={!canReplaceSubject || allActionsDisabled || isReplacingScene || isReplacingSubject || isImprovingCutout}
              icon={<UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-cyan-200" />}
              onClick={onReplaceSubject}
              testId="coco-quick-replace-subject"
            >
              {isReplacingSubject ? "Preparing..." : "Replace portrait"}
            </ActionButton>
            {onReplaceLogo ? (
              <ActionButton
                busy={isReplacingLogo}
                disabled={allActionsDisabled || isReplacingScene || isReplacingSubject || isReplacingLogo || isImprovingCutout}
                icon={<ImagePlus aria-hidden="true" className="h-4 w-4 shrink-0 text-lime-200" />}
                onClick={onReplaceLogo}
                testId="coco-quick-replace-logo"
              >
                {isReplacingLogo ? "Replacing..." : "Replace logo"}
              </ActionButton>
            ) : null}
          </div>
          {!canReplaceSubject && <p className="mt-2 text-[11px] text-white/45">This design has no separate portrait to replace.</p>}
          {showImproveCutout && onImproveCutout ? (
            <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.07] p-3">
              <p className="text-[11px] leading-5 text-amber-100/80">
                Your photo is being used. The cutout edges may need cleanup.
              </p>
              <ActionButton
                busy={isImprovingCutout}
                className="mt-2 border-amber-200/30 bg-amber-200/[0.1] text-amber-50 hover:bg-amber-100/15"
                disabled={allActionsDisabled || isReplacingScene || isReplacingSubject || isImprovingCutout}
                icon={<Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-200" />}
                onClick={onImproveCutout}
                testId="coco-improve-cutout"
              >
                {isImprovingCutout ? "Cleaning edges..." : "Improve cutout"}
              </ActionButton>
              <span className="sr-only" data-testid="coco-quick-improve-cutout">
                Improve cutout
              </span>
            </div>
          ) : null}
        </div>

        {statusMessage ? (
          <div
            aria-live="polite"
            className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.055] px-3 py-2 text-[11px] leading-5 text-cyan-50/70"
            data-testid="coco-quick-status"
            role="status"
          >
            {statusMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
}
