/** Money + time formatting helpers shared across the app. */

export function money(cents: number, opts: { exact?: boolean; sign?: boolean } = {}) {
  const abs = Math.abs(cents);
  const core = (abs / 100).toLocaleString("en-US", {
    minimumFractionDigits: opts.exact ? 2 : abs % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (opts.sign && cents !== 0) return `${cents > 0 ? "+" : "−"}$${core}`;
  return `${cents < 0 ? "−" : ""}$${core}`;
}

export function firstName(name: string) {
  return name.split(" ")[0];
}

export function timeAgo(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Which ledger a transaction belongs to — keeps the two feeds cleanly split. */
export const CIRCLE_KINDS = new Set(["split_in", "split_out"]);

export function txnScope(kind: string): "family" | "circle" {
  return CIRCLE_KINDS.has(kind) ? "circle" : "family";
}
