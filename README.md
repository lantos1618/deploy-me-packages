# deploy-me-packages

Public packages for **[deploy.me](https://deploy.me)** — the
TypeScript SDK and the `deploy` CLI (alias `dm`). This is the contract surface for
deploying containers onto deploy.me from your own code or terminal.

The private control plane (engine, auth, database) and the marketing
site live in the private `deploy-me` monorepo. **This repo is the
only thing third-party code needs to talk to deploy.me.**

## Layout

```
packages/
├── sdk/   @deploy-me/sdk   TypeScript client — programmatic deploys
└── cli/   @deploy-me/cli   `deploy` binary (alias `dm`) — terminal-friendly wrapper over the SDK
```

Both packages ship as `bun build`-compatible TypeScript with full
type definitions.

## Quickstart

```bash
# CLI — no install needed
npx -p @deploy-me/cli deploy init    # scaffold deploy.ts + .env
npx -p @deploy-me/cli deploy up      # deploy

# Or globally
npm i -g @deploy-me/cli
deploy up                            # or `dm up` if you want fewer keystrokes
```

```ts
// or programmatically
import { client } from "@deploy-me/sdk";

const dm = client({ token: process.env.DEPLOY_ME_TOKEN! });

const m1 = dm.machine({ cpu: 8, ram: 32 });

const agent = await m1
  .deploy("agent")
  .image("ghcr.io/me/coder:1")
  .up();

console.log(agent.url);  // → https://agent.you.deploy.me
```

## What's in `@deploy-me/sdk`

The SDK is the single source of truth for the deploy.me API. Everything
the CLI does is built on top of these primitives.

| File                  | Responsibility                                                                  |
|-----------------------|---------------------------------------------------------------------------------|
| `client.ts`           | The `client({ token })` entry. Wraps transport + auth + base URL.               |
| `machine.ts`          | `.machine({ cpu, ram })` — declares a target machine spec.                      |
| `deploy-builder.ts`   | The fluent `.deploy(name).image(...).env(...).up()` chain.                      |
| `deployment.ts`       | Live deployment handle — `.status()`, `.logs()`, `.restart()`, `.rm()`.         |
| `cron.ts`             | Scheduled deployments — cron expressions, one-shot timers.                      |
| `secret.ts`           | First-class env / secret handling (no plain-text leaks into the deploy event).  |
| `sse.ts`              | Server-Sent-Events stream for live build + run logs.                            |
| `transport.ts`        | HTTP client, error mapping (`DeployMeError`), retry/timeout policy.             |
| `errors.ts`           | Typed error classes consumers can `instanceof` against.                         |
| `types.ts`            | All public type definitions (`DeploymentStatus`, `MachineConfig`, …).           |
| `index.ts`            | Re-export surface — what you actually `import { … } from "@deploy-me/sdk"`.     |

The SDK has **zero runtime dependencies** — it's a thin wrapper over
`fetch` and the WHATWG Streams API.

## What's in `@deploy-me/cli` (the `deploy` binary (alias `dm`))

`deploy` is a thin command-line wrapper over the SDK. Its mental model:

> `deploy.ts` is the declarative recipe (your source of truth).
> `deploy up` runs it.
> `deploy ls / logs / status / restart / rm / open` are observability and
> manual overrides. Manual overrides do **not** edit `deploy.ts` —
> re-running `deploy up` recreates the declared state.

### Commands

| Command         | What it does                                                                     |
|-----------------|----------------------------------------------------------------------------------|
| `deploy init`       | Scaffold a fresh `deploy.ts` + `.env` in the current directory.                  |
| `deploy up`         | Execute `deploy.ts` against the engine and stream live build/run events.         |
| `deploy ls`         | List your deployments (name · machine · URL · region · uptime).                  |
| `deploy status <n>` | Detailed status for one deployment.                                              |
| `deploy logs <n>`   | Tail logs over SSE.                                                              |
| `deploy open <n>`   | Open the deployment's public URL in your default browser.                        |
| `deploy restart <n>`| Restart one deployment (without re-pulling the image).                           |
| `deploy rm <n>`     | Stop and remove one deployment. Two-step confirm.                                |
| `deploy research`   | Compute-catalog research helpers — `<slug>`, `all`, `ls`. Hits the control       |
|                 | plane's research agent to refresh provider pricing snapshots.                    |
| `deploy help`       | Usage.                                                                           |
| `deploy version`    | Print the CLI version.                                                           |

### Auth

`deploy` reads `DEPLOY_ME_TOKEN` from the environment (or from `.env`
via Bun's auto-loading). Generate a token from the
[dashboard](https://deploy.me/dashboard) after signing in with GitHub.

> **Binary names:** the npm package installs three executables for the
> same CLI — `deploy` (primary), `dm` (short alias), and `dp` (kept for
> one release of back-compat — will be removed in 0.3). Pick whichever
> fits your muscle memory.

New accounts land on a waitlist — compute mutations are gated until an
admin approves the account. See deploy.me/dashboard for the current
policy.

## Compatibility

- **Runtime:** Bun (preferred), Node ≥ 18, Deno ≥ 1.40.
- **Modules:** ESM-only. `import` not `require`.
- **TypeScript:** types ship in the package — no `@types/...` needed.

## Versioning

The SDK and CLI version independently. Both follow semver pre-1.0
(minor bumps may be breaking). The CLI is pinned to a compatible SDK
range; when they need to move together it'll be called out in the
release notes.

## Related

| Project                                    | What                                                        |
|--------------------------------------------|-------------------------------------------------------------|
| [deploy.me](https://deploy.me)             | Marketing site + COMPARE table (25 providers, 3,800+ tiers) |
| [deploy.me/docs](https://deploy.me/docs)   | Public docs · `deploy.ts` reference                         |
| [deploy.me/docs/llms.txt](https://deploy.me/docs/llms.txt) | Plain-text doc surface for AI agents          |
| `lambda-run/deploy-me` (private)           | Control plane · engine · catalog · GHA deploy pipeline      |

## License

MIT — see [`LICENSE`](./LICENSE).
