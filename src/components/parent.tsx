"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  BookOpen,
  Check,
  CheckCheck,
  Flame,
  HandCoins,
  PiggyBank,
  Plus,
  Receipt,
  RotateCcw,
  Sparkles,
  Split,
  Target,
  Wallet,
  X,
} from "lucide-react";
import type { AppState } from "@/lib/data";
import { cx, firstName, money, timeAgo, txnScope } from "@/lib/money";
import { Avatar, Card, CountUp, Pill, ProgressRing, SectionHead } from "./kit";

type Task = AppState["tasks"][number];
type Kid = AppState["kids"][number];
type SplitT = AppState["splits"][number];

/* ------------------------------ Balance hero ------------------------------ */

export function BalanceHero({
  state,
  onAddTask,
  onJumpApprovals,
}: {
  state: AppState;
  onAddTask: () => void;
  onJumpApprovals: () => void;
}) {
  const stats = state.stats.family;
  const familyTotal = stats.total;
  return (
    <Card className="relative">
      <div
        className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #C9F15855, transparent 70%)" }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Pill color="#C9F158">
            <span className="pulse-dot size-1.5 rounded-full bg-sprout" />
            Family balance · live
          </Pill>
          <span className="text-[11px] text-white/35">across {state.kids.length} kid accounts</span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div>
            <CountUp
              to={familyTotal / 100}
              format={(n) =>
                n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
              }
              className="font-display text-[52px] leading-none font-light tracking-tight text-white sm:text-[62px]"
            />
            <p className="mt-2 text-sm text-white/45">
              <span className="text-gold">{money(stats.kidsBalance, { exact: true })}</span> spendable ·{" "}
              <span className="text-mint">{money(stats.savedTotal, { exact: true })}</span> tucked in goals
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onJumpApprovals}
              className="group flex items-center gap-2 rounded-2xl border border-gold/25 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/15"
            >
              <CheckCheck className="size-4" />
              {stats.pendingApprovals > 0 ? (
                <>
                  <span className="tnum">{stats.pendingApprovals}</span> awaiting approval
                </>
              ) : (
                "Inbox zero"
              )}
            </button>
            <button
              onClick={onAddTask}
              className="flex items-center gap-2 rounded-2xl bg-sprout px-4 py-2.5 text-sm font-semibold text-[#121703] shadow-[0_8px_30px_-8px_rgba(201,241,88,0.6)] transition hover:brightness-110 active:scale-[0.97]"
            >
              <Plus className="size-4" /> New task
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 divide-x divide-white/6 rounded-2xl border border-white/6 bg-sunk/60">
          {[
            { label: "Earned this week", value: stats.earnedThisWeek, tone: "#C9F158", note: "chores + lessons" },
            { label: "Locked in goals", value: stats.savedTotal, tone: "#8CE8C7", note: `${Math.round((stats.savedTotal / Math.max(1, stats.goalsTotal)) * 100)}% of ${money(stats.goalsTotal)}` },
            { label: "Free to spend", value: stats.kidsBalance, tone: "#FFC357", note: `${stats.openTasks} tasks live · ${stats.lessonsDone} lessons done` },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3.5 sm:px-5">
              <p className="text-[10px] font-medium tracking-[0.13em] text-white/35 uppercase">{s.label}</p>
              <CountUp
                to={s.value / 100}
                format={(n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                className="mt-1 block text-lg font-semibold sm:text-xl"
              />
              <p className="mt-0.5 text-[11px]" style={{ color: s.tone }}>{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------- Week strip ------------------------------- */

export function WeekStrip({ state }: { state: AppState }) {
  const days: { label: string; amount: number }[] = [];
  const kidIds = new Set(state.kids.map((k) => k.id));
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const amount = state.txns
      .filter(
        (t) =>
          kidIds.has(t.memberId) &&
          (t.kind === "task_pay" || t.kind === "lesson_reward") &&
          new Date(t.createdAt).toDateString() === key,
      )
      .reduce((a, t) => a + t.amountCents, 0);
    days.push({ label: d.toLocaleDateString("en-US", { weekday: "narrow" }), amount });
  }
  const max = Math.max(...days.map((d) => d.amount), 100);

  return (
    <Card>
      <SectionHead icon={<Sparkles className="size-3.5" />} title="Kids' earnings · 7 days" tone="#FFC357" />
      <div className="flex h-24 items-end gap-2.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-[10px] text-white/40 tnum">
              {d.amount > 0 ? money(d.amount) : ""}
            </span>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={cx(
                "w-full origin-bottom rounded-full",
                i === 6 ? "bg-sprout" : "bg-white/12",
              )}
              style={{ height: 4 + (d.amount / max) * 62 }}
            />
            <span className={cx("text-[10px] font-medium uppercase", i === 6 ? "text-sprout" : "text-white/30")}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* -------------------------------- Kid card -------------------------------- */

export function KidCard({
  kid,
  tasks,
  goal,
  onViewKid,
  onAddTask,
}: {
  kid: Kid;
  tasks: Task[];
  goal?: AppState["goals"][number];
  onViewKid: () => void;
  onAddTask: () => void;
}) {
  const open = tasks.filter((t) => t.status === "open" || t.status === "declined").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const goalPct = goal ? goal.savedCents / goal.targetCents : 0;

  return (
    <motion.div
      layout
      className="group relative overflow-hidden rounded-3xl border border-line bg-raised/80 p-5"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-15 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: kid.color }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={kid.name} initials={kid.initials} color={kid.color} size={46} />
          <div>
            <p className="font-semibold text-white">{kid.name.split(" ")[0]}</p>
            <p className="text-[11px] text-white/40">{kid.tagline}</p>
          </div>
        </div>
        <Pill color="#FFC357">
          <Flame className="size-3" /> {kid.streakDays} day streak
        </Pill>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] text-white/35 uppercase">Spendable</p>
          <CountUp
            to={kid.balanceCents / 100}
            format={(n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            className="font-display text-4xl font-light text-white"
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <Pill color={kid.color}>{open} open tasks</Pill>
            {pending > 0 && <Pill color="#FF8A6B">{pending} to review</Pill>}
          </div>
        </div>

        {goal && (
          <button onClick={onViewKid} className="group/ring flex flex-col items-center gap-1.5">
            <ProgressRing value={goalPct} size={62} stroke={5} color={kid.color}>
              <span className="text-[11px] font-bold text-white tnum">{Math.round(goalPct * 100)}%</span>
            </ProgressRing>
            <span className="max-w-[88px] truncate text-center text-[10px] text-white/40 transition group-hover/ring:text-white/70">
              {goal.title}
            </span>
          </button>
        )}
      </div>

      <div className="relative mt-5 flex gap-2">
        <button
          onClick={onViewKid}
          className="flex-1 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/8 hover:text-white"
        >
          Open {kid.name.split(" ")[0]}&rsquo;s view
        </button>
        <button
          onClick={onAddTask}
          className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/4 text-white/70 transition hover:bg-white/8 hover:text-white"
          title={`Assign ${kid.name.split(" ")[0]} a task`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

/* ----------------------------- Approvals queue ---------------------------- */

export function Approvals({
  tasks,
  kids,
  onApprove,
  onDecline,
}: {
  tasks: Task[];
  kids: Kid[];
  onApprove: (t: Task) => void;
  onDecline: (t: Task) => void;
}) {
  const pending = tasks.filter((t) => t.status === "pending");
  const kidOf = (id: number) => kids.find((k) => k.id === id)!;

  return (
    <div id="approvals">
      <SectionHead
        icon={<BadgeCheck className="size-3.5" />}
        title="Approval queue"
        tone="#FF8A6B"
        right={
          <span className="text-[11px] text-white/35">
            {pending.length ? `${pending.length} waiting on you` : "nothing to review"}
          </span>
        }
      />
      <div className="space-y-2">
        <AnimatePresence initial={false} mode="popLayout">
          {pending.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center"
            >
              <span className="font-display text-base italic text-white/45">Inbox zero — take a bow.</span>
              <p className="mt-1 text-[11px] text-white/30">Submissions pop in here the moment kids finish.</p>
            </motion.div>
          ) : (
            pending.map((t) => {
              const kid = kidOf(t.kidId);
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94, x: 36, transition: { duration: 0.25 } }}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-sunk/60 p-3"
                >
                  <Avatar name={kid.name} initials={kid.initials} color={kid.color} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white/85">{t.title}</p>
                    <p className="text-[11px] text-white/35">
                      {kid.name.split(" ")[0]} marked it done · pays{" "}
                      <span className="font-semibold text-sprout">{money(t.rewardCents, { exact: true })}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onDecline(t)}
                      className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
                      title="Send back"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                    <button
                      onClick={() => onApprove(t)}
                      className="flex items-center gap-1 rounded-lg bg-sprout px-3 py-1.5 text-xs font-bold text-[#121703] transition hover:brightness-110 active:scale-95"
                    >
                      <Check className="size-3.5" /> Pay {money(t.rewardCents)}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------- Dues panel ------------------------------ */

export function DuesPanel({
  state,
  nudgedIds,
  settlingIds,
  onNudge,
  onPay,
  onNewSplit,
}: {
  state: AppState;
  nudgedIds: Set<string>;
  settlingIds: Set<string>;
  onNudge: (s: SplitT, memberId: number) => void;
  onPay: (s: SplitT) => void;
  onNewSplit: () => void;
}) {
  const me = state.me;
  const openCount = state.stats.circle.openSplits;

  return (
    <Card padded={false} className="flex flex-col">
      <div className="p-5 pb-0 sm:p-6 sm:pb-0">
        <SectionHead
          icon={<HandCoins className="size-3.5" />}
          title="Bills & splits"
          tone="#C5A0FF"
          right={
            <span className="flex items-center gap-2">
              <span className="text-[11px] text-white/35">{openCount} open</span>
              <button
                onClick={onNewSplit}
                className="flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1.5 text-[11px] font-bold text-[#160a2e] transition hover:brightness-110 active:scale-95"
              >
                <Split className="size-3" /> New
              </button>
            </span>
          }
        />
      </div>

      <div className="slim-scroll max-h-[560px] space-y-2.5 overflow-y-auto p-5 pt-0 sm:p-6 sm:pt-0">
        {state.splits.map((s) => {
          const paid = s.participants.filter((p) => p.status === "paid").length;
          const total = s.participants.length;
          const settled = paid === total;
          const mine = s.payerId === me.id;
          const myRow = s.participants.find((p) => p.memberId === me.id);

          return (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/8 bg-sunk/60"
            >
              <div className="flex items-start justify-between gap-2 p-3.5 pb-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white/90">{s.title}</p>
                  <p className="text-[11px] text-white/35">
                    {s.merchant ?? "Split"} · {money(s.totalCents)} · {timeAgo(s.createdAt)}
                  </p>
                </div>
                <Pill color={settled ? "#8CE8C7" : mine ? "#C9F158" : "#FF8A6B"}>
                  {settled ? (
                    <><Check className="size-3" /> settled</>
                  ) : mine ? (
                    <>{paid}/{total} in</>
                  ) : (
                    <>you owe {money(myRow?.shareCents ?? 0)}</>
                  )}
                </Pill>
              </div>

              {/* progress of collection */}
              <div className="mx-3.5 h-1 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: settled ? "#8CE8C7" : mine ? "#C9F158" : "#FF8A6B" }}
                  initial={false}
                  animate={{ width: `${(paid / total) * 100}%` }}
                  transition={{ type: "spring", stiffness: 70, damping: 18 }}
                />
              </div>

              <div className="space-y-1 p-2.5">
                {s.participants.map((p) => {
                  const key = `${s.id}:${p.memberId}`;
                  const settling = settlingIds.has(key);
                  const nudged = nudgedIds.has(key) || p.nudges > 0;
                  const isMe = p.memberId === me.id;
                  return (
                    <div key={p.id} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
                      <Avatar
                        name={p.member.name}
                        initials={p.member.initials}
                        color={p.member.color}
                        size={28}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/80">
                          {isMe ? "You" : firstName(p.member.name)}
                          {isMe && s.payerId !== me.id && (
                            <span className="text-white/30"> → {firstName(s.payer.name)}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-white/60 tnum">
                        {money(p.shareCents, { exact: true })}
                      </span>
                      {p.status === "paid" ? (
                        <span className="flex items-center gap-1 rounded-full bg-mint/10 px-2 py-1 text-[10px] font-semibold text-mint">
                          <Check className="size-3" /> paid
                        </span>
                      ) : isMe ? (
                        <button
                          onClick={() => onPay(s)}
                          className="flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold text-[#250b05] transition hover:brightness-110 active:scale-95"
                        >
                          Pay {money(p.shareCents)}
                        </button>
                      ) : mine ? (
                        <button
                          onClick={() => onNudge(s, p.memberId)}
                          disabled={settling}
                          className={cx(
                            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition active:scale-95",
                            settling
                              ? "shimmer bg-white/8 text-white/50"
                              : nudged
                                ? "border border-lilac/30 bg-lilac/10 text-lilac"
                                : "bg-lilac text-[#160a2e] hover:brightness-110",
                          )}
                        >
                          {settling ? (
                            "paying…"
                          ) : nudged ? (
                            <><BellRing className="size-3" /> nudged {p.nudges > 0 && `×${p.nudges}`}</>
                          ) : (
                            <><BellRing className="size-3" /> nudge</>
                          )}
                        </button>
                      ) : (
                        <span className="rounded-full bg-white/6 px-2 py-1 text-[10px] text-white/40">waiting</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------------------------ Activity feed ----------------------------- */

const TXN_META: Record<string, { icon: React.ReactNode; tone: string }> = {
  task_pay: { icon: <BadgeCheck className="size-3.5" />, tone: "#C9F158" },
  lesson_reward: { icon: <BookOpen className="size-3.5" />, tone: "#7CC7FF" },
  goal_deposit: { icon: <Target className="size-3.5" />, tone: "#8CE8C7" },
  split_in: { icon: <Receipt className="size-3.5" />, tone: "#C5A0FF" },
  split_out: { icon: <Receipt className="size-3.5" />, tone: "#FF8A6B" },
  allowance: { icon: <Wallet className="size-3.5" />, tone: "#FFC357" },
};

export function ActivityFeed({
  state,
  filterKid,
  scope,
  empty,
}: {
  state: AppState;
  filterKid?: number;
  /** "family" = chores/lessons/goals, "circle" = split money only */
  scope?: "family" | "circle";
  empty?: string;
}) {
  const txns = state.txns
    .filter((t) => (filterKid ? t.memberId === filterKid : true))
    .filter((t) => (scope ? txnScope(t.kind) === scope : true))
    .slice(0, 20);
  const memberOf = (id: number) =>
    [state.me, ...state.kids, ...state.friends].find((m) => m.id === id);

  if (txns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-7 text-center">
        <p className="font-display text-sm italic text-white/40">
          {empty ?? "No movement here yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="slim-scroll max-h-[400px] space-y-0.5 overflow-y-auto">
      <AnimatePresence initial={false}>
        {txns.map((t) => {
          const meta = TXN_META[t.kind] ?? TXN_META.allowance;
          const m = memberOf(t.memberId);
          const positive = t.amountCents >= 0;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/3"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-xl"
                style={{ color: meta.tone, background: `${meta.tone}12`, boxShadow: `inset 0 0 0 1px ${meta.tone}2a` }}
              >
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-white/80">{t.title}</p>
                <p className="text-[10.5px] text-white/35">
                  {m ? firstName(m.name) : "—"} · {timeAgo(t.createdAt)}
                </p>
              </div>
              <span
                className={cx("shrink-0 text-[12.5px] font-semibold tnum", positive ? "" : "text-white/50")}
                style={positive ? { color: meta.tone } : undefined}
              >
                {money(t.amountCents, { exact: true, sign: true })}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
