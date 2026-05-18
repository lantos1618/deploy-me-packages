# @deploy-me/cli

`deploy` — the [deploy.me](https://deploy.me) CLI.

Thin wrapper on the [`@deploy-me/sdk`](https://github.com/lambda-run/deploy-me-packages/tree/main/packages/sdk) SDK. Everything non-trivial lives in the SDK; this package is argv parsing + pretty output.

## Install

```bash
npm install -g @deploy-me/cli
```

You'll also need a token from <https://deploy.me/dashboard> in `DEPLOY_ME_TOKEN`.

## Use

```bash
deploy init        # scaffold a starter deploy.ts
deploy up          # run deploy.ts (your declarative recipe)
deploy ls          # list active deploys
deploy open mc     # open a deploy's URL in your browser
deploy rm mc       # stop + remove (does NOT edit deploy.ts)
```

## Mental model

`deploy.ts` is the **declarative source of truth** — it imports the SDK and calls `.up()` for each thing you want running.

`deploy` is for **observability + manual overrides**. `deploy rm` stops a container but does not edit `deploy.ts`. Re-running `deploy up` will recreate it. This is intentional, same model as `flyctl machines stop` vs `fly.toml`.

## Commands

| Command | What it does |
|---|---|
| `deploy init [dir]` | Scaffold `deploy.ts` + `.gitignore` + `.env.example` |
| `deploy up [file]` | Run `deploy.ts` (or a file you pass). Uses `bun` if present, else `node --experimental-strip-types` (22.6+), else `tsx` |
| `deploy ls` | List active deploys |
| `deploy open <name>` | Open the deploy's URL in your default browser |
| `deploy logs <name>` | Tail stdout/stderr |
| `deploy status <name>` | Health, resource use, restart count |
| `deploy restart <name>` | Restart a deploy in place |
| `deploy rm <name>` | Stop and remove (override, not edit) |
| `deploy help` | Print usage |
| `deploy version` | Print version |

## Env

| Var | What |
|---|---|
| `DEPLOY_ME_TOKEN` | Required. Get one from <https://deploy.me/dashboard>. |
| `DEPLOY_ME_API_URL` | Optional. Override the control-plane URL. Default `https://api.deploy.me`. |

## Coming

These need engine work before they can be wired up:

- `deploy exec <name> <cmd>` — interactive shell into a container
- `deploy secrets set/ls/rm` — encrypted env-var store
- `deploy login` — token mint via OAuth

See [`ARCHITECTURE.md`](https://github.com/lambda-run/deploy.me/blob/main/ARCHITECTURE.md) in the main repo for the full picture.

## License

MIT
