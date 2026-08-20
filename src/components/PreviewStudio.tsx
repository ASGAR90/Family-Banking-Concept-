"use client";

import WidgetApp from "./WidgetApp";

export default function PreviewStudio() {
  return (
    <div className="studio">
      <header className="studio-head">
        <div>
          <p className="font-display text-[22px] italic leading-none text-white">sprout</p>
          <p className="mt-1 text-[11px] tracking-[0.18em] text-white/35 uppercase">Mobile preview</p>
        </div>
        <p className="max-w-sm text-right text-[12px] leading-relaxed text-white/40">
          Family vault, kid world, circle splits. Scroll sideways — each phone is live.
        </p>
      </header>
      <div className="studio-row">
        <div className="studio-track">
          <WidgetApp start="family" embedded instanceId="family" />
          <WidgetApp start="kid" embedded instanceId="kid" />
          <WidgetApp start="circle" embedded instanceId="circle" />
        </div>
      </div>
    </div>
  );
}
