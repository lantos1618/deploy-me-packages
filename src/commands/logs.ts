import { client } from "deploy.me";
import { getToken, getBaseUrl, fail, c } from "../util.js";

export async function logs(args: string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    fail(`usage: dp logs <name> [--no-follow] [--tail N]`);
    process.exit(64);
  }
  const follow = !args.includes("--no-follow");
  const tailIdx = args.indexOf("--tail");
  const tail = tailIdx >= 0 ? Number(args[tailIdx + 1] ?? "100") : 100;

  const dm = client({ token: getToken(), baseUrl: getBaseUrl() });
  const d = await dm.get(name);
  if (!d) {
    fail(`no deploy named "${name}"`);
    process.exit(1);
  }

  // Ctrl-C cleanly exits without a stack trace.
  process.on("SIGINT", () => process.exit(0));

  for await (const ln of d.logs({ follow, tail })) {
    const stream = ln.kind === "err"
      ? `${c.red}stderr${c.reset}`
      : `${c.mute}stdout${c.reset}`;
    const ts = new Date(ln.t).toISOString().slice(11, 19);
    console.log(`${c.mute}${ts}${c.reset}  ${stream}  ${ln.text}`);
  }
}
