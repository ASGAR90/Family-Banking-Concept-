import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/* ---------------------------------- enums --------------------------------- */

export const memberRole = pgEnum("member_role", ["parent", "kid", "friend"]);

export const taskStatus = pgEnum("task_status", [
  "open", // kid can do it
  "pending", // kid submitted — waiting for parent approval
  "approved", // parent approved & paid
  "declined", // parent sent back for a redo
]);

export const lessonStatus = pgEnum("lesson_status", [
  "locked",
  "open",
  "done",
]);

export const participantStatus = pgEnum("participant_status", [
  "pending",
  "paid",
]);

export const txnKind = pgEnum("txn_kind", [
  "task_pay", // parent -> kid for a chore
  "lesson_reward", // parent -> kid for finishing a lesson
  "goal_deposit", // kid -> own savings goal
  "split_in", // friend -> me (share received)
  "split_out", // me -> friend (share paid)
  "allowance",
]);

/* --------------------------------- tables --------------------------------- */

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  initials: varchar("initials", { length: 4 }).notNull(),
  role: memberRole("role").notNull(),
  color: varchar("color", { length: 12 }).notNull().default("#C9F158"),
  /** spendable balance in cents */
  balanceCents: integer("balance_cents").notNull().default(0),
  /** kids only — daily money-habit streak */
  streakDays: integer("streak_days").notNull().default(0),
  tagline: varchar("tagline", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    kidId: integer("kid_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 140 }).notNull(),
    category: varchar("category", { length: 32 }).notNull().default("chore"),
    rewardCents: integer("reward_cents").notNull().default(100),
    status: taskStatus("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("tasks_kid_idx").on(t.kidId)],
);

export const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    kidId: integer("kid_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    icon: varchar("icon", { length: 40 }).notNull().default("target"),
    targetCents: integer("target_cents").notNull(),
    savedCents: integer("saved_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("goals_kid_idx").on(t.kidId)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    kidId: integer("kid_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 140 }).notNull(),
    category: varchar("category", { length: 40 }).notNull().default("basics"),
    minutes: integer("minutes").notNull().default(5),
    rewardCents: integer("reward_cents").notNull().default(150),
    status: lessonStatus("status").notNull().default("locked"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("lessons_kid_idx").on(t.kidId)],
);

export const splits = pgTable("splits", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 140 }).notNull(),
  merchant: varchar("merchant", { length: 80 }),
  payerId: integer("payer_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  totalCents: integer("total_cents").notNull(),
  shareCents: integer("share_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const splitParticipants = pgTable(
  "split_participants",
  {
    id: serial("id").primaryKey(),
    splitId: integer("split_id")
      .notNull()
      .references(() => splits.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    shareCents: integer("share_cents").notNull(),
    status: participantStatus("status").notNull().default("pending"),
    nudges: integer("nudges").notNull().default(0),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("split_participants_split_idx").on(t.splitId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    kind: txnKind("kind").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    /** signed amount in cents — positive = money in */
    amountCents: integer("amount_cents").notNull(),
    counterparty: text("counterparty"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("txn_member_idx").on(t.memberId)],
);
