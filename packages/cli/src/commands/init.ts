import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { ok, fail, c } from "../util.js";

const MAIN_TEMPLATE = `import { client } from "@deploy-me/sdk";

const dm = client({ token: process.env.DEPLOY_ME_TOKEN! });

const m1 = dm.machine({ cpu: 1, ram: 1 });

const hello = await m1
  .deploy("hello")
  .image("traefik/whoami")
  .up();

console.log(hello.url);
`;

const GITIGNORE = `node_modules
.env
.deploy-me/
`;

const ENV_EXAMPLE = `# Get a token from https://deploy.me/dashboard
DEPLOY_ME_TOKEN=
`;

export async function init(args: string[]): Promise<void> {
  const dir = resolve(args[0] ?? ".");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const mainPath = join(dir, "main.ts");
  if (existsSync(mainPath)) {
    fail(`${mainPath} already exists — refusing to overwrite`);
    process.exit(1);
  }

  writeFileSync(mainPath, MAIN_TEMPLATE);
  writeIfMissing(join(dir, ".gitignore"), GITIGNORE);
  writeIfMissing(join(dir, ".env.example"), ENV_EXAMPLE);

  ok(`wrote ${c.bold}${mainPath}${c.reset}`);
  ok(`wrote ${c.bold}${join(dir, ".gitignore")}${c.reset}`);
  ok(`wrote ${c.bold}${join(dir, ".env.example")}${c.reset}`);
  console.log("");
  console.log(`${c.mute}next:${c.reset}`);
  console.log(`  ${c.camo}export DEPLOY_ME_TOKEN=...${c.reset}`);
  console.log(`  ${c.camo}dp up${c.reset}`);
}

function writeIfMissing(path: string, content: string): void {
  if (!existsSync(path)) writeFileSync(path, content);
}
