import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { goals, members, transactions } from "@/db/schema";
import { buildState } from "@/lib/data";

/** Kid moves money from spendable balance into a savings goal. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const goalId = Number(id);
  const body = await req.json();
  const kidId = Number(body.kidId);
  const amountCents = Math.max(25, Math.round(Number(body.amountCents) || 0));

  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!goal || goal.kidId !== kidId) {
    return NextResponse.json({ ok: false, error: "goal not found" }, { status: 404 });
  }

  const [kid] = await db.select().from(members).where(eq(members.id, kidId)).limit(1);
  if (!kid) return NextResponse.json({ ok: false, error: "kid not found" }, { status: 404 });

  const remaining = goal.targetCents - goal.savedCents;
  const applied = Math.min(amountCents, kid.balanceCents, remaining);
  if (applied <= 0) {
    return NextResponse.json(
      { ok: false, error: "nothing to move — check balance or goal" },
      { status: 400 },
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(goals)
      .set({ savedCents: goal.savedCents + applied })
      .where(eq(goals.id, goalId));
    await tx
      .update(members)
      .set({ balanceCents: kid.balanceCents - applied })
      .where(eq(members.id, kidId));
    await tx.insert(transactions).values({
      memberId: kidId,
      kind: "goal_deposit",
      title: `Saved toward “${goal.title}”`,
      amountCents: -applied,
      counterparty: goal.title,
    });
  });

  const state = await buildState();
  return NextResponse.json({ ok: true, state });
}
