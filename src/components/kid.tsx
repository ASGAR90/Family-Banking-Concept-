"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bike,
  Check,
  GraduationCap,
  Hourglass,
  ListChecks,
  Lock,
  Palette,
  PiggyBank,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import type { AppState } from "@/lib/data";
import { cx, money } from "@/lib/money";
import { Avatar, Card, CountUp, Pill, ProgressRing, SectionHead } from "./kit";
import { ActivityFeed } from "./parent";

type Kid = AppState["kids"][number];
type Task = AppState["tasks"][number];
type Goal = AppState["goals"][number];
type Lesson = AppState["lessons"][number];

const GOAL_ICONS: Record<string, React.ReactNode> = {
  bike: <Bike className="size-4" />,
  palette: <Palette className="size-4" />,
  target: <Target className="size-4" />,
};

/* --------------------------------- Kid hero -------------------------------- */

export function KidHero({
  kid,
  goal,
  justEarned,
  onDeposit,
}: {
  kid: Kid;
  goal?: Goal;
  justEarned: boolean;
  onDeposit: (goalId: number, amountCents: number) => void;
}) {
  const pct = goal ? goal.savedCents / goal.targetCents : 0;
  return (
    <Card className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-28 -right-10 size-80 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${kid.color}, transparent 70%)` }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <Pill color={kid.color}>
            <Sparkles className="size-3" /> {kid.name.split(" ")[0]}&rsquo;s wallet
          </Pill>
          <Pill color="#FFC357">
            {kid.streakDays} day streak
          </Pill>
        </div>

        <div className="mt-5 flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] text-white/35 uppercase">You can spend</p>
            <div className="relative inline-block">
              <CountUp
                to={kid.balanceCents / 100}
                format={(n) =>
                  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
                }
                className="font-display text-[54px] leading-none font-light tracking-tight"
              />
              <AnimatePresence>
                {justEarned && (
                  <motion.span
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: -26 }}
                    className="absolute -right-3 top-1 translate-x-full text-lg"
                  >
                    <Sparkles className="size-5 text-sprout" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {goal && (
            <ProgressRing value={pct} size={86} stroke={7} color={kid.color}>
              <div className="text-center">
                <span style={{ color: kid.color }}>{GOAL_ICONS[goal.icon] ?? GOAL_ICONS.target}</span>
                <p className="text-[11px] font-bold text-white tnum">{Math.round(pct * 100)}%</p>
              </div>
            </ProgressRing>
          )}
        </div>

        {goal && (
          <div className="mt-6 rounded-2xl border border-white/8 bg-sunk/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-white/55">
                Saving for <span className="font-semibold text-white/90">{goal.title}</span>
              </p>
              <p className="text-[11px] text-white/40 tnum">
                <span style={{ color: kid.color }}>{money(goal.savedCents, { exact: true })}</span>
                {" / "}
                {money(goal.targetCents)}
              </p>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full rounded-full"
                style={{ background: kid.color }}
                initial={false}
                animate={{ width: `${pct * 100}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 16 }}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="mr-1 text-[11px] text-white/40">Move to savings</span>
              {[100, 500, 1000].map((amt) => {
                const can = kid.balanceCents >= amt && goal.targetCents - goal.savedCents > 0;
                return (
                  <button
                    key={amt}
                    disabled={!can}
                    onClick={() => onDeposit(goal.id, amt)}
                    className={cx(
                      "rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95",
                      can
                        ? "bg-white/8 text-white/85 hover:bg-white/14"
                        : "cursor-not-allowed bg-white/3 text-white/25",
                    )}
                  >
                    +{money(amt)}
                  </button>
                );
              })}
              <PiggyBank className="ml-auto size-4 text-white/25" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------- Task list -------------------------------- */

