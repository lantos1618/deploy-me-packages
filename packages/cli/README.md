# deploy-me-cli

`dp` — the [deploy.me](https://deploy.me) CLI.

Thin wrapper on the [`@deploy-me/sdk`](https://github.com/lantos1618/deploy-me-sdk) SDK. Everything non-trivial lives in the SDK; this package is argv parsing + pretty output.

## Install

```bash
npm install -g deploy-me-cli
```

You'll also need a token from <https://deploy.me/dashboard> in `DEPLOY_ME_TOKEN`.

## Use

```bash
dp init        # scaffold a starter main.ts
dp up          # run main.ts (your declarative recipe)
dp ls          # list active deploys
dp open mc     # open a deploy's URL in your browser
dp rm mc       # stop + remove (does NOT edit main.ts)
```

## Mental model

`main.ts` is the **declarative source of truth** — it imports the SDK and calls `.up()` for each thing you want running.

`dp` is for **observability + manual overrides**. `dp rm` stops a container but does not edit `main.ts`. Re-running `dp up` will recreate it. This is intentional, same model as `flyctl machines stop` vs `fly.toml`.

## Commands

| Command | What it does |
|---|---|
| `dp init [dir]` | Scaffold `main.ts` + `.gitignore` + `.env.example` |
| `dp up [file]` | Run `main.ts` (or a file you pass). Uses `bun` if present, else `node --experimental-strip-types` (22.6+), else `tsx` |
| `dp ls` | List active deploys |
| `dp open <name>` | Open the deploy's URL in your default browser |
| `dp rm <name>` | Stop and remove (override, not edit) |
| `dp help` | Print usage |
| `dp version` | Print version |

## Env

| Var | What |
|---|---|
| `DEPLOY_ME_TOKEN` | Required. Get one from <https://deploy.me/dashboard>. |
| `DEPLOY_ME_API_URL` | Optional. Override the control-plane URL. Default `https://api.run.deploy.me`. |

## Coming

These need engine work before they can be wired up:

- `dp logs <name>` — tail stdout/stderr (needs SSE endpoint on engine)
- `dp status <name>` — health checks, CPU/RAM use, restart count
- `dp exec <name> <cmd>` — interactive shell into a container
- `dp secrets set/ls/rm` — encrypted env-var store
- `dp login` — token mint via OAuth

See [`ARCHITECTURE.md`](https://github.com/lantos1618/deploy-me/blob/main/ARCHITECTURE.md) in the main repo for the full picture.

## License

MIT
