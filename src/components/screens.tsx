"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Bike,
  Flame,
  GraduationCap,
  Palette,
  Plus,
  Sparkles,
  Sprout,
  Target,
  Users,
} from "lucide-react";
import type { AppState } from "@/lib/data";
import { cx, firstName, money } from "@/lib/money";
import { Avatar, CountUp, Pill, ProgressRing } from "./kit";
import { ActivityFeed, Approvals, DuesPanel } from "./parent";
import { KidHero, KidSide, LearningPath, TaskList } from "./kid";
import { FriendLedger } from "./circle";

type Kid = AppState["kids"][number];
type Task = AppState["tasks"][number];
type Lesson = AppState["lessons"][number];
type SplitT = AppState["splits"][number];
type Goal = AppState["goals"][number];

const GOAL_ICONS: Record<string, ReactNode> = {
  bike: <Bike className="size-3.5" />,
  palette: <Palette className="size-3.5" />,
  target: <Target className="size-3.5" />,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ========================================================================== */
/*  FAMILY HOME — parent sees every kid, every chore, every dollar            */
/* ========================================================================== */

export function FamilyHome({
  state,
  onOpenKid,
  onAddTask,
  onApprove,
  onDecline,
}: {
  state: AppState;
  onOpenKid: (kid: Kid) => void;
  onAddTask: () => void;
  onApprove: (t: Task) => void;
  onDecline: (t: Task) => void;
}) {
  const stats = state.stats.family;
  const pending = state.tasks.filter((t) => t.status === "pending");

  return (
    <div className="px-5 pb-4">
      <AppHeader
        tone="#C9F158"
        kicker="Family vault"
        mark={<Sprout className="size-4" strokeWidth={2.4} />}
        person={state.me}
      />

      <p className="mt-5 text-[12px] font-medium tracking-[0.18em] text-sprout/80 uppercase">
        {greeting()}, {firstName(state.me.name)}
      </p>
      <h1 className="font-display mt-1 text-[28px] leading-[1.15] font-light tracking-tight text-white">
        What the kids are <em className="text-sprout">earning.</em>
      </h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">
        Kid balances, chores, goals and lessons. Friend money never touches this vault.
      </p>

      <div className="relative mt-5 overflow-hidden rounded-[28px] border border-white/8 bg-raised/80 p-5">
        <div
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full opacity-30 blur-3xl"
          style={{ background: "#C9F158" }}
        />
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/35 uppercase">Across {state.kids.length} kid accounts</p>
        <CountUp
          to={stats.total / 100}
          format={(n) =>
            n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
          }
          className="font-display mt-1 block text-[44px] leading-none font-light tracking-tight text-white"
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat label="Spendable" value={money(stats.kidsBalance, { exact: true })} tone="#FFC357" />
          <MiniStat label="In goals" value={money(stats.savedTotal, { exact: true })} tone="#8CE8C7" />
        </div>
        <WeekDots state={state} />
      </div>

      <section className="mt-7">
        <RowLabel
          title="My kids"
          hint="tap to open their world"
          action={
            <button
              onClick={onAddTask}
              className="flex items-center gap-1 rounded-full bg-sprout px-3 py-1.5 text-[11px] font-bold text-[#121703] active:scale-95"
            >
              <Plus className="size-3" strokeWidth={3} /> Task
            </button>
          }
        />
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pt-1 pb-1">
          {state.kids.map((kid) => (
            <KidPeek
              key={kid.id}
              kid={kid}
              tasks={state.tasks.filter((t) => t.kidId === kid.id)}
              goal={state.goals.find((g) => g.kidId === kid.id)}
              lessons={state.lessons.filter((l) => l.kidId === kid.id)}
              onOpen={() => onOpenKid(kid)}
            />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <RowLabel
          title="Needs you"
          hint={pending.length ? `${pending.length} waiting` : "inbox zero"}
          tone="#FF8A6B"
        />
        <div className="rounded-[24px] border border-white/8 bg-raised/80 p-4">
          <Approvals tasks={state.tasks} kids={state.kids} onApprove={onApprove} onDecline={onDecline} bare />
        </div>
      </section>

      <section className="mt-7">
        <RowLabel title="Goals" hint="saved of target" tone="#8CE8C7" />
        <div className="space-y-2">
          {state.kids.map((kid) => {
            const goal = state.goals.find((g) => g.kidId === kid.id);
            if (!goal) return null;
            return (
              <button
                key={kid.id}
                onClick={() => onOpenKid(kid)}
                className="flex w-full items-center gap-3 rounded-[22px] border border-white/8 bg-raised/80 p-3.5 text-left active:scale-[0.99]"
              >
                <Avatar name={kid.name} initials={kid.initials} color={kid.color} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-white/90">
                      {firstName(kid.name)} · {goal.title}
                    </p>
                    <span className="text-[11px] font-bold tnum" style={{ color: kid.color }}>
                      {Math.round((goal.savedCents / goal.targetCents) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: kid.color }}
                      initial={false}
                      animate={{ width: `${(goal.savedCents / goal.targetCents) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/35 tnum">
                    {money(goal.savedCents, { exact: true })} of {money(goal.targetCents)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <RowLabel title="Learning" hint="money school" tone="#7CC7FF" />
        <div className="space-y-2">
          {state.kids.map((kid) => {
            const ls = state.lessons.filter((l) => l.kidId === kid.id);
            const done = ls.filter((l) => l.status === "done").length;
            return (
              <button
                key={kid.id}
                onClick={() => onOpenKid(kid)}
                className="flex w-full items-center gap-3 rounded-[22px] border border-white/8 bg-raised/80 p-3.5 text-left active:scale-[0.99]"
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-sky/10 text-sky">
                  <GraduationCap className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-white/90">{firstName(kid.name)}</p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-sky"
                      style={{ width: `${(done / Math.max(1, ls.length)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[12px] font-bold text-sky tnum">
                  {done}/{ls.length}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <RowLabel title="Recent" hint="family ledger only" tone="#FFC357" />
        <div className="rounded-[24px] border border-white/8 bg-raised/80 p-3">
          <ActivityFeed state={state} scope="family" limit={6} empty="No chores or lessons paid yet." />
        </div>
      </section>
    </div>
  );
}

function KidPeek({
  kid,
  tasks,
  goal,
  lessons,
  onOpen,
}: {
  kid: Kid;
  tasks: Task[];
  goal?: Goal;
  lessons: AppState["lessons"];
  onOpen: () => void;
}) {
  const open = tasks.filter((t) => t.status === "open" || t.status === "declined").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const pct = goal ? goal.savedCents / goal.targetCents : 0;
  const done = lessons.filter((l) => l.status === "done").length;

  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.97 }}
      className="relative w-[210px] shrink-0 snap-start overflow-hidden rounded-[26px] border border-white/8 bg-raised/90 p-4 text-left"
    >
      <div
        className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full opacity-25 blur-2xl"
        style={{ background: kid.color }}
      />
      <div className="relative flex items-start justify-between">
        <Avatar name={kid.name} initials={kid.initials} color={kid.color} size={44} />
        <Pill color="#FFC357">
          <Flame className="size-3" /> {kid.streakDays}
        </Pill>
      </div>
      <p className="relative mt-3 text-[16px] font-semibold text-white">{firstName(kid.name)}</p>
      <p className="relative truncate text-[11px] text-white/40">{kid.tagline}</p>
      <p className="relative mt-3 font-display text-[28px] leading-none font-light text-white tnum">
        {money(kid.balanceCents, { exact: true })}
      </p>
      <p className="relative mt-1 text-[10px] tracking-[0.14em] text-white/30 uppercase">spendable</p>

      {goal && (
        <div className="relative mt-3 flex items-center gap-2.5">
          <ProgressRing value={pct} size={36} stroke={3.5} color={kid.color}>
            <span className="text-[8px]" style={{ color: kid.color }}>
              {GOAL_ICONS[goal.icon] ?? GOAL_ICONS.target}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-white/80">{goal.title}</p>
            <p className="text-[10px] text-white/35 tnum">{Math.round(pct * 100)}% saved</p>
          </div>
        </div>
      )}

      <div className="relative mt-3 flex flex-wrap gap-1">
        {pending > 0 && <Pill color="#FF8A6B">{pending} to review</Pill>}
        <Pill color={kid.color}>{open} open</Pill>
        <Pill color="#7CC7FF">
          {done}/{lessons.length} lessons
        </Pill>
      </div>
    </motion.button>
  );
}

/* ========================================================================== */
/*  KID WORLD — tasks, goals, learning, savings. Parent sees it all.          */
/* ========================================================================== */

export function KidWorld({
  state,
  kid,
  busyTask,
  busyLesson,
  earnedFlash,
  onBack,
  onSubmit,
  onComplete,
  onDeposit,
}: {
  state: AppState;
  kid: Kid;
  busyTask: number | null;
  busyLesson: number | null;
  earnedFlash: boolean;
  onBack: () => void;
  onSubmit: (t: Task) => void;
  onComplete: (l: Lesson) => void;
  onDeposit: (goalId: number, amountCents: number) => void;
}) {
  return (
    <div className="px-5 pb-4">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[12px] font-semibold text-white/70 active:scale-95"
        >
          <ArrowLeft className="size-3.5" /> Family
        </button>
        <Pill color={kid.color}>
          <Sparkles className="size-3" /> Parent view
        </Pill>
        <Avatar name={kid.name} initials={kid.initials} color={kid.color} size={32} />
      </div>

      <p className="mt-5 text-[12px] font-medium tracking-[0.18em] uppercase" style={{ color: `${kid.color}cc` }}>
        {firstName(kid.name)}&rsquo;s world
      </p>
      <h1 className="font-display mt-1 text-[28px] leading-[1.15] font-light tracking-tight text-white">
        Earn it. Save it. <em style={{ color: kid.color }}>Know why.</em>
      </h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">
        Chores, money school and the goal they&rsquo;re chasing. You see every move.
      </p>

      <div className="mt-5 space-y-3.5">
        <KidHero
          kid={kid}
          goal={state.goals.find((g) => g.kidId === kid.id)}
          justEarned={earnedFlash}
          onDeposit={onDeposit}
        />
        <TaskList
          kid={kid}
          tasks={state.tasks.filter((t) => t.kidId === kid.id)}
          busyId={busyTask}
          onSubmit={onSubmit}
        />
        <LearningPath
          kid={kid}
          lessons={state.lessons.filter((l) => l.kidId === kid.id)}
          busyId={busyLesson}
          onComplete={onComplete}
        />
        <KidSide state={state} kid={kid} />
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  CIRCLE HOME — friends, splits, dues. Completely separate from kids.       */
/* ========================================================================== */

export function CircleHome({
  state,
  nudged,
  settling,
  onNudge,
  onNudgeFriend,
  onPay,
  onNewSplit,
}: {
  state: AppState;
  nudged: Set<string>;
  settling: Set<string>;
  onNudge: (s: SplitT, memberId: number) => void;
  onNudgeFriend: (friendId: number) => void;
  onPay: (s: SplitT) => void;
  onNewSplit: () => void;
}) {
  const c = state.stats.circle;
  const up = c.net >= 0;

  return (
    <div className="px-5 pb-4">
      <AppHeader
        tone="#C5A0FF"
        kicker="Circle"
        mark={<Users className="size-4" />}
        person={state.me}
      />

      <p className="mt-5 text-[12px] font-medium tracking-[0.18em] text-lilac/80 uppercase">Friends only</p>
      <h1 className="font-display mt-1 text-[28px] leading-[1.15] font-light tracking-tight text-white">
        Nights out, <em className="text-lilac">split clean.</em>
      </h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">
        Who paid, who owes, who&rsquo;s square. This ledger never touches the family vault.
      </p>

      <div className="relative mt-5 overflow-hidden rounded-[28px] border border-white/8 bg-raised/80 p-5">
        <div
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full opacity-30 blur-3xl"
          style={{ background: "#C5A0FF" }}
        />
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/35 uppercase">
          {up ? "You are up overall" : "You are down overall"}
        </p>
        <CountUp
          to={Math.abs(c.net) / 100}
          format={(n) =>
            `${up ? "+" : "−"}${n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })}`
          }
          className="font-display mt-1 block text-[44px] leading-none font-light tracking-tight"
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat label="Owed to you" value={money(c.owedToMe, { exact: true })} tone="#C9F158" />
          <MiniStat label="You owe" value={money(c.iOwe, { exact: true })} tone="#FF8A6B" />
        </div>
      </div>

      <section className="mt-7">
        <RowLabel title="The circle" hint={`${state.friends.length} friends`} tone="#C5A0FF" />
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
          {state.friends.map((f) => {
            const row = state.friendLedger[f.id] ?? { owesMe: 0, iOwe: 0, net: 0 };
            const due = row.net;
            return (
              <button
                key={f.id}
                onClick={() => (due > 0 ? onNudgeFriend(f.id) : undefined)}
                className="flex w-[84px] shrink-0 flex-col items-center gap-2"
              >
                <span className="relative">
                  <Avatar name={f.name} initials={f.initials} color={f.color} size={56} />
                  {due > 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-coral px-1.5 py-px text-[9px] font-bold text-[#250b05] tnum">
                      {money(due)}
                    </span>
                  ) : due < 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-gold px-1.5 py-px text-[9px] font-bold text-[#1d1503] tnum">
                      {money(Math.abs(due))}
                    </span>
                  ) : (
                    <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-mint text-[#052117]">
                      <BadgeCheck className="size-2.5" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center text-[11px] font-medium text-white/75">
                  {firstName(f.name)}
                </span>
                <span
                  className="text-[10px] tnum"
                  style={{ color: due > 0 ? "#C9F158" : due < 0 ? "#FF8A6B" : "#8CE8C7" }}
                >
                  {due === 0 ? "even" : due > 0 ? "owes you" : "you owe"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <DuesPanel
          state={state}
          nudgedIds={nudged}
          settlingIds={settling}
          onNudge={onNudge}
          onPay={onPay}
          onNewSplit={onNewSplit}
        />
      </section>

      <section className="mt-3.5">
        <FriendLedger state={state} onNudgeFriend={onNudgeFriend} />
      </section>

      <section className="mt-3.5">
        <div className="rounded-[24px] border border-white/8 bg-raised/80 p-3">
          <p className="mb-1 px-2 text-[11px] font-semibold tracking-[0.14em] text-white/35 uppercase">
            Circle ledger
          </p>
          <ActivityFeed state={state} scope="circle" limit={6} empty="No split activity yet." />
        </div>
      </section>
    </div>
  );
}

/* --------------------------------- chrome --------------------------------- */

function AppHeader({
  tone,
  kicker,
  mark,
  person,
}: {
  tone: string;
  kicker: string;
  mark: ReactNode;
  person: AppState["me"];
}) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-9 place-items-center rounded-2xl text-[#121703]"
          style={{ background: tone, boxShadow: `0 8px 24px -8px ${tone}b3` }}
        >
          {mark}
        </span>
        <div className="leading-none">
          <p className="font-display text-[22px] italic tracking-tight text-white">sprout</p>
          <p className="mt-0.5 text-[9px] font-medium tracking-[0.22em] text-white/35 uppercase">{kicker}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 py-1 pr-3 pl-1">
        <Avatar name={person.name} initials={person.initials} color={person.color} size={26} />
        <span className="text-[12px] font-semibold text-white/80">{firstName(person.name)}</span>
      </div>
    </header>
  );
}

function RowLabel({
  title,
  hint,
  action,
  tone = "#C9F158",
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[13px] font-semibold tracking-[0.16em] text-white/55 uppercase">{title}</h2>
        {hint && (
          <p className="mt-0.5 text-[11px] text-white/30" style={{ color: `${tone}99` }}>
            {hint}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-sunk/70 px-3 py-2.5">
      <p className="text-[10px] font-medium tracking-[0.12em] text-white/35 uppercase">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold tnum" style={{ color: tone }}>
        {value}
      </p>
    </div>
  );
}

function WeekDots({ state }: { state: AppState }) {
  const kidIds = new Set(state.kids.map((k) => k.id));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const amount = state.txns
      .filter(
        (t) =>
          kidIds.has(t.memberId) &&
          (t.kind === "task_pay" || t.kind === "lesson_reward") &&
          new Date(t.createdAt).toDateString() === d.toDateString(),
      )
      .reduce((a, t) => a + t.amountCents, 0);
    return { label: d.toLocaleDateString("en-US", { weekday: "narrow" }), amount };
  });
  const max = Math.max(...days.map((d) => d.amount), 100);

  return (
    <div className="mt-5 flex h-16 items-end gap-1.5">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cx("w-full origin-bottom rounded-full", i === 6 ? "bg-sprout" : "bg-white/14")}
            style={{ height: 4 + (d.amount / max) * 40 }}
          />
          <span className={cx("text-[9px] font-medium uppercase", i === 6 ? "text-sprout" : "text-white/30")}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
