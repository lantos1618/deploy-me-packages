import { client } from "@deploy-me/sdk";
import { getToken, getBaseUrl, ok, fail, c } from "../util.js";
import { spawn } from "node:child_process";
import { platform } from "node:os";

export async function open(args: string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    fail(`usage: dp open <name>`);
    process.exit(64);
  }
  const dm = client({ token: getToken(), baseUrl: getBaseUrl(), timeoutMs: 15_000 });
  const d = await dm.get(name);
  if (!d) {
    fail(`no deploy named "${name}"`);
    process.exit(1);
  }

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
