import { client } from "deploy.me";
import { getToken, getBaseUrl, fail, c } from "../util.js";

export async function status(args: string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    fail(`usage: dp status <name>`);
    process.exit(64);
  }
  const dm = client({ token: getToken(), baseUrl: getBaseUrl(), timeoutMs: 15_000 });
  const d = await dm.get(name);
  if (!d) {
    fail(`no deploy named "${name}"`);
    process.exit(1);
  }

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

function statusBadge(s: string): string {
  if (s === "live") return `${c.green}● live${c.reset}`;
  if (s === "deploying") return `${c.camo}● deploying${c.reset}`;
  if (s === "stopped") return `${c.mute}○ stopped${c.reset}`;
  return `${c.red}● ${s}${c.reset}`;
}

function short(iso: string): string {
  // 2026-05-13T21:18:25.485Z → 21:18:25 · 2026-05-13
  try {
    const d = new Date(iso);
    return `${d.toISOString().slice(11, 19)} · ${d.toISOString().slice(0, 10)}`;
  } catch { return iso; }
}
