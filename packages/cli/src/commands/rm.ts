import { resolveDeploy } from "../resolve.js";
import { ok, c } from "../util.js";

export async function rm(args: string[]): Promise<void> {
  const { d, name } = await resolveDeploy(args, {
    usage: "dp rm <name>",
    timeoutMs: 30_000,
  });
  await d.stop();
  ok(`stopped ${c.bold}${name}${c.reset}`);
}
