"use client";

import { motion } from "framer-motion";
import { Check, Flame, HandCoins } from "lucide-react";
import type { AppState } from "@/lib/data";
import { money } from "@/lib/money";
import { Avatar } from "./kit";

type Member = AppState["kids"][number];

const POS = (angleDeg: number, rPct: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: `${50 + rPct * Math.cos(rad)}%`,
    top: `${50 + rPct * Math.sin(rad)}%`,
  };
};

function OrbitNode({
  member,
  angle,
  rPct,
  counterClass,
  size,
  badge,
  hint,
  onClick,
  delay = 0,
}: {
  member: Member;
  angle: number;
  rPct: number;
  counterClass: string;
  size: number;
  badge?: React.ReactNode;
  hint: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute z-10"
      style={POS(angle, rPct)}
      initial={{ opacity: 0, scale: 0.4, x: "-50%", y: "-50%" }}
      animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={counterClass}>
        <button
          onClick={onClick}
          className="group relative block cursor-pointer rounded-full transition-transform duration-300 ease-out hover:scale-110"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40"
            style={{ background: member.color }}
          />
          <Avatar
            name={member.name}
            initials={member.initials}
            color={member.color}
            size={size}
            className="relative"
          />
          {badge}
          <span
            className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-full border border-white/10 bg-[#14171d]/95 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-white/80 opacity-0 shadow-xl backdrop-blur transition-all duration-200 group-hover:mt-3 group-hover:opacity-100"
          >
            {member.name.split(" ")[0]} · {hint}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

export function Orbit({
  me,
  kids,
  friends,
  dueByMember,
  openTasksByKid,
  onSelect,
  scope = "family",
}: {
  me: AppState["me"];
  kids: Member[];
  friends: Member[];
  dueByMember: Record<number, number>;
  openTasksByKid: Record<number, number>;
  onSelect: (m: Member) => void;
  /** which ring to render — the two ledgers never share an orbit */
  scope?: "family" | "circle";
}) {
  const isFamily = scope === "family";
  const ring = isFamily ? kids : friends;
  const ringR = isFamily ? 33 : 36;
  const accent = isFamily ? "rgba(201,241,88," : "rgba(197,160,255,";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px] select-none">
      {/* ambient glow */}
      <div
        className="absolute inset-[18%] rounded-full opacity-60 blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${accent}0.10), transparent 65%)`,
        }}
      />

      {/* dashed rings */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r={ringR + 9} className="ring-dash-soft" strokeWidth="0.3" />
        <circle cx="50" cy="50" r={ringR} className="ring-dash" strokeWidth="0.35" />
        <circle cx="50" cy="50" r="17.5" className="ring-dash-soft" strokeWidth="0.4" />
      </svg>

      {/* the one ring that matters for this tab */}
      <div className={isFamily ? "spin-slow absolute inset-0" : "spin-slow-rev absolute inset-0"}>
        {ring.map((m, i) => {
          const angle = -90 + (i * 360) / Math.max(1, ring.length);
          const open = openTasksByKid[m.id] ?? 0;
          const due = dueByMember[m.id] ?? 0;
          return (
            <OrbitNode
              key={m.id}
              member={m}
              angle={angle}
              rPct={ringR}
              counterClass={isFamily ? "spin-slow-rev" : "spin-slow"}
              size={isFamily ? 58 : 50}
              delay={0.15 + i * 0.11}
              hint={
                isFamily
                  ? `${money(m.balanceCents)} to spend`
                  : due > 0
                    ? `owes you ${money(due)}`
                    : "all settled up"
              }
              onClick={() => onSelect(m)}
              badge={
                isFamily ? (
                  open > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full border border-[#07090c] bg-gold font-bold text-[10px] text-[#1d1503]">
                      {open}
                    </span>
                  ) : (
                    <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full border border-[#07090c] bg-[#1a1410] text-gold">
                      <Flame className="size-3" />
                    </span>
                  )
                ) : due > 0 ? (
                  <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border border-[#07090c] bg-coral px-1 py-px text-[9px] font-bold text-[#250b05]">
                    {money(due)}
                  </span>
                ) : (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full border border-[#07090c] bg-mint text-[#052117]">
                    <Check className="size-2.5" strokeWidth={4} />
                  </span>
                )
              }
            />
          );
        })}
      </div>

      {/* center: the parent */}
      <motion.div
        className="absolute left-1/2 top-1/2 z-20"
        initial={{ opacity: 0, scale: 0.6, x: "-50%", y: "-50%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative grid place-items-center">
          <span
            className="absolute size-28 rounded-full border"
            style={{ borderColor: `${accent}0.22)` }}
          />
          <span
            className="pulse-dot absolute size-28 rounded-full blur-md"
            style={{ background: `${accent}0.10)` }}
          />
          <Avatar
            name={me.name}
            initials={me.initials}
            color={isFamily ? "#C9F158" : "#C5A0FF"}
            size={76}
          />
          <span className="absolute -bottom-2 grid translate-y-full place-items-center gap-0.5">
            <span
              className="rounded-full border border-white/10 bg-[#14171d] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: isFamily ? "#C9F158" : "#C5A0FF" }}
            >
              {me.name.split(" ")[0]} · You
            </span>
            <span className="mt-1 flex items-center gap-1 text-[10px] text-white/35">
              <HandCoins className="size-3" />
              {isFamily ? `${ring.length} kids in your care` : `${ring.length} in your circle`}
            </span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
