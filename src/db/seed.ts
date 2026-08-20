import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import {
  members,
  tasks,
  goals,
  lessons,
  splits,
  splitParticipants,
  transactions,
} from "@/db/schema";

const ago = (days: number, hour = 18) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 40) + 5, 0, 0);
  return d;
};

let seeding: Promise<void> | null = null;

/** Idempotent demo-data loader. Re-checks every call; safe to call anywhere. */
export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = seedDatabase().finally(() => {
      seeding = null;
    });
  }
  return seeding;
}

async function seedDatabase(): Promise<void> {
  await ensureSchema();
  const any = await db.select({ id: members.id }).from(members).limit(1);
  if (any.length > 0) return;

    /* ------------------------------- members ------------------------------ */
    await db.insert(members).values([
      // parents
      { id: 1, name: "Maya Chen", initials: "MC", role: "parent", color: "#C9F158", balanceCents: 0, tagline: "Head of the household bank" },
      // kids
      { id: 2, name: "Leo Chen", initials: "LE", role: "kid", color: "#FFC357", balanceCents: 4820, streakDays: 6, tagline: "Age 12 · The Saver" },
      { id: 3, name: "Zoe Chen", initials: "ZO", role: "kid", color: "#FF9BD2", balanceCents: 3150, streakDays: 4, tagline: "Age 9 · The Artist" },
      // friends
      { id: 4, name: "Dev Patel", initials: "DP", role: "friend", color: "#8CE8C7", balanceCents: 0, tagline: "College roommate" },
      { id: 5, name: "Arjun Rao", initials: "AR", role: "friend", color: "#C5A0FF", balanceCents: 0, tagline: "Badminton buddy" },
      { id: 6, name: "Nina Flores", initials: "NF", role: "friend", color: "#7CC7FF", balanceCents: 0, tagline: "Book-club crew" },
      { id: 7, name: "Sofia Marchetti", initials: "SM", role: "friend", color: "#FF8A6B", balanceCents: 0, tagline: "Weekend hiker" },
    ]);

    /* -------------------------------- tasks ------------------------------- */
    await db.insert(tasks).values([
      // Leo
      { kidId: 2, title: "Make your bed & open the blinds", category: "chore", rewardCents: 100, status: "open", createdAt: ago(0) },
      { kidId: 2, title: "Math practice — 30 focused mins", category: "learning", rewardCents: 300, status: "open", createdAt: ago(0) },
      { kidId: 2, title: "Walk Biscuit around the block", category: "chore", rewardCents: 150, status: "pending", createdAt: ago(0) },
      { kidId: 2, title: "Clean out the garage with Dad", category: "chore", rewardCents: 500, status: "approved", createdAt: ago(2), resolvedAt: ago(1) },
      { kidId: 2, title: "Mow the front lawn", category: "chore", rewardCents: 600, status: "approved", createdAt: ago(9), resolvedAt: ago(8) },
      // Zoe
      { kidId: 3, title: "Read out loud for 20 minutes", category: "learning", rewardCents: 100, status: "open", createdAt: ago(0) },
      { kidId: 3, title: "Feed Pepper & refill her water", category: "chore", rewardCents: 75, status: "pending", createdAt: ago(0) },
      { kidId: 3, title: "Set the table for dinner", category: "chore", rewardCents: 100, status: "approved", createdAt: ago(2), resolvedAt: ago(1) },
      { kidId: 3, title: "Sort the recycling", category: "chore", rewardCents: 125, status: "approved", createdAt: ago(6), resolvedAt: ago(5) },
    ]);

    /* -------------------------------- goals ------------------------------- */
    await db.insert(goals).values([
      { kidId: 2, title: "BMX street bike", icon: "bike", targetCents: 32000, savedCents: 18050, createdAt: ago(30) },
      { kidId: 3, title: "Watercolor art set", icon: "palette", targetCents: 6000, savedCents: 4125, createdAt: ago(21) },
    ]);

    /* -------------------------------- lessons ------------------------------ */
    await db.insert(lessons).values([
      { kidId: 2, title: "Needs vs. wants", category: "basics", minutes: 4, rewardCents: 200, status: "done", sort: 1 },
      { kidId: 2, title: "What is interest, anyway?", category: "saving", minutes: 6, rewardCents: 250, status: "open", sort: 2 },
      { kidId: 2, title: "The 3-jar budget", category: "budgeting", minutes: 5, rewardCents: 250, status: "locked", sort: 3 },
      { kidId: 2, title: "Compound growth, visualized", category: "saving", minutes: 7, rewardCents: 300, status: "locked", sort: 4 },
      { kidId: 3, title: "Coins & counting", category: "basics", minutes: 3, rewardCents: 100, status: "done", sort: 1 },
      { kidId: 3, title: "Save · Spend · Share", category: "saving", minutes: 4, rewardCents: 150, status: "open", sort: 2 },
      { kidId: 3, title: "How kids earn money", category: "earning", minutes: 5, rewardCents: 150, status: "locked", sort: 3 },
    ]);

    /* -------------------------------- splits ------------------------------- */
    await db.insert(splits).values([
      { id: 1, title: "Dinner after the game", merchant: "Olive & Thyme", payerId: 1, totalCents: 14000, shareCents: 2800, createdAt: ago(0, 21) },
      { id: 2, title: "Movie night — tickets & popcorn", merchant: "Galaxy Cinemas", payerId: 1, totalCents: 6500, shareCents: 1300, createdAt: ago(3, 20) },
      { id: 3, title: "Fuel & snacks for the road trip", merchant: "Shell", payerId: 4, totalCents: 6000, shareCents: 1200, createdAt: ago(4, 12) },
    ]);

    await db.insert(splitParticipants).values([
      // dinner — two settled, two still due
      { splitId: 1, memberId: 4, shareCents: 2800, status: "paid", paidAt: ago(0, 22) },
      { splitId: 1, memberId: 5, shareCents: 2800, status: "pending" },
      { splitId: 1, memberId: 6, shareCents: 2800, status: "paid", paidAt: ago(0, 23) },
      { splitId: 1, memberId: 7, shareCents: 2800, status: "pending" },
      // movie night — fully settled
      { splitId: 2, memberId: 4, shareCents: 1300, status: "paid", paidAt: ago(3, 21) },
      { splitId: 2, memberId: 5, shareCents: 1300, status: "paid", paidAt: ago(3, 22) },
      { splitId: 2, memberId: 6, shareCents: 1300, status: "paid", paidAt: ago(2, 9) },
      { splitId: 2, memberId: 7, shareCents: 1300, status: "paid", paidAt: ago(2, 10) },
      // road trip — Maya owes Dev
      { splitId: 3, memberId: 1, shareCents: 1200, status: "pending" },
      { splitId: 3, memberId: 5, shareCents: 1200, status: "paid", paidAt: ago(3, 18) },
      { splitId: 3, memberId: 6, shareCents: 1200, status: "paid", paidAt: ago(4, 18) },
      { splitId: 3, memberId: 7, shareCents: 1200, status: "paid", paidAt: ago(3, 19) },
    ]);

    /* ------------------------------ transactions --------------------------- */
    await db.insert(transactions).values([
      { memberId: 2, kind: "task_pay", title: "Chore paid — Mow the front lawn", amountCents: 600, counterparty: "Maya", createdAt: ago(8) },
      { memberId: 3, kind: "task_pay", title: "Chore paid — Sort the recycling", amountCents: 125, counterparty: "Maya", createdAt: ago(5) },
      { memberId: 3, kind: "lesson_reward", title: "Lesson done — Coins & counting", amountCents: 100, counterparty: "Sprout", createdAt: ago(4) },
      { memberId: 2, kind: "lesson_reward", title: "Lesson done — Needs vs. wants", amountCents: 200, counterparty: "Sprout", createdAt: ago(4) },
      { memberId: 1, kind: "split_out", title: "You owe Dev — road trip fuel", amountCents: -1200, counterparty: "Dev", createdAt: ago(4, 12) },
      { memberId: 1, kind: "split_in", title: "Split request sent — movie night", amountCents: 1300, counterparty: "4 friends", createdAt: ago(3, 20) },
      { memberId: 1, kind: "split_in", title: "Dev paid his share — movie night", amountCents: 1300, counterparty: "Dev", createdAt: ago(3, 21) },
      { memberId: 1, kind: "split_in", title: "Nina paid her share — movie night", amountCents: 1300, counterparty: "Nina", createdAt: ago(2, 9) },
      { memberId: 2, kind: "goal_deposit", title: "Moved to BMX bike savings", amountCents: -2000, counterparty: "BMX street bike", createdAt: ago(2) },
      { memberId: 1, kind: "allowance", title: "Weekly auto-allowance sent", amountCents: -2000, counterparty: "Leo & Zoe", createdAt: ago(2, 8) },
      { memberId: 2, kind: "task_pay", title: "Chore paid — Clean out the garage", amountCents: 500, counterparty: "Maya", createdAt: ago(1) },
      { memberId: 3, kind: "task_pay", title: "Chore paid — Set the table", amountCents: 100, counterparty: "Maya", createdAt: ago(1) },
      { memberId: 1, kind: "split_in", title: "Dev paid his share — dinner", amountCents: 2800, counterparty: "Dev", createdAt: ago(0, 22) },
      { memberId: 1, kind: "split_in", title: "Nina paid her share — dinner", amountCents: 2800, counterparty: "Nina", createdAt: ago(0, 23) },
    ]);

    // keep sequences ahead of the explicit seed ids
    await db.execute(sql`SELECT setval('members_id_seq', (SELECT MAX(id) FROM members))`);
    await db.execute(sql`SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks))`);
    await db.execute(sql`SELECT setval('goals_id_seq', (SELECT MAX(id) FROM goals))`);
    await db.execute(sql`SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons))`);
    await db.execute(sql`SELECT setval('splits_id_seq', (SELECT MAX(id) FROM splits))`);
    await db.execute(sql`SELECT setval('split_participants_id_seq', (SELECT MAX(id) FROM split_participants))`);
    await db.execute(sql`SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions))`);
}
