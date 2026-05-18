import { resolveDeploy } from "../resolve.js";
import { c } from "../util.js";

export async function logs(args: string[]): Promise<void> {
  const follow = !args.includes("--no-follow");
  const tailIdx = args.indexOf("--tail");
  const tail = tailIdx >= 0 ? Number(args[tailIdx + 1] ?? "100") : 100;

  const { d } = await resolveDeploy(args, {
    usage: "deploy logs <name> [--no-follow] [--tail N]",
  });

  process.on("SIGINT", () => process.exit(0));

  for await (const ln of d.logs({ follow, tail })) {
    const stream = ln.kind === "err"
      ? `${c.red}stderr${c.reset}`
      : `${c.mute}stdout${c.reset}`;
    const ts = new Date(ln.t).toISOString().slice(11, 19);
    console.log(`${c.mute}${ts}${c.reset}  ${stream}  ${ln.text}`);
  }
}
