#!/usr/bin/env node
// dp — the deploy.me CLI.
//
// Mental model:
//   main.ts is the declarative recipe (your source of truth).
//   `dp up` runs it.
//   `dp ls / logs / rm / open` are observability + manual overrides.
//   Manual overrides do NOT edit main.ts. Re-running `dp up` recreates them.

import { up } from "../commands/up.js";
import { ls } from "../commands/ls.js";
import { rm } from "../commands/rm.js";
import { open } from "../commands/open.js";
import { init } from "../commands/init.js";
import { help, version } from "../commands/meta.js";

const argv = process.argv.slice(2);
const cmd = argv[0];
const rest = argv.slice(1);

async function main() {
  switch (cmd) {
    case undefined:
    case "help":
    case "-h":
    case "--help":
      return help();

    case "version":
    case "-v":
    case "--version":
      return version();

    case "up":
      return up(rest);
    case "ls":
    case "list":
      return ls();
    case "rm":
    case "remove":
    case "stop":
      return rm(rest);
    case "open":
      return open(rest);
    case "init":
      return init(rest);

    default:
      console.error(`dp: unknown command: ${cmd}`);
      console.error(`run \`dp help\` for usage`);
      process.exit(64);
  }
}

main().catch((e: any) => {
  const msg = e?.message ?? String(e);
  console.error(`dp: ${msg}`);
  if (e?.status) console.error(`     HTTP ${e.status}`);
  if (e?.body && typeof e.body === "object") {
    try { console.error(`     ${JSON.stringify(e.body)}`); } catch {}
  }
  process.exit(1);
});
