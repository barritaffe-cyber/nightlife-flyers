"use client";

import Image from "next/image";

type PaymentMarksProps = {
  showPowerTranz?: boolean;
  compact?: boolean;
};

function VisaSecureMark({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex items-center justify-center border border-white/12 bg-[#1f237e] p-2 ${
        compact ? "h-12 min-w-[108px]" : "h-14 min-w-[124px]"
      }`}
    >
      <div className="flex h-full w-full flex-col overflow-hidden border border-white/80 bg-white">
        <div className="flex flex-1 items-center justify-center bg-white px-2">
          <span className={`${compact ? "text-[18px]" : "text-[21px]"} font-black italic tracking-tight text-[#2232a4]`}>
            VISA
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center bg-[#1f237e] px-2">
          <span className={`${compact ? "text-[12px]" : "text-[14px]"} font-semibold uppercase tracking-[0.12em] text-white`}>
            Secure
          </span>
        </div>
      </div>
    </div>
  );
}

function MastercardIdCheckMark({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 border border-white/12 bg-white px-3 text-black ${
        compact ? "h-12 min-w-[146px]" : "h-14 min-w-[174px]"
      }`}
    >
      <div className="relative h-7 w-11 shrink-0">
        <div className="absolute left-0 top-0 h-7 w-7 rounded-full bg-[#ea001b]" />
        <div className="absolute right-0 top-0 h-7 w-7 rounded-full bg-[#f79e1b] opacity-95" />
      </div>
      <div className="h-7 w-px bg-black/20" />
      <div className="flex items-center">
        <span className={`${compact ? "text-[16px]" : "text-[18px]"} font-medium tracking-tight text-black/90`}>
          ID Check
        </span>
      </div>
    </div>
  );
}

function PowerTranzMark({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex items-center overflow-hidden border border-white/12 bg-white ${
        compact ? "h-12 min-w-[210px] px-2" : "h-14 min-w-[256px] px-3"
      }`}
    >
      <Image
        src="/payment-marks/powered-by-powertranz.jpg"
        alt="Powered by PowerTranz"
        width={540}
        height={159}
        className="h-full w-auto object-contain"
      />
    </div>
  );
}

export default function PaymentMarks({ showPowerTranz = false, compact = false }: PaymentMarksProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      <VisaSecureMark compact={compact} />
      <MastercardIdCheckMark compact={compact} />
      {showPowerTranz ? <PowerTranzMark compact={compact} /> : null}
    </div>
  );
}
