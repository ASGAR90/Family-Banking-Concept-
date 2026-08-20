import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeeded } from "@/db/seed";
import {
  members,
  tasks,
  goals,
  lessons,
  splits,
  splitParticipants,
  transactions,
} from "@/db/schema";

const PARENT_ID = 1;

export type AppState = Awaited<ReturnType<typeof buildState>>;

export async function buildState() {
  await ensureSeeded();

  const [
    allMembers,
    allTasks,
    allGoals,
    allLessons,
    allSplits,
    allParticipants,
    allTxns,
  ] = await Promise.all([
    db.select().from(members),
    db.select().from(tasks).orderBy(desc(tasks.createdAt)),
    db.select().from(goals).orderBy(asc(goals.id)),
    db.select().from(lessons).orderBy(asc(lessons.sort)),
    db.select().from(splits).orderBy(desc(splits.createdAt)),
    db.select().from(splitParticipants),
    db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(40),
  ]);

  const byId = new Map(allMembers.map((m) => [m.id, m]));
  const me = byId.get(PARENT_ID) ?? allMembers.find((m) => m.role === "parent");
  if (!me) throw new Error("seed unavailable — retrying will reseed");
  const kids = allMembers.filter((m) => m.role === "kid");
  const friends = allMembers.filter((m) => m.role === "friend");

  const shapedSplits = allSplits.map((s) => ({
    ...s,
    payer: byId.get(s.payerId)!,
    participants: allParticipants
      .filter((p) => p.splitId === s.id)
      .map((p) => ({
        ...p,
        member: byId.get(p.memberId)!,
      })),
  }));

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const kidIds = new Set(kids.map((k) => k.id));

  /* ============================ FAMILY LEDGER ============================ */
  // Everything the kids earn, save and learn. Never mixes with friend money.

  const earnedThisWeek = allTxns
    .filter(
      (t) =>
        kidIds.has(t.memberId) &&
        (t.kind === "task_pay" || t.kind === "lesson_reward") &&
        new Date(t.createdAt).getTime() > weekAgo,
    )
    .reduce((a, t) => a + t.amountCents, 0);

  const pendingApprovals = allTasks.filter((t) => t.status === "pending").length;
  const openTasks = allTasks.filter(
    (t) => t.status === "open" || t.status === "declined",
  ).length;
  const lessonsDone = allLessons.filter((l) => l.status === "done").length;

  const savedTotal = allGoals.reduce((a, g) => a + g.savedCents, 0);
  const goalsTotal = allGoals.reduce((a, g) => a + g.targetCents, 0);
  const kidsBalance = kids.reduce((a, k) => a + k.balanceCents, 0);

  /* ============================ CIRCLE LEDGER ============================ */
  // Only friend-to-friend split money. Completely separate from the family pot.

  const owedToMe = shapedSplits
    .filter((s) => s.payerId === me.id)
    .flatMap((s) => s.participants)
    .filter((p) => p.status === "pending")
    .reduce((a, p) => a + p.shareCents, 0);

  const iOwe = shapedSplits
    .filter((s) => s.payerId !== me.id)
    .flatMap((s) => s.participants)
    .filter((p) => p.memberId === me.id && p.status === "pending")
    .reduce((a, p) => a + p.shareCents, 0);

  const openSplits = shapedSplits.filter((s) =>
    s.participants.some((p) => p.status === "pending"),
  ).length;

  const settledVolume = shapedSplits
    .flatMap((s) => s.participants)
    .filter((p) => p.status === "paid")
    .reduce((a, p) => a + p.shareCents, 0);

  /** Per-friend net position: + means they owe me, − means I owe them. */
  const friendLedger: Record<number, { owesMe: number; iOwe: number; net: number }> = {};
  for (const f of friends) friendLedger[f.id] = { owesMe: 0, iOwe: 0, net: 0 };
  for (const s of shapedSplits) {
    for (const p of s.participants) {
      if (s.payerId === me.id && p.memberId !== me.id && p.status === "pending") {
        const row = friendLedger[p.memberId];
        if (row) row.owesMe += p.shareCents;
      }
      if (s.payerId !== me.id && p.memberId === me.id && p.status === "pending") {
        const row = friendLedger[s.payerId];
        if (row) row.iOwe += p.shareCents;
      }
    }
  }
  for (const id of Object.keys(friendLedger)) {
    const row = friendLedger[Number(id)];
    row.net = row.owesMe - row.iOwe;
  }

  return {
    me,
    kids,
    friends,
    tasks: allTasks,
    goals: allGoals,
    lessons: allLessons,
    splits: shapedSplits,
    txns: allTxns,
    friendLedger,
    stats: {
      family: {
        kidsBalance,
        savedTotal,
        goalsTotal,
        earnedThisWeek,
        pendingApprovals,
        openTasks,
        lessonsDone,
        total: kidsBalance + savedTotal,
      },
      circle: {
        owedToMe,
        iOwe,
        net: owedToMe - iOwe,
        openSplits,
        settledVolume,
      },
    },
  };
}
