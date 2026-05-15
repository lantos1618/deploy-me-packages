# @deploy-me/sdk

TypeScript SDK for the [deploy.me](https://deploy.me) control plane.

> **Status:** v0.2 — real `client()` runtime wired to `api.deploy.me`. List, deploy, get, stop, and SSE log streaming via `Deployment.logs()` all work end-to-end.

## Install

```bash
npm install @deploy-me/sdk
# or
bun add @deploy-me/sdk
```

## Quick start

```ts
import { client } from "@deploy-me/sdk";

const dm = client({ token: process.env.DEPLOY_ME_TOKEN! });

// Provision a sized machine.
const m1 = dm.machine({ cpu: 8, ram: 32 });

// Deploy a container onto it.
const agent = await m1
  .deploy("agent")
  .image("ghcr.io/me/coder:1")
  .up();

console.log(agent.url);  // https://agent.<your-account>.deploy.me
```

Run it with `bun main.ts` or `node main.ts` (Node 22+).

## Multi-deploy

One file, many deploys, mapped across machines:

```ts
import { client } from "@deploy-me/sdk";

const dm = client({ token: process.env.DEPLOY_ME_TOKEN! });

const m1 = dm.machine({ cpu: 8, ram: 32 });
const m2 = dm.machine({ cpu: 2, ram: 4 });

const agent = await m1.deploy("agent").image("ghcr.io/me/coder:1").up();
const mc    = await m1.deploy("mc").image("itzg/minecraft-server").up();
const blog  = await m2.deploy("blog").image("ghcr.io/me/blog:1").up();

console.log({ agent: agent.url, mc: mc.url, blog: blog.url });
```

## What's exported

| Name | What it does |
|---|---|
| `client(opts)` | Create a `Client` bound to a token. |
| `Client.machine({ cpu, ram })` | Provision a sized machine. Returns `Machine`. |
| `Client.deploy(name)` | Compose a deployment on an auto-sized machine. Returns `DeployBuilder`. |
| `Client.list()` | List active deployments. Returns `Deployment[]`. |
| `Client.get(name)` | Fetch one deployment by name. Returns `Deployment \| null`. |
| `Machine.deploy(name)` | Compose a deployment on this machine. |
| `DeployBuilder` | Fluent: `.image() .env() .scale() .http() .schedule() .timeout() .budget()`. Call `.up()` to deploy. |
| `Deployment` | `{ id, name, url, region, status, image, createdAt, stop(), logs() }`. |
| `Secret.from(name)` | Reference a secret by name. Resolved at deploy time. |
| `Cron.daily("09:00")` / `Cron.hourly()` / `Cron.expression("* * * * *")` | Cron helpers. |
| `Currency.EUR / USD / GBP` | Enum for `.budget()`. |
| `DeployMeError` | Error subclass with `.status` and `.body` for failed requests. |

## Options

```ts
client({
  token: string;            // required
  baseUrl?: string;         // default "https://api.deploy.me"
  region?: string;          // default "eu-west"
  fetch?: typeof fetch;     // tests / custom transport
  timeoutMs?: number;       // default 30000 — bump for slow image pulls
  retries?: number;         // default 2 — on 5xx / network errors
})
```

## Architecture

See [`ARCHITECTURE.md`](https://github.com/lambda-run/deploy-me-packages#architecture)
in the main repo for how the SDK fits into the engine → SDK → (website, CLI)
stack. The SDK source lives at `packages/sdk/`.

## License

MIT
