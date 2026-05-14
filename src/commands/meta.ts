import { c } from "../util.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export function help(): void {
  const lines = [
    `${c.camo}dp${c.reset}  ${c.mute}— the deploy.me CLI${c.reset}`,
    ``,
    `${c.mute}USAGE${c.reset}`,
    `  dp ${c.mute}<command>${c.reset}`,
    ``,
    `${c.mute}DEPLOY${c.reset}`,
    `  ${c.bold}up${c.reset} ${c.mute}[file]${c.reset}        run ${c.camo}main.ts${c.reset} (or the file you pass)`,
    `  ${c.bold}init${c.reset} ${c.mute}[dir]${c.reset}       scaffold a starter ${c.camo}main.ts${c.reset}`,
    ``,
    `${c.mute}OBSERVE${c.reset}`,
    `  ${c.bold}ls${c.reset}                list active deploys`,
    `  ${c.bold}open${c.reset} ${c.mute}<name>${c.reset}      open the live URL in your browser`,
    `  ${c.bold}logs${c.reset} ${c.mute}<name>${c.reset}      tail stdout/stderr ${c.mute}(Ctrl-C to stop)${c.reset}`,
    ``,
    `${c.mute}OVERRIDE${c.reset}`,
    `  ${c.bold}rm${c.reset} ${c.mute}<name>${c.reset}        stop and remove a deploy`,
    `                    ${c.mute}(note: does not edit main.ts — running ${c.reset}${c.camo}dp up${c.reset}${c.mute} recreates it)${c.reset}`,
    ``,
    `${c.mute}META${c.reset}`,
    `  ${c.bold}help${c.reset}              this`,
    `  ${c.bold}version${c.reset}           print version`,
    ``,
    `${c.mute}ENV${c.reset}`,
    `  ${c.bold}DEPLOY_ME_TOKEN${c.reset}   ${c.mute}required — get one from ${c.reset}${c.flare}https://deploy.me/dashboard${c.reset}`,
    `  ${c.bold}DEPLOY_ME_API_URL${c.reset} ${c.mute}override the control-plane URL (default api.run.deploy.me)${c.reset}`,
  ];
  console.log(lines.join("\n"));
}

export function version(): void {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(here, "..", "..", "..", "package.json"), "utf8"));
    console.log(`dp ${pkg.version}`);
  } catch {
    console.log("dp (dev)");
  }
}
