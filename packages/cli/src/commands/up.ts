import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import { c, fail, info } from "../util.js";

export async function up(args: string[]): Promise<void> {
  const file = resolve(args[0] ?? "main.ts");
  if (!existsSync(file)) {
    fail(`no such file: ${file}`);
    fail(`run ${c.camo}dp init${c.reset} to scaffold a starter main.ts`);
    process.exit(1);
  }

  const runner = pickRunner();
  if (!runner) {
    fail("need bun or node 22.6+ to run main.ts");
    fail(`  install bun:  ${c.flare}https://bun.sh${c.reset}`);
    fail(`  or upgrade node to 22.6+ for --experimental-strip-types`);
    process.exit(1);
  }
  info(`${c.mute}running${c.reset} ${c.bold}${runner.cmd} ${runner.args.join(" ")} ${file}${c.reset}`);

  const child = spawn(runner.cmd, [...runner.args, file], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

type Runner = { cmd: string; args: string[] };

function pickRunner(): Runner | null {
  // 1. Prefer bun — native TS, fast.
  if (which("bun")) return { cmd: "bun", args: [] };
  // 2. Node 22.6+ with --experimental-strip-types.
  const node = which("node");
  if (node && nodeMajor() >= 22) {
    return { cmd: "node", args: ["--experimental-strip-types", "--no-warnings"] };
  }
  // 3. tsx as a fallback.
  if (which("tsx")) return { cmd: "tsx", args: [] };
  return null;
}

function which(cmd: string): boolean {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
  return r.status === 0;
}

function nodeMajor(): number {
  const r = spawnSync("node", ["--version"], { encoding: "utf8" });
  if (r.status !== 0) return 0;
  const m = /^v(\d+)/.exec(r.stdout.trim());
  return m ? Number(m[1]) : 0;
}
