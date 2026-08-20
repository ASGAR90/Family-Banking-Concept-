"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Plus, Sparkles, Split, Users, BellRing, HandCoins } from "lucide-react";
import type { AppState } from "@/lib/data";
import { cx, firstName, money } from "@/lib/money";
import { PhoneShell } from "./phone";
import { CircleHome, FamilyHome, KidWorld } from "./screens";
import { NewSplitModal, NewTaskModal } from "./modals";

type Task = AppState["tasks"][number];
type Lesson = AppState["lessons"][number];
type SplitT = AppState["splits"][number];
type Tab = "family" | "circle";
type Toast = { id: number; msg: string; tone: string; icon: ReactNode };

export default function WidgetApp({
  start = "family",
  embedded = false,
  instanceId = "app",
}: {
  start?: "family" | "kid" | "circle";
  embedded?: boolean;
  instanceId?: string;
}) {
  const [state, setState] = useState<AppState | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>(start === "circle" ? "circle" : "family");
  const [kidId, setKidId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busyTask, setBusyTask] = useState<number | null>(null);
  const [busyLesson, setBusyLesson] = useState<number | null>(null);
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [settling, setSettling] = useState<Set<string>>(new Set());
  const [taskModal, setTaskModal] = useState(false);
  const [splitModal, setSplitModal] = useState(false);
  const [earnedFlash, setEarnedFlash] = useState(false);
  const toastId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!state || start !== "kid") return;
    setKidId((id) => id ?? state.kids[0]?.id ?? null);
  }, [state, start]);

  const pushToast = useCallback((msg: string, tone = "#C9F158", icon?: ReactNode) => {
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

  const submitTask = async (t: Task) => {
    setBusyTask(t.id);
    await new Promise((r) => setTimeout(r, 620));
    await mutate(`/api/tasks/${t.id}`, { action: "submit" }, "PATCH");
    setBusyTask(null);
    pushToast(
      `Sent to Maya — ${money(t.rewardCents, { exact: true })} pending approval`,
      "#FFC357",
      <BellRing className="size-3.5" />,
    );
  };

  const approveTask = async (t: Task) => {
    const kid = state?.kids.find((k) => k.id === t.kidId);
    await mutate(`/api/tasks/${t.id}`, { action: "approve" }, "PATCH");
    pushToast(
      `Paid ${kid ? firstName(kid.name) : "kid"} ${money(t.rewardCents, { exact: true })}`,
      "#C9F158",
      <HandCoins className="size-3.5" />,
    );
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
    pushToast(
      `Lesson done — +${money(l.rewardCents, { exact: true })}`,
      "#7CC7FF",
      <Sparkles className="size-3.5" />,
    );
  };

  const deposit = async (goalId: number, amountCents: number) => {
    if (!kidId) return;
    try {
      const s = await mutate(`/api/goals/${goalId}`, { kidId, amountCents });
      const g = s.goals.find((x) => x.id === goalId);
      pushToast(`${money(amountCents, { exact: true })} tucked into “${g?.title}”`, "#8CE8C7");
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
    pushToast(
      `Nudged ${member ? firstName(member.name) : "friend"} — ${money(split.shareCents, { exact: true })} due`,
      "#C5A0FF",
      <BellRing className="size-3.5" />,
    );
    setTimeout(() => setSettling((s) => new Set(s).add(key)), 900 + Math.random() * 700);
    setTimeout(async () => {
      try {
        await mutate(`/api/splits/${split.id}`, { action: "settle", memberId });
        setSettling((s) => {
          const n = new Set(s);
          n.delete(key);
          return n;
        });
        pushToast(
          `+${money(split.shareCents, { exact: true })} from ${member ? firstName(member.name) : "friend"}`,
          "#C9F158",
          <HandCoins className="size-3.5" />,
        );
      } catch {
        /* settled elsewhere */
      }
    }, 2400 + Math.random() * 1200);
  };

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
    pushToast(
      `Paid ${firstName(split.payer.name)} ${money(split.shareCents, { exact: true })}`,
      "#8CE8C7",
      <HandCoins className="size-3.5" />,
    );
  };

  const createTask = async (p: { kidId: number; title: string; rewardCents: number; category: string }) => {
    await mutate("/api/tasks", p);
    const kid = state?.kids.find((k) => k.id === p.kidId);
    pushToast(`Task planted for ${kid ? firstName(kid.name) : "kid"} · ${money(p.rewardCents, { exact: true })}`);
  };

  const createSplit = async (p: { title: string; merchant: string; totalCents: number; participantIds: number[] }) => {
    await mutate("/api/splits", p);
    pushToast(`Requests sent — ${p.participantIds.length} friends owe their share`, "#C5A0FF", <HandCoins className="size-3.5" />);
  };

  const goTab = (t: Tab) => {
    setTab(t);
    setKidId(null);
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openKid = (id: number) => {
    setKidId(id);
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isFamily = tab === "family";
  const accent = isFamily ? "#C9F158" : "#C5A0FF";
  const activeKid = useMemo(
    () => (kidId ? state?.kids.find((k) => k.id === kidId) : undefined),
    [kidId, state],
  );

  return (
    <PhoneShell
      accent={accent}
      embedded={embedded}
      label={
        start === "circle"
          ? "Circle · friends"
          : start === "kid"
            ? "Kid · Leo"
            : "Family · Maya"
      }
      overlay={
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-[108px] z-[70] flex flex-col items-center gap-2 px-4">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 18, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="pointer-events-none flex max-w-full items-center gap-2.5 rounded-full border border-white/12 bg-[#14171d]/95 py-2.5 pr-4 pl-3 shadow-2xl backdrop-blur-xl"
                >
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-full"
                    style={{ color: t.tone, background: `${t.tone}1c` }}
                  >
                    {t.icon}
                  </span>
                  <span className="text-[12px] font-medium text-white/90">{t.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {state && (
            <>
              <NewTaskModal
                open={taskModal}
                onClose={() => setTaskModal(false)}
                kids={state.kids}
                preselectKidId={kidId ?? undefined}
                onCreate={createTask}
              />
              <NewSplitModal
                open={splitModal}
                onClose={() => setSplitModal(false)}
                friends={state.friends}
                onCreate={createSplit}
              />
            </>
          )}
        </>
      }
    >
      <div
        ref={scroller}
        className="absolute inset-0 overflow-y-auto pt-[54px] pb-[118px] slim-scroll"
      >
        {failed && (
          <div className="px-5 pt-10 text-center">
            <p className="text-sm text-white/60">Couldn&apos;t reach the family bank.</p>
            <button
              onClick={() => load()}
              className="mt-3 rounded-full bg-sprout px-5 py-2 text-xs font-bold text-[#121703]"
            >
              Retry
            </button>
          </div>
        )}

        {!state && !failed && (
          <div className="space-y-3 px-5 pt-4">
            <div className="shimmer h-11 rounded-full bg-white/4" />
            <div className="shimmer h-[210px] rounded-[28px] bg-white/4" />
            <div className="shimmer h-[160px] rounded-[26px] bg-white/4" />
            <div className="shimmer h-[160px] rounded-[26px] bg-white/4" />
          </div>
        )}

        {state && (
          <AnimatePresence mode="wait">
            {isFamily && activeKid ? (
              <motion.div
                key={`kid-${activeKid.id}`}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <KidWorld
                  state={state}
                  kid={activeKid}
                  busyTask={busyTask}
                  busyLesson={busyLesson}
                  earnedFlash={earnedFlash}
                  onBack={() => setKidId(null)}
                  onSubmit={submitTask}
                  onComplete={completeLesson}
                  onDeposit={deposit}
                />
              </motion.div>
            ) : isFamily ? (
              <motion.div
                key="family"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <FamilyHome
                  state={state}
                  onOpenKid={(k) => openKid(k.id)}
                  onAddTask={() => setTaskModal(true)}
                  onApprove={approveTask}
                  onDecline={declineTask}
                />
              </motion.div>
            ) : (
              <motion.div
                key="circle"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <CircleHome
                  state={state}
                  nudged={nudged}
                  settling={settling}
                  onNudge={nudge}
                  onNudgeFriend={nudgeFriend}
                  onPay={payOwn}
                  onNewSplit={() => setSplitModal(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {state && (
        <nav className="absolute inset-x-0 bottom-0 z-40 px-3 pb-[18px]">
          <div className="flex items-center gap-1 rounded-full border border-white/12 bg-[#111419]/92 p-1.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <TabItem
              layoutId={`${instanceId}-tab`}
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
              className="grid size-[52px] shrink-0 place-items-center rounded-full text-[#121703] transition hover:brightness-110 active:scale-90"
              style={{ background: accent, boxShadow: `0 10px 28px -8px ${accent}cc` }}
              title={isFamily ? "New task" : "New split"}
            >
              {isFamily ? <Plus className="size-5" strokeWidth={2.6} /> : <Split className="size-5" strokeWidth={2.4} />}
            </button>
            <TabItem
              layoutId={`${instanceId}-tab`}
              active={!isFamily}
              onClick={() => goTab("circle")}
              icon={<Users className="size-4" />}
              label="Circle"
              sub={`${state.stats.circle.net >= 0 ? "+" : "−"}${money(Math.abs(state.stats.circle.net))}`}
              badge={state.stats.circle.openSplits || undefined}
              tone="#C5A0FF"
            />
          </div>
        </nav>
      )}
    </PhoneShell>
  );
}

function TabItem({
  active,
  onClick,
  icon,
  label,
  sub,
  badge,
  tone,
  layoutId,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  sub: string;
  badge?: number;
  tone: string;
  layoutId: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "relative flex min-w-0 flex-1 items-center gap-2 rounded-full py-2 pr-3 pl-3 transition",
        active ? "text-white" : "text-white/40",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-full"
          style={{ background: `${tone}1c`, boxShadow: `inset 0 0 0 1.5px ${tone}4d` }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative" style={active ? { color: tone } : undefined}>
        {icon}
      </span>
      <span className="relative min-w-0 text-left leading-none">
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
        <span className="mt-1 block truncate text-[10px] tnum" style={{ color: active ? tone : "rgba(255,255,255,0.3)" }}>
          {sub}
        </span>
      </span>
    </button>
  );
}
