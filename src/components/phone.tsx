"use client";

import { useEffect, useState, type ReactNode } from "react";

export function PhoneShell({
  accent,
  children,
  overlay,
  embedded = false,
  label,
}: {
  accent: string;
  children: ReactNode;
  overlay?: ReactNode;
  embedded?: boolean;
  label?: string;
}) {
  const phone = (
    <div className="phone">
      <span className="phone-btn phone-btn-r" />
      <span className="phone-btn phone-btn-l1" />
      <span className="phone-btn phone-btn-l2" />
      <div className="phone-bezel">
        <div className="phone-screen grain">
          <div className="island" />
          <StatusBar />
          {children}
          <div className="home-bar" />
          {overlay}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="studio-slot">
        {label && (
          <p className="studio-label">
            <i style={{ background: accent }} />
            {label}
          </p>
        )}
        {phone}
      </div>
    );
  }

  return (
    <div className="app-stage">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${accent}22, transparent 42%),
            radial-gradient(ellipse at 80% 100%, #c5a0ff14, transparent 40%)
          `,
        }}
      />
      {phone}
      <p className="phone-caption">
        <em>sprout</em>
        <span>Family vault and friend splits never share a ledger.</span>
      </p>
    </div>
  );
}

function StatusBar() {
  const [clock, setClock] = useState("9:41");

  useEffect(() => {
    const tick = () => {
      const raw = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setClock(raw.replace(/ [AP]M/, ""));
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="status-bar">
      <span className="w-[72px] text-[15px] font-semibold tracking-tight">{clock}</span>
      <span className="flex w-[72px] items-center justify-end gap-[5px] text-white">
        <Signal />
        <Wifi />
        <Battery />
      </span>
    </div>
  );
}

function Signal() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="5" rx="0.6" opacity="0.35" />
      <rect x="4.5" y="5" width="3" height="7" rx="0.6" opacity="0.55" />
      <rect x="9" y="2.5" width="3" height="9.5" rx="0.6" opacity="0.8" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.6" />
    </svg>
  );
}

function Wifi() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
      <path
        d="M1.2 4.2C4.6 1.3 11.4 1.3 14.8 4.2M3.4 6.5c2.4-2 6.8-2 9.2 0M6.1 8.8c1.1-.9 2.7-.9 3.8 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11" r="1.05" fill="currentColor" />
    </svg>
  );
}

function Battery() {
  return (
    <svg width="27" height="12" viewBox="0 0 27 12" aria-hidden>
      <rect x="0.6" y="0.6" width="22" height="10.8" rx="2.4" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" fill="none" />
      <rect x="2.1" y="2.1" width="16.4" height="7.8" rx="1.3" fill="currentColor" />
      <path d="M24.2 4v4c1.1-.5 1.1-3.5 0-4Z" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
