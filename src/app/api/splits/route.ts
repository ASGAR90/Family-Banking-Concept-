import { NextResponse } from "next/server";
import { db } from "@/db";
import { splitParticipants, splits } from "@/db/schema";
import { buildState } from "@/lib/data";

/**
 * Create a bill split: the payer covers the total, every other person in the
 * group owes an equal share. Paid-for members are stored as pending debtors.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const title = String(body.title ?? "").trim().slice(0, 140);
  const merchant = String(body.merchant ?? "").trim().slice(0, 80) || null;
  const payerId = Number(body.payerId) || 1;
  const totalCents = Math.max(100, Math.min(100000, Math.round(Number(body.totalCents)) || 0));
  const participantIds: number[] = Array.isArray(body.participantIds)
    ? [...new Set<number>((body.participantIds as unknown[]).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0))]
    : [];

  if (!title || participantIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "title and at least one friend required" },
      { status: 400 },
    );
  }

  const heads = participantIds.length + 1; // payer + friends
  const shareCents = Math.ceil(totalCents / heads);

  await db.transaction(async (tx) => {
    const [split] = await tx
      .insert(splits)
      .values({ title, merchant, payerId, totalCents, shareCents })
      .returning();
    await tx.insert(splitParticipants).values(
      participantIds.map((memberId) => ({
        splitId: split.id,
        memberId,
        shareCents,
        status: "pending" as const,
      })),
    );
  });

  const state = await buildState();
  return NextResponse.json({ ok: true, state });
}
