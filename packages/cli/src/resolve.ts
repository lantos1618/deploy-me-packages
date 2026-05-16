import { client, type Deployment } from "@deploy-me/sdk";
import { getToken, getBaseUrl, fail } from "./util.js";

/**
 * Parse `<name>` from argv, look it up via the SDK, and fail with the right
 * exit code if either step is missing. Shared by status/logs/open/rm/restart.
 *
 *   64 — missing arg (EX_USAGE)
 *   1  — name didn't resolve to a deploy
 */
export async function resolveDeploy(
  args: string[],
  opts: { usage: string; timeoutMs?: number },
): Promise<{ d: Deployment; name: string }> {
  const name = args[0];
  if (!name) {
    fail(`usage: ${opts.usage}`);
    process.exit(64);
  }
  const dm = client({ token: getToken(), baseUrl: getBaseUrl(), timeoutMs: opts.timeoutMs });
  const d = await dm.get(name);
  if (!d) {
    fail(`no deploy named "${name}"`);
    process.exit(1);
  }
  return { d, name };
}
