import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, members, transactions } from "@/db/schema";
import { buildState } from "@/lib/data";

/** Kid finishes a lesson → money drop instantly, next module unlocks. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const lessonId = Number(id);
  const body = await req.json();
  const kidId = Number(body.kidId);

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.kidId !== kidId) {
    return NextResponse.json({ ok: false, error: "lesson not found" }, { status: 404 });
  }
  if (lesson.status !== "open") {
    return NextResponse.json(
      { ok: false, error: "lesson not available" },
      { status: 400 },
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(lessons)
      .set({ status: "done" })
      .where(eq(lessons.id, lessonId));

    const [kid] = await tx.select().from(members).where(eq(members.id, kidId));
    await tx
      .update(members)
      .set({ balanceCents: kid.balanceCents + lesson.rewardCents })
      .where(eq(members.id, kidId));

    await tx.insert(transactions).values({
      memberId: kidId,
      kind: "lesson_reward",
      title: `Lesson done — ${lesson.title}`,
      amountCents: lesson.rewardCents,
      counterparty: "Sprout Learn",
    });

    // unlock the next chapter
    const [next] = await tx
      .select()
      .from(lessons)
      .where(and(eq(lessons.kidId, kidId), eq(lessons.status, "locked")))
      .orderBy(asc(lessons.sort))
      .limit(1);
    if (next) {
      await tx.update(lessons).set({ status: "open" }).where(eq(lessons.id, next.id));
    }
  });

  const state = await buildState();
  return NextResponse.json({ ok: true, state });
}
