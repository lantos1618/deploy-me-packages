// Terminal output helpers. No deps — just ANSI escapes.

const TTY = process.stdout.isTTY;

const ansi = {
  reset: TTY ? "\x1b[0m" : "",
  bold:  TTY ? "\x1b[1m" : "",
  dim:   TTY ? "\x1b[2m" : "",
  red:   TTY ? "\x1b[38;2;192;56;38m" : "",
  green: TTY ? "\x1b[38;2;148;160;119m" : "",
  camo:  TTY ? "\x1b[38;2;207;169;129m" : "",
  flare: TTY ? "\x1b[38;2;192;56;38m" : "",
  mute:  TTY ? "\x1b[38;2;130;130;130m" : "",
} as const;

export const c = ansi;

export function tag(label: string, color: keyof typeof ansi = "camo"): string {
  return `${ansi[color]}${label}${ansi.reset}`;
}

export function ok(msg: string): void {
  console.log(`${ansi.green}✓${ansi.reset} ${msg}`);
}
export function fail(msg: string): void {
  console.error(`${ansi.red}✗${ansi.reset} ${msg}`);
}
export function info(msg: string): void {
  console.log(`${ansi.mute}→${ansi.reset} ${msg}`);
}

/**
 * Print a simple ascii table. Each column auto-sized to its widest cell.
 * Header row is dimmed; rows are plain.
 */
export function table(headers: string[], rows: string[][]): void {
  if (rows.length === 0) {
    console.log(`${ansi.mute}(no rows)${ansi.reset}`);
    return;
  }
  const widths = headers.map((h, i) =>
    Math.max(visibleLen(h), ...rows.map((r) => visibleLen(r[i] ?? "")))
  );
  const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - visibleLen(s)));
  const sep = "  ";
  console.log(headers.map((h, i) => `${ansi.mute}${pad(h.toUpperCase(), widths[i]!)}${ansi.reset}`).join(sep));
  for (const row of rows) {
    console.log(row.map((cell, i) => pad(cell ?? "", widths[i]!)).join(sep));
  }
}

// Strip ANSI before measuring width. Exported for tests.
export function visibleLen(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

export function statusBadge(s: string): string {
  if (s === "live") return `${ansi.green}● live${ansi.reset}`;
  if (s === "deploying") return `${ansi.camo}● deploying${ansi.reset}`;
  if (s === "stopped") return `${ansi.mute}○ stopped${ansi.reset}`;
  return `${ansi.red}● ${s}${ansi.reset}`;
}

export function getToken(): string {
  const t = process.env.DEPLOY_ME_TOKEN ?? process.env.DEPLOYME_TOKEN ?? "";
  if (!t) {
    fail("no DEPLOY_ME_TOKEN in env. get one from https://deploy.me/dashboard");
    process.exit(2);
  }
  return t;
}

export function getBaseUrl(): string | undefined {
  return process.env.DEPLOY_ME_API_URL || undefined;
}
