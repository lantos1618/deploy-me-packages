// `dp research <slug>` — kick a research run on the engine, poll until done.
// `dp research all`    — fan out across every known provider, wait for all.
// `dp research ls`     — show snapshot dates + tier counts for each provider.
//
// The engine does the actual agent work. The CLI is a control-plane client.

import { c, ok, fail, info, table, getToken, getBaseUrl } from "../util.js";

type RunStatus = "queued" | "running" | "success" | "error";
type Run = { id: number; ranAt: string; status: RunStatus; model: string; error: string | null };
type ProviderRow = {
  provider: string;
  tier: string;
  vcpu: number;
  ramGB: number;
  updatedAt: string;
};

const POLL_INTERVAL_MS = 8_000;
const POLL_TIMEOUT_MS = 8 * 60_000; // 8 min cap per run

function base(): string {
  return getBaseUrl() ?? "https://api.run.deploy.me";
}
function authHeader(): Record<string, string> {
  return { authorization: `Bearer ${getToken()}` };
}

async function getJson<T = any>(path: string): Promise<T> {
  const r = await fetch(`${base()}${path}`, { headers: authHeader() });
  if (!r.ok) throw Object.assign(new Error(`${path} → ${r.status}`), { status: r.status, body: await safeJson(r) });
  return r.json();
}
async function postJson(path: string): Promise<any> {
  const r = await fetch(`${base()}${path}`, { method: "POST", headers: authHeader() });
  if (!r.ok) throw Object.assign(new Error(`${path} → ${r.status}`), { status: r.status, body: await safeJson(r) });
  return r.json();
}
async function safeJson(r: Response): Promise<any> { try { return await r.json(); } catch { return null; } }

async function queueOne(slug: string): Promise<void> {
  await postJson(`/research/providers/${slug}/refresh`);
}

async function lastStatus(slug: string): Promise<Run | null> {
  const { runs } = await getJson(`/research/providers/${slug}/runs`);
  return runs[0] ?? null;
}

async function pollOne(slug: string): Promise<Run> {
  const t0 = Date.now();
  while (Date.now() - t0 < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const r = await lastStatus(slug);
    if (!r) continue;
    if (r.status === "success" || r.status === "error") return r;
  }
  throw new Error(`${slug}: timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

async function listSnapshot(): Promise<void> {
  const { rows } = await getJson<{ rows: ProviderRow[] }>("/research/providers");
  const byProvider = new Map<string, { tiers: number; latest: string }>();
  for (const r of rows) {
    const cur = byProvider.get(r.provider) ?? { tiers: 0, latest: r.updatedAt };
    cur.tiers += 1;
    if (r.updatedAt > cur.latest) cur.latest = r.updatedAt;
    byProvider.set(r.provider, cur);
  }
  const tableRows = Array.from(byProvider.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([provider, s]) => [provider, String(s.tiers), s.latest.slice(0, 10)]);
  table(["provider", "tiers", "updated"], tableRows);
}

export async function research(args: string[]): Promise<void> {
  const target = args[0];
  if (!target) {
    fail("usage: dp research <slug> | all | ls");
    process.exit(2);
  }

  if (target === "ls" || target === "list") {
    await listSnapshot();
    return;
  }

  const slugs = target === "all" ? await knownSlugs() : [target];
  if (slugs.length === 0) {
    fail("no providers known");
    process.exit(2);
  }

  // Kick everything off in parallel.
  info(`queuing ${slugs.length} research run${slugs.length > 1 ? "s" : ""}…`);
  await Promise.all(slugs.map(queueOne));

  // Poll each in parallel; report as they settle.
  const results = await Promise.allSettled(slugs.map(async (slug) => {
    const r = await pollOne(slug);
    if (r.status === "success") ok(`${c.bold}${slug}${c.reset} ${c.mute}via ${r.model}${c.reset}`);
    else fail(`${c.bold}${slug}${c.reset} ${c.mute}${r.error ?? "(unknown error)"}${c.reset}`);
    return { slug, ...r };
  }));

  const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.status !== "success"));
  if (failures.length > 0) {
    process.exit(1);
  }
}

async function knownSlugs(): Promise<string[]> {
  const { rows } = await getJson<{ rows: any[] }>("/research/providers");
  // Provider name → slug mapping is fuzzy on the engine side; the engine
  // doesn't expose slugs in this endpoint. Until we add a /providers list,
  // hardcode the known set. New providers are added by calling
  // `dp research <new-slug>` once — the agent populates the DB.
  return [
    "deploy-me", "hetzner", "ovh", "linode", "digitalocean",
    "vultr", "aws", "gcp", "fly", "railway",
  ];
}
