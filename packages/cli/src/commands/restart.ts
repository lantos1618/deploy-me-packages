import { client } from "@deploy-me/sdk";
import { getToken, getBaseUrl, ok, fail, c } from "../util.js";

export async function restart(args: string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    fail(`usage: dp restart <name>`);
    process.exit(64);
  }
  const dm = client({ token: getToken(), baseUrl: getBaseUrl(), timeoutMs: 30_000 });
  const d = await dm.get(name);
  if (!d) {
    fail(`no deploy named "${name}"`);
    process.exit(1);
  }
  await d.restart();
  ok(`restarted ${c.bold}${name}${c.reset}`);
}