export function TaskList({
  kid,
  tasks,
  busyId,
  onSubmit,
}: {
  kid: Kid;
  tasks: Task[];
  busyId: number | null;
  onSubmit: (t: Task) => void;
}) {
  const actionable = tasks.filter((t) => t.status === "open" || t.status === "declined");
  const pending = tasks.filter((t) => t.status === "pending");
  const done = tasks.filter((t) => t.status === "approved");

  return (
    <Card>
      <SectionHead
        icon={<ListChecks className="size-3.5" />}
        title="Ways to earn today"
        tone={kid.color}
        right={<span className="text-[11px] text-white/35">tap the circle when done</span>}
      />

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {actionable.map((t) => (
            <motion.button
              key={t.id}
              layout
              onClick={() => onSubmit(t)}
              disabled={busyId === t.id}
              whileTap={{ scale: 0.98 }}
              className={cx(
                "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                t.status === "declined"
                  ? "border-coral/25 bg-coral/5"
                  : "border-white/8 bg-sunk/60 hover:border-white/16 hover:bg-white/4",
              )}
            >
              <span
                className={cx(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all duration-300",
                  busyId === t.id
                    ? "border-sprout bg-sprout"
                    : "border-white/25 group-hover:border-sprout/70",
                )}
              >
                {busyId === t.id && <Check className="size-3.5 text-[#121703]" strokeWidth={3.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white/90">
                  {t.title}
                  {t.status === "declined" && (
                    <span className="ml-2 text-[10px] font-semibold text-coral">Maya asked for a redo</span>
                  )}
                </p>
                <p className="text-[11px] text-white/35 capitalize">{t.category}</p>
              </div>
              <span className="rounded-full bg-sprout/10 px-2.5 py-1 text-[11px] font-bold text-sprout tnum">
                +{money(t.rewardCents, { exact: true })}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        {pending.map((t) => (
          <motion.div
            key={t.id}
            layout
            className="flex items-center gap-3 rounded-2xl border border-gold/15 bg-gold/5 p-3 opacity-90"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold/20">
              <Hourglass className="size-3 text-gold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white/55 line-through decoration-white/25">
                {t.title}
              </p>
              <p className="text-[11px] text-gold/80">Maya is checking… pays {money(t.rewardCents, { exact: true })}</p>
            </div>
          </motion.div>
        ))}

        {done.length > 0 && (
          <div className="pt-2">
            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-white/30 uppercase">
              Paid out lately
            </p>
            {done.slice(0, 2).map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1 text-[12px] text-white/40">
                <Check className="size-3 text-sprout" />
                <span className="flex-1 truncate">{t.title}</span>
                <span className="font-semibold text-sprout/80 tnum">+{money(t.rewardCents, { exact: true })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------- Learning path ------------------------------ */

export function LearningPath({
  kid,
  lessons,
  busyId,
  onComplete,
}: {
  kid: Kid;
  lessons: Lesson[];
  busyId: number | null;
  onComplete: (l: Lesson) => void;
}) {
  const doneCount = lessons.filter((l) => l.status === "done").length;
  return (
    <Card>
      <SectionHead
        icon={<GraduationCap className="size-3.5" />}
        title="Money school"
        tone="#7CC7FF"
        right={
          <span className="text-[11px] text-white/35 tnum">
            {doneCount}/{lessons.length} chapters
          </span>
        }
      />
      <div className="relative space-y-2 pl-2">
        <span className="absolute top-2 bottom-2 left-[17px] w-px bg-white/8" />
        <AnimatePresence initial={false}>
          {lessons.map((l) => {
            const state = l.status;
            const isBusy = busyId === l.id;
            return (
              <motion.div
                key={l.id}
                layout
                className={cx(
                  "relative flex items-center gap-3 rounded-2xl border p-3",
                  state === "done" && "border-sky/15 bg-sky/5",
                  state === "open" && "border-white/10 bg-sunk/60",
                  state === "locked" && "border-white/5 bg-transparent opacity-45",
                )}
              >
                <span
                  className={cx(
                    "relative z-10 grid size-8 shrink-0 place-items-center rounded-xl",
                    state === "done" && "bg-sky/20 text-sky",
                    state === "open" && "bg-white/8 text-white/80",
                    state === "locked" && "bg-white/5 text-white/30",
                  )}
                >
                  {state === "done" ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : state === "locked" ? (
                    <Lock className="size-3.5" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white/90">{l.title}</p>
                  <p className="text-[11px] text-white/35 capitalize">
                    {l.category} · {l.minutes} min
                  </p>
                </div>
                {state === "done" ? (
                  <span className="text-[11px] font-bold text-sky tnum">+{money(l.rewardCents, { exact: true })}</span>
                ) : state === "open" ? (
                  <button
                    onClick={() => onComplete(l)}
                    disabled={isBusy}
                    className={cx(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95",
                      isBusy ? "shimmer bg-white/10 text-white/50" : "bg-sky text-[#04121f] hover:brightness-110",
                    )}
                  >
                    {isBusy ? "learning…" : <>Finish · +{money(l.rewardCents)}</>}
                  </button>
                ) : (
                  <span className="text-[10px] font-medium tracking-wide text-white/25 uppercase">next up</span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/* ----------------------------- Kid activity side ---------------------------- */

export function KidSide({ state, kid }: { state: AppState; kid: Kid }) {
  return (
    <Card>
      <SectionHead
        icon={<Avatar name={kid.name} initials={kid.initials} color={kid.color} size={20} />}
        title="Your money moves"
        tone={kid.color}
      />
      <ActivityFeed
        state={state}
        filterKid={kid.id}
        scope="family"
        limit={8}
        empty="Finish a task or lesson to start your ledger."
      />
    </Card>
  );
}
