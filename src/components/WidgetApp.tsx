"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  CircleDollarSign,
  GraduationCap,
  HandCoins,
  Home,
  Plus,
  Radar,
  Receipt,
  Sparkles,
  Split,
  Sprout,
  Users,
} from "lucide-react";
import type { AppState } from "@/lib/data";
import { cx, firstName, money } from "@/lib/money";
import { Avatar, Card, Pill, SectionHead } from "./kit";
import { Orbit } from "./orbit";
import {
  ActivityFeed,
  Approvals,
  BalanceHero,
  DuesPanel,
  KidCard,
  WeekStrip,
} from "./parent";
import { CircleHero, CircleSpendStrip, FriendLedger } from "./circle";
import { KidHero, KidSide, LearningPath, TaskList } from "./kid";
import { NewSplitModal, NewTaskModal } from "./modals";

type Task = AppState["tasks"][number];
type Lesson = AppState["lessons"][number];
type SplitT = AppState["splits"][number];
type Tab = "family" | "circle";

type Toast = { id: number; msg: string; tone: string; icon: React.ReactNode };

/* -------------------------------------------------------------------------- */

export default function WidgetApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("family");
  const [persona, setPersona] = useState<number | "parent">("parent");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busyTask, setBusyTask] = useState<number | null>(null);
  const [busyLesson, setBusyLesson] = useState<number | null>(null);
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [settling, setSettling] = useState<Set<string>>(new Set());
  const [taskModal, setTaskModal] = useState(false);
  const [splitModal, setSplitModal] = useState(false);
  const [earnedFlash, setEarnedFlash] = useState(false);
  const toastId = useRef(0);

  /* ------------------------------ data flow ------------------------------ */

  const load = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "failed");
      setState(json.state);
      setFailed(false);
    } catch {
      if (!silent) setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 45_000);
    return () => clearInterval(t);
  }, [load]);

  const pushToast = useCallback((msg: string, tone = "#C9F158", icon?: React.ReactNode) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, msg, tone, icon: icon ?? <Sparkles className="size-3.5" /> }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const mutate = useCallback(async (url: string, body: Record<string, unknown>, method = "POST") => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "something went wrong");
    setState(json.state);
    return json.state as AppState;
  }, []);

  const flashEarned = () => {
    setEarnedFlash(true);
    setTimeout(() => setEarnedFlash(false), 1600);
  };

  /* ------------------------------- actions -------------------------------- */

  const submitTask = async (t: Task) => {
    setBusyTask(t.id);
    await new Promise((r) => setTimeout(r, 620));
    await mutate(`/api/tasks/${t.id}`, { action: "submit" }, "PATCH");
    setBusyTask(null);
    pushToast(`Sent to Maya — ${money(t.rewardCents, { exact: true })} pending approval`, "#FFC357", <BellRing className="size-3.5" />);
  };

  const approveTask = async (t: Task) => {
    const kid = state?.kids.find((k) => k.id === t.kidId);
    await mutate(`/api/tasks/${t.id}`, { action: "approve" }, "PATCH");
    pushToast(`Paid ${kid ? firstName(kid.name) : "kid"} ${money(t.rewardCents, { exact: true })} — nicely done`, "#C9F158", <HandCoins className="size-3.5" />);
  };

  const declineTask = async (t: Task) => {
    await mutate(`/api/tasks/${t.id}`, { action: "decline" }, "PATCH");
    pushToast("Sent back for one more pass", "#FF8A6B", <BellRing className="size-3.5" />);
  };

  const completeLesson = async (l: Lesson) => {
    setBusyLesson(l.id);
    await new Promise((r) => setTimeout(r, 1100));
    await mutate(`/api/lessons/${l.id}`, { kidId: l.kidId });
    setBusyLesson(null);
    flashEarned();
    pushToast(`Lesson done — +${money(l.rewardCents, { exact: true })} and the next chapter unlocked`, "#7CC7FF", <Sparkles className="size-3.5" />);
  };

  const deposit = async (goalId: number, amountCents: number) => {
    if (typeof persona !== "number") return;
    try {
      const s = await mutate(`/api/goals/${goalId}`, { kidId: persona, amountCents });
      const g = s.goals.find((x) => x.id === goalId);
      pushToast(`${money(amountCents, { exact: true })} tucked into “${g?.title}”`, "#8CE8C7", <Sparkles className="size-3.5" />);
    } catch (e) {
      pushToast((e as Error).message, "#FF8A6B");
    }
  };

  const nudge = async (split: SplitT, memberId: number) => {
    const key = `${split.id}:${memberId}`;
    if (settling.has(key)) return;
    await mutate(`/api/splits/${split.id}`, { action: "nudge", memberId });
    setNudged((s) => new Set(s).add(key));
    const member = split.participants.find((p) => p.memberId === memberId)?.member;
    pushToast(`Nudged ${member ? firstName(member.name) : "friend"} — ${money(split.shareCents, { exact: true })} due`, "#C5A0FF", <BellRing className="size-3.5" />);
    setTimeout(() => setSettling((s) => new Set(s).add(key)), 900 + Math.random() * 700);
    setTimeout(
      async () => {
        try {
          await mutate(`/api/splits/${split.id}`, { action: "settle", memberId });
          setSettling((s) => {
            const n = new Set(s);
            n.delete(key);
            return n;
          });
          pushToast(`+${money(split.shareCents, { exact: true })} from ${member ? firstName(member.name) : "friend"} — ${split.title}`, "#C9F158", <HandCoins className="size-3.5" />);
        } catch {
          /* settled elsewhere */
        }
      },
      2400 + Math.random() * 1200,
    );
  };

  /** Nudge every open share a friend owes, from the ledger card. */
  const nudgeFriend = async (friendId: number) => {
    if (!state) return;
    const targets = state.splits.filter(
      (s) =>
        s.payerId === state.me.id &&
        s.participants.some((p) => p.memberId === friendId && p.status === "pending"),
    );
    for (const s of targets) await nudge(s, friendId);
  };

  const payOwn = async (split: SplitT) => {
    const me = state?.me;
    if (!me) return;
    await mutate(`/api/splits/${split.id}`, { action: "pay", memberId: me.id });
    pushToast(`Paid ${firstName(split.payer.name)} ${money(split.shareCents, { exact: true })} — all squared up`, "#8CE8C7", <HandCoins className="size-3.5" />);
  };

  const createTask = async (p: { kidId: number; title: string; rewardCents: number; category: string }) => {
    await mutate("/api/tasks", p);
    const kid = state?.kids.find((k) => k.id === p.kidId);
    pushToast(`Task planted for ${kid ? firstName(kid.name) : "kid"} · worth ${money(p.rewardCents, { exact: true })}`, "#C9F158", <Sparkles className="size-3.5" />);
  };

  const createSplit = async (p: { title: string; merchant: string; totalCents: number; participantIds: number[] }) => {
    await mutate("/api/splits", p);
    pushToast(`Requests sent — ${p.participantIds.length} friends owe their share`, "#C5A0FF", <HandCoins className="size-3.5" />);
  };

  /* ------------------------------ derivations ------------------------------ */

  const activeKid = useMemo(
    () => (typeof persona === "number" ? state?.kids.find((k) => k.id === persona) : undefined),
    [persona, state],
  );

  const dueByMember = useMemo(() => {
    const map: Record<number, number> = {};
    if (!state) return map;
    for (const s of state.splits) {
      if (s.payerId !== state.me.id) continue;
      for (const p of s.participants)
        if (p.status === "pending") map[p.memberId] = (map[p.memberId] ?? 0) + p.shareCents;
    }
    return map;
  }, [state]);

  const openTasksByKid = useMemo(() => {
    const map: Record<number, number> = {};
    if (!state) return map;
    for (const t of state.tasks)
      if (t.status === "open" || t.status === "pending") map[t.kidId] = (map[t.kidId] ?? 0) + 1;
    return map;
  }, [state]);

  const isFamily = tab === "family";
  const accent = isFamily ? "#C9F158" : "#C5A0FF";

  const goTab = (t: Tab) => {
    setTab(t);
    if (t === "circle") setPersona("parent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* -------------------------------- render --------------------------------- */

  return (
    <div className="grain relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed -top-40 -left-40 size-[560px] rounded-full opacity-[0.13] blur-3xl transition-colors duration-700" style={{ background: `radial-gradient(circle, ${accent}, transparent 65%)` }} />
      <div className="pointer-events-none fixed -right-48 top-1/3 size-[620px] rounded-full opacity-[0.09] blur-3xl" style={{ background: `radial-gradient(circle, ${isFamily ? "#FFC357" : "#7CC7FF"}, transparent 65%)` }} />

      <div className="relative mx-auto max-w-[1460px] px-4 pt-6 pb-36 sm:px-6 lg:px-8">
        {/* ------------------------------- header ------------------------------ */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 place-items-center rounded-2xl text-[#121703] transition-colors duration-500"
              style={{ background: accent, boxShadow: `0 10px 36px -8px ${accent}b3` }}
            >
              <Sprout className="size-5" strokeWidth={2.4} />
            </span>
            <div className="leading-none">
              <p className="font-display text-[26px] italic tracking-tight text-white">sprout</p>
              <p className="text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase">family money os</p>
            </div>
          </div>

          {/* desktop tab switcher */}
          {state && (
            <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1 backdrop-blur md:flex">
              <TabButton
                active={isFamily}
                onClick={() => goTab("family")}
                icon={<Home className="size-3.5" />}
                label="Family"
                badge={state.stats.family.pendingApprovals || undefined}
                tone="#C9F158"
              />
              <TabButton
                active={!isFamily}
                onClick={() => goTab("circle")}
                icon={<Users className="size-3.5" />}
                label="Circle"
                badge={state.stats.circle.openSplits || undefined}
                tone="#C5A0FF"
              />
            </div>
          )}

          {/* who-am-I switcher — family only */}
          {state && isFamily && (
            <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1 backdrop-blur">
              <PersonaButton
                active={persona === "parent"}
                onClick={() => setPersona("parent")}
                initials={state.me.initials}
                color={state.me.color}
                label="Maya"
                sub="parent"
              />
              {state.kids.map((k) => (
                <PersonaButton
                  key={k.id}
                  active={persona === k.id}
                  onClick={() => setPersona(k.id)}
                  initials={k.initials}
                  color={k.color}
                  label={firstName(k.name)}
                  sub="kid"
                />
              ))}
            </nav>
          )}
        </header>

        {/* -------------------------------- intro ------------------------------ */}
        <div className="mt-10 mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p
              className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] uppercase"
              style={{ color: `${accent}cc` }}
            >
              <Radar className="size-3.5" />
              {activeKid
                ? `Family · ${firstName(activeKid.name)}'s world`
                : isFamily
                  ? "Family · kids, chores & goals"
                  : "Circle · friends, bills & splits"}
            </p>
            <h1 className="font-display max-w-3xl text-4xl leading-[1.05] font-light tracking-tight text-white sm:text-[52px]">
              {activeKid ? (
                <>Earn it. Save it. <em style={{ color: accent }}>Know why.</em></>
              ) : isFamily ? (
                <>Everything your kids <em style={{ color: accent }}>earn and learn.</em></>
              ) : (
                <>Nights out, <em style={{ color: accent }}>split clean.</em></>
              )}
            </h1>
          </div>
          <p className="max-w-xs text-[13px] leading-relaxed text-white/40">
            {activeKid
              ? "Check off chores, finish money school chapters, and watch your goal ring fill up."
              : isFamily
                ? "Kid balances, task approvals, savings goals and lessons — a ledger kept entirely apart from your social spending."
                : "Who paid, who owes, who's square. Friend money lives here and never touches the family pot."}
          </p>
        </div>

        {/* -------------------------------- body ------------------------------- */}
        {failed && (
          <Card className="text-center">
            <p className="text-sm text-white/60">Couldn&apos;t reach the family bank.</p>
            <button onClick={() => load()} className="mt-3 rounded-full bg-sprout px-5 py-2 text-xs font-bold text-[#121703]">
              Retry
            </button>
          </Card>
        )}

        {!state && !failed && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {["lg:col-span-4", "lg:col-span-5", "lg:col-span-3"].map((span, i) => (
              <div key={i} className={cx("space-y-4", span)}>
                <div className="shimmer h-[380px] rounded-3xl border border-white/5 bg-white/3" />
                <div className="shimmer h-[210px] rounded-3xl border border-white/5 bg-white/3" />
              </div>
            ))}
          </div>
        )}

        {state && (
          <AnimatePresence mode="wait">
            {/* ============================= FAMILY ============================= */}
            {isFamily && persona === "parent" ? (
              <motion.main
                key="family-parent"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12"
              >
                <div className="space-y-4 lg:col-span-4">
                  <Card padded={false}>
                    <div className="p-5 pb-0 sm:p-6 sm:pb-0">
                      <SectionHead
                        icon={<Home className="size-3.5" />}
                        title="My kids"
                        tone="#C9F158"
                        right={<Pill color="#9AA3B2">{state.kids.length} accounts</Pill>}
                      />
                    </div>
                    <Orbit
                      scope="family"
                      me={state.me}
                      kids={state.kids}
                      friends={state.friends}
                      dueByMember={dueByMember}
                      openTasksByKid={openTasksByKid}
                      onSelect={(m) => setPersona(m.id)}
                    />
                    <div className="grid grid-cols-3 divide-x divide-white/6 border-t border-white/6 text-center">
                      {[
                        { l: "earned / wk", v: money(state.stats.family.earnedThisWeek), c: "#C9F158" },
                        { l: "in goals", v: money(state.stats.family.savedTotal), c: "#8CE8C7" },
                        { l: "to review", v: String(state.stats.family.pendingApprovals), c: "#FF8A6B" },
                      ].map((s) => (
                        <div key={s.l} className="py-4">
                          <p className="text-sm font-bold tnum" style={{ color: s.c }}>{s.v}</p>
                          <p className="mt-0.5 text-[10px] tracking-[0.14em] text-white/35 uppercase">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <WeekStrip state={state} />
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <BalanceHero
                    state={state}
                    onAddTask={() => setTaskModal(true)}
                    onJumpApprovals={() =>
                      document.getElementById("approvals")?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {state.kids.map((k) => (
                      <KidCard
                        key={k.id}
                        kid={k}
                        tasks={state.tasks.filter((t) => t.kidId === k.id)}
                        goal={state.goals.find((g) => g.kidId === k.id)}
                        onViewKid={() => setPersona(k.id)}
                        onAddTask={() => setTaskModal(true)}
                      />
                    ))}
                  </div>
                  <Card>
                    <Approvals tasks={state.tasks} kids={state.kids} onApprove={approveTask} onDecline={declineTask} />
                  </Card>
                </div>

                <div className="space-y-4 lg:col-span-3">
                  <Card padded={false}>
                    <div className="p-5 pb-1 sm:p-6 sm:pb-1">
                      <SectionHead
                        icon={<CircleDollarSign className="size-3.5" />}
                        title="Family ledger"
                        tone="#FFC357"
                        right={<span className="text-[11px] text-white/35">kids only</span>}
                      />
                    </div>
                    <div className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <ActivityFeed state={state} scope="family" empty="No chores or lessons paid yet." />
                    </div>
                  </Card>

                  <Card>
                    <SectionHead icon={<GraduationCap className="size-3.5" />} title="Learning progress" tone="#7CC7FF" />
                    <div className="space-y-3">
                      {state.kids.map((k) => {
                        const ls = state.lessons.filter((l) => l.kidId === k.id);
                        const done = ls.filter((l) => l.status === "done").length;
                        return (
                          <button
                            key={k.id}
                            onClick={() => setPersona(k.id)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-sunk/60 p-3 text-left transition hover:border-white/16"
                          >
                            <Avatar name={k.name} initials={k.initials} color={k.color} size={30} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-medium text-white/85">{firstName(k.name)}</p>
                              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                                <motion.div
                                  className="h-full rounded-full bg-sky"
                                  initial={false}
                                  animate={{ width: `${(done / Math.max(1, ls.length)) * 100}%` }}
                                  transition={{ type: "spring", stiffness: 70, damping: 18 }}
                                />
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-sky tnum">{done}/{ls.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </motion.main>
            ) : isFamily && activeKid ? (
              <motion.main
                key={`kid-${activeKid.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12"
              >
                <div className="space-y-4 lg:col-span-5">
                  <KidHero
                    kid={activeKid}
                    goal={state.goals.find((g) => g.kidId === activeKid.id)}
                    justEarned={earnedFlash}
                    onDeposit={deposit}
                  />
                  <KidSide state={state} kid={activeKid} />
                </div>
                <div className="lg:col-span-4">
                  <TaskList
                    kid={activeKid}
                    tasks={state.tasks.filter((t) => t.kidId === activeKid.id)}
                    busyId={busyTask}
                    onSubmit={submitTask}
                  />
                </div>
                <div className="lg:col-span-3">
                  <LearningPath
                    kid={activeKid}
                    lessons={state.lessons.filter((l) => l.kidId === activeKid.id)}
                    busyId={busyLesson}
                    onComplete={completeLesson}
                  />
                </div>
              </motion.main>
            ) : (
              /* ============================= CIRCLE ============================= */
              <motion.main
                key="circle"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12"
              >
                <div className="space-y-4 lg:col-span-4">
                  <Card padded={false}>
                    <div className="p-5 pb-0 sm:p-6 sm:pb-0">
                      <SectionHead
                        icon={<Users className="size-3.5" />}
                        title="My circle"
                        tone="#C5A0FF"
                        right={<Pill color="#9AA3B2">{state.friends.length} friends</Pill>}
                      />
                    </div>
                    <Orbit
                      scope="circle"
                      me={state.me}
                      kids={state.kids}
                      friends={state.friends}
                      dueByMember={dueByMember}
                      openTasksByKid={openTasksByKid}
                      onSelect={(m) => {
                        const due = dueByMember[m.id] ?? 0;
                        if (due > 0) nudgeFriend(m.id);
                        else pushToast(`${firstName(m.name)} is all squared away`, m.color, <HandCoins className="size-3.5" />);
                      }}
                    />
                    <div className="grid grid-cols-3 divide-x divide-white/6 border-t border-white/6 text-center">
                      {[
                        { l: "owed to you", v: money(state.stats.circle.owedToMe), c: "#C9F158" },
                        { l: "you owe", v: money(state.stats.circle.iOwe), c: "#FF8A6B" },
                        { l: "open splits", v: String(state.stats.circle.openSplits), c: "#C5A0FF" },
                      ].map((s) => (
                        <div key={s.l} className="py-4">
                          <p className="text-sm font-bold tnum" style={{ color: s.c }}>{s.v}</p>
                          <p className="mt-0.5 text-[10px] tracking-[0.14em] text-white/35 uppercase">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <CircleSpendStrip state={state} />
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <CircleHero state={state} onNewSplit={() => setSplitModal(true)} />
                  <DuesPanel
                    state={state}
                    nudgedIds={nudged}
                    settlingIds={settling}
                    onNudge={nudge}
                    onPay={payOwn}
                    onNewSplit={() => setSplitModal(true)}
                  />
                </div>

                <div className="space-y-4 lg:col-span-3">
                  <FriendLedger state={state} onNudgeFriend={nudgeFriend} />
                  <Card padded={false}>
                    <div className="p-5 pb-1 sm:p-6 sm:pb-1">
                      <SectionHead
                        icon={<Receipt className="size-3.5" />}
                        title="Circle ledger"
                        tone="#C5A0FF"
                        right={<span className="text-[11px] text-white/35">splits only</span>}
                      />
                    </div>
                    <div className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <ActivityFeed state={state} scope="circle" empty="No split activity yet." />
                    </div>
                  </Card>
                </div>
              </motion.main>
            )}
          </AnimatePresence>
        )}

        <footer className="mt-14 flex items-center justify-between border-t border-white/6 pt-6 text-[11px] text-white/25">
          <span className="font-display italic text-white/40">sprout</span>
          <span>Two ledgers. One circle. Zero blurred lines.</span>
        </footer>
      </div>

      {/* ------------------------------ bottom nav ----------------------------- */}
      {state && (
        <motion.nav
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 240, damping: 26 }}
          className="fixed bottom-5 left-1/2 z-[65] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/12 bg-[#111419]/92 p-1.5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl"
        >
          <BottomTab
            active={isFamily}
            onClick={() => goTab("family")}
            icon={<Home className="size-4" />}
            label="Family"
            sub={money(state.stats.family.total)}
            badge={state.stats.family.pendingApprovals || undefined}
            tone="#C9F158"
          />

          <button
            onClick={() => (isFamily ? setTaskModal(true) : setSplitModal(true))}
            className="grid size-12 shrink-0 place-items-center rounded-full text-[#121703] transition hover:brightness-110 active:scale-90"
            style={{ background: accent, boxShadow: `0 10px 30px -8px ${accent}cc` }}
            title={isFamily ? "New task" : "New split"}
          >
            {isFamily ? <Plus className="size-5" strokeWidth={2.6} /> : <Split className="size-5" strokeWidth={2.4} />}
          </button>

          <BottomTab
            active={!isFamily}
            onClick={() => goTab("circle")}
            icon={<Users className="size-4" />}
            label="Circle"
            sub={`${state.stats.circle.net >= 0 ? "+" : "−"}${money(Math.abs(state.stats.circle.net))}`}
            badge={state.stats.circle.openSplits || undefined}
            tone="#C5A0FF"
          />
        </motion.nav>
      )}

      {/* -------------------------------- toasts ------------------------------- */}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 26, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="flex items-center gap-2.5 rounded-full border border-white/12 bg-[#14171d]/95 py-2.5 pr-5 pl-3 shadow-2xl backdrop-blur-xl"
            >
              <span className="grid size-6 place-items-center rounded-full" style={{ color: t.tone, background: `${t.tone}1c` }}>
                {t.icon}
              </span>
              <span className="text-[12.5px] font-medium text-white/90">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* -------------------------------- modals ------------------------------- */}
      {state && (
        <>
          <NewTaskModal open={taskModal} onClose={() => setTaskModal(false)} kids={state.kids} onCreate={createTask} />
          <NewSplitModal open={splitModal} onClose={() => setSplitModal(false)} friends={state.friends} onCreate={createSplit} />
        </>
      )}
    </div>
  );
}

/* --------------------------------- tabs ----------------------------------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  tone: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition",
        active ? "text-white" : "text-white/45 hover:text-white/75",
      )}
    >
      {active && (
        <motion.span
          layoutId="tab-pill"
          className="absolute inset-0 rounded-full"
          style={{ background: `${tone}1f`, boxShadow: `inset 0 0 0 1.5px ${tone}59` }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative" style={active ? { color: tone } : undefined}>{icon}</span>
      <span className="relative">{label}</span>
      {badge ? (
        <span
          className="relative grid size-4 place-items-center rounded-full text-[9px] font-bold text-[#0b0d10]"
          style={{ background: tone }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function BottomTab({
  active,
  onClick,
  icon,
  label,
  sub,
  badge,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
  badge?: number;
  tone: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "relative flex items-center gap-2.5 rounded-full py-2 pr-4 pl-3.5 transition",
        active ? "text-white" : "text-white/45 hover:text-white/75",
      )}
    >
      {active && (
        <motion.span
          layoutId="bottom-pill"
          className="absolute inset-0 rounded-full"
          style={{ background: `${tone}1c`, boxShadow: `inset 0 0 0 1.5px ${tone}4d` }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative" style={active ? { color: tone } : undefined}>{icon}</span>
      <span className="relative text-left leading-none">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
          {label}
          {badge ? (
            <span
              className="grid size-3.5 place-items-center rounded-full text-[8px] font-bold text-[#0b0d10]"
              style={{ background: tone }}
            >
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[10px] tnum" style={{ color: active ? tone : "rgba(255,255,255,0.3)" }}>
          {sub}
        </span>
      </span>
    </button>
  );
}

/* ----------------------------- persona button ------------------------------ */

function PersonaButton({
  active,
  onClick,
  initials,
  color,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  initials: string;
  color: string;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "relative flex items-center gap-2 rounded-full px-2.5 py-1.5 pr-4 transition-all duration-300",
        active ? "bg-white/10" : "hover:bg-white/5",
      )}
    >
      {active && (
        <motion.span
          layoutId="persona-glow"
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `inset 0 0 0 1.5px ${color}66` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Avatar name={label} initials={initials} color={color} size={26} />
      <span className="text-left leading-none">
        <span className={cx("block text-[12px] font-semibold", active ? "text-white" : "text-white/65")}>{label}</span>
        <span className="block text-[9px] tracking-[0.14em] text-white/30 uppercase">{sub}</span>
      </span>
    </button>
  );
}
