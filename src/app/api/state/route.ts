import { NextResponse } from "next/server";
import { buildState } from "@/lib/data";

export async function GET() {
  try {
    const state = await buildState();
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 },
    );
  }
}
