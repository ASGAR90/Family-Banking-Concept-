"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, HandCoins, Plus, Split, X } from "lucide-react";
import type { AppState } from "@/lib/data";
import { cx, firstName, money } from "@/lib/money";
import { Avatar } from "./kit";

/* --------------------------------- shell ---------------------------------- */

function ModalShell({
  open,
  onClose,
  eyebrow,
  title,
  tone,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  tone: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#10131a] shadow-2xl"
          >
            <div
              className="pointer-events-none absolute -top-20 left-1/2 h-40 w-[120%] -translate-x-1/2 opacity-25 blur-3xl"
              style={{ background: `radial-gradient(ellipse, ${tone}, transparent 70%)` }}
            />
            <div className="relative p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase"
                    style={{ color: tone, background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}30` }}
                  >
                    {icon} {eyebrow}
                  </span>
                  <h3 className="font-display mt-3 text-2xl font-light italic text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="grid size-8 place-items-center rounded-full border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------- new task --------------------------------- */

const TASK_PRESETS = [
  { title: "Tidy your room", cat: "chore", reward: 100 },
  { title: "Instrument practice — 20 min", cat: "learning", reward: 200 },
  { title: "Help with the dishes", cat: "chore", reward: 100 },
  { title: "One act of kindness", cat: "kindness", reward: 50 },
];

export function NewTaskModal({
  open,
  onClose,
  kids,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  kids: AppState["kids"];
  onCreate: (payload: {
    kidId: number;
    title: string;
    rewardCents: number;
    category: string;
  }) => Promise<void>;
}) {
  const [kidId, setKidId] = useState<number>(kids[0]?.id ?? 0);
  const [title, setTitle] = useState(TASK_PRESETS[0].title);
  const [category, setCategory] = useState(TASK_PRESETS[0].cat);
  const [reward, setReward] = useState(TASK_PRESETS[0].reward);
  const [busy, setBusy] = useState(false);

  // reset the form each time the sheet is opened, during render (no effect)
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setKidId(kids[0]?.id ?? 0);
      setBusy(false);
    }
  }

  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    await onCreate({ kidId, title: title.trim(), rewardCents: reward, category });
    setBusy(false);
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      eyebrow="Earning"
      title="Plant a task."
      tone="#C9F158"
      icon={<Plus className="size-3" />}
    >
      <p className="mb-2 text-[11px] font-semibold tracking-[0.13em] text-white/40 uppercase">Who</p>
      <div className="mb-5 flex gap-2">
        {kids.map((k) => (
          <button
            key={k.id}
            onClick={() => setKidId(k.id)}
            className={cx(
              "flex items-center gap-2 rounded-full border px-2 py-1.5 pr-3.5 transition",
              kidId === k.id
                ? "border-sprout/50 bg-sprout/10"
                : "border-white/10 bg-white/3 hover:bg-white/6",
            )}
          >
            <Avatar name={k.name} initials={k.initials} color={k.color} size={24} />
            <span className="text-xs font-semibold text-white/85">{firstName(k.name)}</span>
            {kidId === k.id && <Check className="size-3 text-sprout" strokeWidth={3} />}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] font-semibold tracking-[0.13em] text-white/40 uppercase">The task</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Water the plants"
        className="mb-2.5 w-full rounded-xl border border-white/10 bg-sunk px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-sprout/50"
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TASK_PRESETS.map((p) => (
          <button
            key={p.title}
            onClick={() => {
              setTitle(p.title);
              setCategory(p.cat);
              setReward(p.reward);
            }}
            className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            {p.title}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] font-semibold tracking-[0.13em] text-white/40 uppercase">Reward</p>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {[50, 100, 200, 300, 500].map((r) => (
          <button
            key={r}
            onClick={() => setReward(r)}
            className={cx(
              "rounded-full px-3.5 py-2 text-[13px] font-bold transition tnum",
              reward === r
                ? "bg-sprout text-[#121703]"
                : "border border-white/10 bg-white/4 text-white/60 hover:bg-white/8",
            )}
          >
            {money(r)}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={busy || !title.trim()}
        className="w-full rounded-2xl bg-sprout py-3 text-sm font-bold text-[#121703] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? "Assigning…" : `Assign · worth ${money(reward, { exact: true })}`}
      </button>
    </ModalShell>
  );
}

/* -------------------------------- new split -------------------------------- */

export function NewSplitModal({
  open,
  onClose,
  friends,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  friends: AppState["friends"];
  onCreate: (payload: {
    title: string;
    merchant: string;
    totalCents: number;
    participantIds: number[];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [total, setTotal] = useState("60");
  const [sel, setSel] = useState<number[]>(() => friends.map((f) => f.id));
  const [busy, setBusy] = useState(false);

  // reset the crew selection each time the sheet is opened, during render
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setSel(friends.map((f) => f.id));
      setBusy(false);
    }
  }

  const totalCents = Math.round(parseFloat(total || "0") * 100);
  const heads = sel.length + 1;
  const share = sel.length > 0 && totalCents > 0 ? Math.ceil(totalCents / heads) : 0;

  const toggle = (id: number) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    if (!title.trim() || sel.length === 0 || totalCents < 100 || busy) return;
    setBusy(true);
    await onCreate({ title: title.trim(), merchant: merchant.trim(), totalCents, participantIds: sel });
    setBusy(false);
    setTitle("");
    setMerchant("");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      eyebrow="Group bill"
      title="Split it fairly."
      tone="#C5A0FF"
      icon={<Split className="size-3" />}
    >
      <p className="mb-2 text-[11px] font-semibold tracking-[0.13em] text-white/40 uppercase">What did you cover?</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Dinner after the game…"
        className="mb-2.5 w-full rounded-xl border border-white/10 bg-sunk px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-lilac/50"
      />
      <div className="mb-5 flex gap-2">
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Place (optional)"
          className="w-1/2 rounded-xl border border-white/10 bg-sunk px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-lilac/50"
        />
        <div className="relative w-1/2">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
          <input
            value={total}
            onChange={(e) => setTotal(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="0.00"
            className="w-full rounded-xl border border-white/10 bg-sunk py-2.5 pl-7 pr-3.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-lilac/50 tnum"
          />
        </div>
      </div>

      <p className="mb-2 text-[11px] font-semibold tracking-[0.13em] text-white/40 uppercase">Who was there?</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {friends.map((f) => {
          const on = sel.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              className={cx(
                "flex items-center gap-2 rounded-full border px-2 py-1.5 pr-3.5 transition",
                on ? "border-lilac/50 bg-lilac/10" : "border-white/10 bg-white/3 opacity-60 hover:opacity-100",
              )}
            >
              <Avatar name={f.name} initials={f.initials} color={f.color} size={24} />
              <span className="text-xs font-semibold text-white/85">{firstName(f.name)}</span>
              {on && <Check className="size-3 text-lilac" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex items-center justify-between rounded-2xl border border-lilac/20 bg-lilac/6 px-4 py-3">
        <span className="flex items-center gap-2 text-xs text-white/60">
          <HandCoins className="size-4 text-lilac" />
          Split {heads} ways
        </span>
        <span className="font-display text-xl text-white tnum">
          {share > 0 ? `${money(share, { exact: true })} each` : "—"}
        </span>
      </div>

      <button
        onClick={submit}
        disabled={busy || sel.length === 0 || !title.trim() || totalCents < 100}
        className="w-full rounded-2xl bg-lilac py-3 text-sm font-bold text-[#160a2e] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? "Sending requests…" : `Request ${share > 0 ? money(share, { exact: true }) : ""} from ${sel.length} ${sel.length === 1 ? "friend" : "friends"}`}
      </button>
    </ModalShell>
  );
}
