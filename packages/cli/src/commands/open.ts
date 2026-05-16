import { resolveDeploy } from "../resolve.js";
import { ok, c } from "../util.js";
import { spawn } from "node:child_process";
import { platform } from "node:os";

export async function open(args: string[]): Promise<void> {
  const { d } = await resolveDeploy(args, {
    usage: "dp open <name>",
    timeoutMs: 15_000,
  });

  ok(`${c.flare}${d.url}${c.reset}`);
  openInBrowser(d.url);
}

function openInBrowser(url: string): void {
  const p = platform();
  const cmd =
    p === "darwin" ? "open" :
    p === "win32"  ? "cmd"  :
                     "xdg-open";
  const args = p === "win32" ? ["/c", "start", "", url] : [url];
  try {
    spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
  } catch {
    // Print only — many environments (CI, SSH) have no browser. That's fine.
  }
}
