import { c } from "../util.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export function help(): void {
  const lines = [
    `${c.camo}deploy${c.reset}  ${c.mute}— the deploy.me CLI (alias: ${c.reset}${c.camo}dm${c.reset}${c.mute})${c.reset}`,
    ``,
    `${c.mute}USAGE${c.reset}`,
    `  deploy ${c.mute}<command>${c.reset}`,
    ``,
    `${c.mute}DEPLOY${c.reset}`,
    `  ${c.bold}up${c.reset} ${c.mute}[file]${c.reset}        run ${c.camo}deploy.ts${c.reset} (or the file you pass)`,
    `  ${c.bold}init${c.reset} ${c.mute}[dir]${c.reset}       scaffold a starter ${c.camo}deploy.ts${c.reset}`,
    ``,
    `${c.mute}OBSERVE${c.reset}`,
    `  ${c.bold}ls${c.reset}                list active deploys`,
    `  ${c.bold}open${c.reset} ${c.mute}<name>${c.reset}      open the live URL in your browser`,
    `  ${c.bold}logs${c.reset} ${c.mute}<name>${c.reset}      tail stdout/stderr ${c.mute}(Ctrl-C to stop)${c.reset}`,
    `  ${c.bold}status${c.reset} ${c.mute}<name>${c.reset}    detail block: cpu, ram, started, restarts`,
    ``,
    `${c.mute}OVERRIDE${c.reset}`,
    `  ${c.bold}restart${c.reset} ${c.mute}<name>${c.reset}   restart in place`,
    `  ${c.bold}rm${c.reset} ${c.mute}<name>${c.reset}        stop and remove a deploy`,
    `                    ${c.mute}(note: does not edit deploy.ts — running ${c.reset}${c.camo}deploy up${c.reset}${c.mute} recreates it)${c.reset}`,
    ``,
    `${c.mute}RESEARCH${c.reset} ${c.mute}(internal — keep the compute table fresh)${c.reset}`,
    `  ${c.bold}research${c.reset} ${c.mute}<slug>${c.reset}   kick a research agent for one provider`,
    `  ${c.bold}research${c.reset} ${c.mute}all${c.reset}      fan out across all known providers`,
    `  ${c.bold}research${c.reset} ${c.mute}ls${c.reset}       show snapshot dates + tier counts`,
    ``,
    `${c.mute}META${c.reset}`,
    `  ${c.bold}help${c.reset}              this`,
    `  ${c.bold}version${c.reset}           print version`,
    ``,
    `${c.mute}ENV${c.reset}`,
    `  ${c.bold}DEPLOY_ME_TOKEN${c.reset}   ${c.mute}required — get one from ${c.reset}${c.flare}https://deploy.me/dashboard${c.reset}`,
    `  ${c.bold}DEPLOY_ME_API_URL${c.reset} ${c.mute}override the control-plane URL (default api.deploy.me)${c.reset}`,
  ];
  console.log(lines.join("\n"));
}

export function version(): void {
  try {
    // From source `src/commands/meta.ts` or compiled `dist/commands/meta.js`,
    // package.json is two dirs up.
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(here, "..", "..", "package.json"), "utf8"));
    console.log(`deploy ${pkg.version}`);
  } catch {
    console.log("deploy (dev)");
  }
}
