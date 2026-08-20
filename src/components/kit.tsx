"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { cx } from "@/lib/money";

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({
  name,
  initials,
  color,
  size = 40,
  ring = false,
  className,
}: {
  name: string;
  initials: string;
  color: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  return (
    <div
      title={name}
      className={cx("relative grid shrink-0 place-items-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color,
        background: `linear-gradient(145deg, ${color}26, ${color}0a 70%)`,
        boxShadow: `inset 0 0 0 1.5px ${color}59${ring ? `, 0 0 0 3px #07090c, 0 0 0 4.5px ${color}66` : ""}`,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

/* ------------------------------- ProgressRing ------------------------------ */

export function ProgressRing({
  value,
  size = 64,
  stroke = 5,
  color = "#C9F158",
  track = "rgba(255,255,255,0.08)",
  children,
  className,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cx("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* --------------------------------- CountUp -------------------------------- */

export function CountUp({
  to,
  format = (n: number) => Math.round(n).toString(),
  className,
  duration = 0.9,
}: {
  to: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const [val, setVal] = useState(to);
  const prev = useRef(to);
  useEffect(() => {
    const controls = animate(prev.current, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    prev.current = to;
    return () => controls.stop();
  }, [to, duration]);
  return <span className={cx("tnum inline-block", className)}>{format(val)}</span>;
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cx(
        "relative overflow-hidden rounded-3xl border border-line bg-raised/80 backdrop-blur-sm",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_24px_60px_-32px_rgba(0,0,0,0.9)]",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}

/* ------------------------------- SectionHead ------------------------------- */

export function SectionHead({
  icon,
  title,
  right,
  tone = "#C9F158",
}: {
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span
            className="grid size-7 place-items-center rounded-lg"
            style={{ color: tone, background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}2e` }}
          >
            {icon}
          </span>
        )}
        <h2 className="text-[13px] font-semibold tracking-[0.14em] text-white/60 uppercase">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ----------------------------------- Pill ---------------------------------- */

export function Pill({
  color,
  children,
  className,
}: {
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
        className,
      )}
      style={{ color, background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}30` }}
    >
      {children}
    </span>
  );
}
