"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BellRing,
  Check,
  Scale,
  Split,
  Users,
} from "lucide-react";
import type { AppState } from "@/lib/data";
import { cx, firstName, money } from "@/lib/money";
import { Avatar, Card, CountUp, Pill, SectionHead } from "./kit";

/* ------------------------------- Circle hero ------------------------------ */

export function CircleHero({
  state,
  onNewSplit,
}: {
  state: AppState;
  onNewSplit: () => void;
}) {
  const c = state.stats.circle;
  const positive = c.net >= 0;

  return (
    <Card className="relative">
      <div
        className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #C5A0FF55, transparent 70%)" }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Pill color="#C5A0FF">
            <span className="pulse-dot size-1.5 rounded-full bg-lilac" />
            Circle balance · separate from family
          </Pill>
          <span className="text-[11px] text-white/35">{state.friends.length} friends</span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] text-white/35 uppercase">
              {positive ? "You are up overall" : "You are down overall"}
            </p>
            <CountUp
              to={Math.abs(c.net) / 100}
              format={(n) =>
                `${positive ? "+" : "−"}${n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })}`
              }
              className="font-display text-[52px] leading-none font-light tracking-tight sm:text-[62px]"
            />
            <p className="mt-2 text-sm text-white/45">
              <span className="text-sprout">{money(c.owedToMe, { exact: true })}</span> coming in ·{" "}
              <span className="text-coral">{money(c.iOwe, { exact: true })}</span> going out
            </p>
          </div>

          <button
            onClick={onNewSplit}
            className="flex items-center gap-2 rounded-2xl bg-lilac px-4 py-2.5 text-sm font-semibold text-[#160a2e] shadow-[0_8px_30px_-8px_rgba(197,160,255,0.6)] transition hover:brightness-110 active:scale-[0.97]"
          >
            <Split className="size-4" /> Split a bill
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 divide-x divide-white/6 rounded-2xl border border-white/6 bg-sunk/60">
          {[
            { label: "Owed to you", value: money(c.owedToMe), tone: "#C9F158", note: "waiting to land" },
            { label: "You owe", value: money(c.iOwe), tone: "#FF8A6B", note: "settle up soon" },
            { label: "Settled", value: money(c.settledVolume), tone: "#8CE8C7", note: `${c.openSplits} splits still open` },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3.5 sm:px-5">
              <p className="text-[10px] font-medium tracking-[0.13em] text-white/35 uppercase">{s.label}</p>
              <p className="mt-1 text-lg font-semibold tnum sm:text-xl">{s.value}</p>
              <p className="mt-0.5 text-[11px]" style={{ color: s.tone }}>{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Friend ledger ----------------------------- */

export function FriendLedger({
  state,
  onNudgeFriend,
}: {
  state: AppState;
  onNudgeFriend: (friendId: number) => void;
}) {
  const rows = state.friends
    .map((f) => ({ friend: f, ...(state.friendLedger[f.id] ?? { owesMe: 0, iOwe: 0, net: 0 }) }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return (
    <Card>
      <SectionHead
        icon={<Scale className="size-3.5" />}
        title="Who owes who"
        tone="#8CE8C7"
        right={<span className="text-[11px] text-white/35">net per friend</span>}
      />
      <div className="space-y-1.5">
        {rows.map(({ friend, owesMe, iOwe, net }) => {
          const settled = net === 0;
          const tone = settled ? "#8CE8C7" : net > 0 ? "#C9F158" : "#FF8A6B";
          return (
            <motion.div
              key={friend.id}
              layout
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-sunk/60 p-3"
            >
              <Avatar name={friend.name} initials={friend.initials} color={friend.color} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white/90">
                  {firstName(friend.name)}
                </p>
                <p className="truncate text-[11px] text-white/35">
                  {settled
                    ? "square with you"
                    : net > 0
                      ? `owes you ${money(owesMe, { exact: true })}`
                      : `you owe ${money(iOwe, { exact: true })}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm font-bold tnum" style={{ color: tone }}>
                  {settled ? (
                    <><Check className="size-3.5" /> even</>
                  ) : net > 0 ? (
                    <><ArrowDownLeft className="size-3.5" />{money(Math.abs(net))}</>
                  ) : (
                    <><ArrowUpRight className="size-3.5" />{money(Math.abs(net))}</>
                  )}
                </span>
                {net > 0 && (
                  <button
                    onClick={() => onNudgeFriend(friend.id)}
                    className="grid size-7 place-items-center rounded-lg border border-lilac/30 bg-lilac/10 text-lilac transition hover:bg-lilac/20"
                    title={`Nudge ${firstName(friend.name)}`}
                  >
                    <BellRing className="size-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

/* --------------------------- Circle spend rhythm -------------------------- */

export function CircleSpendStrip({ state }: { state: AppState }) {
  const days: { label: string; inAmt: number; outAmt: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dayTxns = state.txns.filter(
      (t) =>
        (t.kind === "split_in" || t.kind === "split_out") &&
        new Date(t.createdAt).toDateString() === key,
    );
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      inAmt: dayTxns.filter((t) => t.amountCents > 0).reduce((a, t) => a + t.amountCents, 0),
      outAmt: dayTxns.filter((t) => t.amountCents < 0).reduce((a, t) => a - t.amountCents, 0),
    });
  }
  const max = Math.max(...days.map((d) => Math.max(d.inAmt, d.outAmt)), 100);

  return (
    <Card>
      <SectionHead
        icon={<Users className="size-3.5" />}
        title="Circle flow · 7 days"
        tone="#C5A0FF"
        right={
          <span className="flex items-center gap-2 text-[10px] text-white/35">
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-sprout" /> in</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-coral" /> out</span>
          </span>
        }
      />
      <div className="flex h-24 items-end gap-2.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-[70px] w-full items-end justify-center gap-1">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.35 + i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="w-1/2 origin-bottom rounded-full bg-sprout"
                style={{ height: Math.max(3, (d.inAmt / max) * 64) }}
              />
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="w-1/2 origin-bottom rounded-full bg-coral/70"
                style={{ height: Math.max(3, (d.outAmt / max) * 64) }}
              />
            </div>
            <span className={cx("text-[10px] font-medium uppercase", i === 6 ? "text-lilac" : "text-white/30")}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
