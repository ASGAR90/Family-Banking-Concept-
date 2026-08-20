import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, splitParticipants, splits, transactions } from "@/db/schema";
import { buildState } from "@/lib/data";

/**
 * action = "nudge": remind a friend (they often pay right after 😉)
 * action = "settle": friend paid their share to the payer
 * action = "pay": I (parent) pay my share of someone else's split
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const splitId = Number(id);
  const body = await req.json();
  const action = String(body.action);
  const memberId = Number(body.memberId);

  const [split] = await db.select().from(splits).where(eq(splits.id, splitId)).limit(1);
  if (!split) return NextResponse.json({ ok: false, error: "split not found" }, { status: 404 });

  const [row] = await db
    .select()
    .from(splitParticipants)
    .where(
      and(
        eq(splitParticipants.splitId, splitId),
        eq(splitParticipants.memberId, memberId),
      ),
    )
    .limit(1);
  if (!row)
    return NextResponse.json({ ok: false, error: "participant not found" }, { status: 404 });

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  const [payer] = await db.select().from(members).where(eq(members.id, split.payerId)).limit(1);

  if (action === "nudge") {
    if (row.status !== "pending")
      return NextResponse.json({ ok: false, error: "already paid" }, { status: 400 });
    await db
      .update(splitParticipants)
      .set({ nudges: row.nudges + 1 })
      .where(eq(splitParticipants.id, row.id));
  } else if (action === "settle") {
    if (row.status !== "pending")
      return NextResponse.json({ ok: false, error: "already paid" }, { status: 400 });
    await db.transaction(async (tx) => {
      await tx
        .update(splitParticipants)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(splitParticipants.id, row.id));
      await tx.insert(transactions).values({
        memberId: split.payerId,
        kind: "split_in",
        title: `${member.name.split(" ")[0]} paid their share — ${split.title}`,
        amountCents: row.shareCents,
        counterparty: member.name.split(" ")[0],
      });
    });
  } else if (action === "pay") {
    if (row.status !== "pending")
      return NextResponse.json({ ok: false, error: "already paid" }, { status: 400 });
    await db.transaction(async (tx) => {
      await tx
        .update(splitParticipants)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(splitParticipants.id, row.id));
      await tx.insert(transactions).values({
        memberId,
        kind: "split_out",
        title: `You paid ${payer.name.split(" ")[0]} — ${split.title}`,
        amountCents: -row.shareCents,
        counterparty: payer.name.split(" ")[0],
      });
    });
  } else {
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  }

  const state = await buildState();
  return NextResponse.json({ ok: true, state });
}
