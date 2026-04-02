"use client";

type PaymentMarksProps = {
  showPowerTranz?: boolean;
  compact?: boolean;
};

function VisaMark() {
  return (
    <div className="flex h-11 min-w-[110px] items-center justify-center border border-white/12 bg-white px-4 text-[#1a4fb3]">
      <span className="text-[28px] font-black italic tracking-tight">VISA</span>
    </div>
  );
}

function MastercardMark() {
  return (
    <div className="relative flex h-11 min-w-[150px] items-center justify-center border border-white/12 bg-white px-4 text-[#1b2b7f]">
      <div className="absolute left-[28px] h-7 w-7 rounded-full bg-[#e40000]" />
      <div className="absolute left-[46px] h-7 w-7 rounded-full bg-[#ff9f1a] opacity-95" />
      <span className="relative z-10 text-[17px] font-black italic tracking-tight">Mastercard</span>
    </div>
  );
}

function PowerTranzMark() {
  return (
    <div className="flex h-11 min-w-[170px] items-center justify-center border border-cyan-400/30 bg-cyan-500/10 px-4 text-cyan-100">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
        Powered by
      </span>
      <span className="ml-2 text-sm font-semibold tracking-[0.08em]">PowerTranz</span>
    </div>
  );
}

export default function PaymentMarks({
  showPowerTranz = false,
  compact = false,
}: PaymentMarksProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      <VisaMark />
      <MastercardMark />
      {showPowerTranz ? <PowerTranzMark /> : null}
    </div>
  );
}
