import { resolveDeploy } from "../resolve.js";
import { statusBadge, c } from "../util.js";

export async function status(args: string[]): Promise<void> {
  const { d } = await resolveDeploy(args, {
    usage: "dp status <name>",
    timeoutMs: 15_000,
  });

  const s = d.stats ?? {};
  const rows: Array<[string, string]> = [
    ["name",       `${c.bold}${d.name}${c.reset}`],
    ["status",     statusBadge(d.status)],
    ["url",        `${c.flare}${d.url}${c.reset}`],
    ["image",      `${c.mute}${d.image}${c.reset}`],
    ["region",     d.region],
    ["cpu",        s.cpu != null ? `${s.cpu}` : `${c.mute}—${c.reset}`],
    ["ram",        s.ramGB != null ? `${s.ramGB} GB` : `${c.mute}—${c.reset}`],
    ["started",    s.startedAt ? short(s.startedAt) : `${c.mute}—${c.reset}`],
    ["restarts",   s.restartCount != null ? `${s.restartCount}` : `${c.mute}—${c.reset}`],
    ["exit code",  s.exitCode != null && d.status !== "live" ? `${s.exitCode}` : `${c.mute}—${c.reset}`],
  ];
  const lw = Math.max(...rows.map(([k]) => k.length));
  for (const [k, v] of rows) {
    console.log(`  ${c.mute}${k.padEnd(lw)}${c.reset}  ${v}`);
  }
}

function short(iso: string): string {
  // 2026-05-13T21:18:25.485Z → 21:18:25 · 2026-05-13
  try {
    const d = new Date(iso);
    return `${d.toISOString().slice(11, 19)} · ${d.toISOString().slice(0, 10)}`;
  } catch { return iso; }
}
