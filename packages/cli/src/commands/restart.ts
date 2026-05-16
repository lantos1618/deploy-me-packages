import { resolveDeploy } from "../resolve.js";
import { ok, c } from "../util.js";

export async function restart(args: string[]): Promise<void> {
  const { d, name } = await resolveDeploy(args, {
    usage: "dp restart <name>",
    timeoutMs: 30_000,
  });
  await d.restart();
  ok(`restarted ${c.bold}${name}${c.reset}`);
}
