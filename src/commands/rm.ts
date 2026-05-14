import { client } from "deploy.me";
import { getToken, getBaseUrl, ok, fail, c } from "../util.js";

export async function rm(args: string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    fail(`usage: dp rm <name>`);
    process.exit(64);
  }
  const dm = client({ token: getToken(), baseUrl: getBaseUrl(), timeoutMs: 30_000 });
  const d = await dm.get(name);
  if (!d) {
    fail(`no deploy named "${name}"`);
    process.exit(1);
  }
  await d.stop();
  ok(`stopped ${c.bold}${name}${c.reset}`);
}
