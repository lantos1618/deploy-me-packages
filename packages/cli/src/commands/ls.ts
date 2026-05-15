import { client } from "@deploy-me/sdk";
import { getToken, getBaseUrl, table, c } from "../util.js";

export async function ls(): Promise<void> {
  const dm = client({ token: getToken(), baseUrl: getBaseUrl(), timeoutMs: 15_000 });
  const deploys = await dm.list();
  if (deploys.length === 0) {
    console.log(`${c.mute}no deploys yet — write ${c.reset}${c.camo}main.ts${c.reset}${c.mute} and run ${c.reset}${c.camo}dp up${c.reset}`);
    return;
  }
  table(
    ["name", "image", "url", "status"],
    deploys.map((d) => [
      `${c.bold}${d.name}${c.reset}`,
      `${c.mute}${d.image}${c.reset}`,
      `${c.flare}${d.url}${c.reset}`,
      statusBadge(d.status),
    ]),
  );
}

function statusBadge(s: string): string {
  if (s === "live") return `${c.green}● live${c.reset}`;
  if (s === "deploying") return `${c.camo}● deploying${c.reset}`;
  if (s === "stopped") return `${c.mute}○ stopped${c.reset}`;
  return `${c.red}● ${s}${c.reset}`;
}
