import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, tasks, transactions } from "@/db/schema";
import { buildState } from "@/lib/data";

/** Life-cycle: kid submits → parent approves (pays) or declines (sends back). */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  const { action } = await req.json();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  if (action === "submit") {
    if (task.status !== "open" && task.status !== "declined")
      return NextResponse.json({ ok: false, error: "not submittable" }, { status: 400 });
    await db.update(tasks).set({ status: "pending" }).where(eq(tasks.id, taskId));
  } else if (action === "decline") {
    if (task.status !== "pending")
      return NextResponse.json({ ok: false, error: "not pending" }, { status: 400 });
    await db
      .update(tasks)
      .set({ status: "open", resolvedAt: null })
      .where(eq(tasks.id, taskId));
  } else if (action === "approve") {
    if (task.status !== "pending" && task.status !== "open")
      return NextResponse.json({ ok: false, error: "already settled" }, { status: 400 });

    await db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({ status: "approved", resolvedAt: new Date() })
        .where(eq(tasks.id, taskId));

      const [kid] = await tx.select().from(members).where(eq(members.id, task.kidId));
      await tx
        .update(members)
        .set({
          balanceCents: kid.balanceCents + task.rewardCents,
          streakDays: Math.max(kid.streakDays, 1),
        })
        .where(eq(members.id, kid.id));

      await tx.insert(transactions).values({
        memberId: task.kidId,
        kind: "task_pay",
        title: `Chore paid — ${task.title.slice(0, 90)}`,
        amountCents: task.rewardCents,
        counterparty: "Maya",
      });
    });
  } else {
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  }

  const state = await buildState();
  return NextResponse.json({ ok: true, state });
}
