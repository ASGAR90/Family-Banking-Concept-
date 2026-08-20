import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { buildState } from "@/lib/data";

/** Parent assigns a new earning task to a kid. */
export async function POST(req: Request) {
  const body = await req.json();
  const kidId = Number(body.kidId);
  const title = String(body.title ?? "").trim().slice(0, 140);
  const rewardCents = Math.max(25, Math.min(2500, Math.round(Number(body.rewardCents)) || 100));
  const category = ["chore", "learning", "kindness"].includes(body.category)
    ? body.category
    : "chore";

  if (!kidId || !title) {
    return NextResponse.json({ ok: false, error: "kidId and title required" }, { status: 400 });
  }

  await db.insert(tasks).values({ kidId, title, rewardCents, category, status: "open" });
  const state = await buildState();
  return NextResponse.json({ ok: true, state });
}
