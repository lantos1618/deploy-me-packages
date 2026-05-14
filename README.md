# deploy.me

Types and builders for `deploy.me.ts` files.

> **Status:** v0.1 — types only. The `deploy.me` CLI that actually pushes a deployment will live at `api.run.deploy.me`. Right now this package exists so your editor can type-check the config file you'll eventually deploy.

## Install

```bash
npm install deploy.me
```

## Example

```ts
import { Deploy, Secret, Cron } from "deploy.me";

export default Deploy
  .name("hello-agent")
  .image("ghcr.io/me/agent:latest")
  .target("ovh:rise-1@eu-west")
  .env({
    ANTHROPIC_API_KEY: Secret.from("anthropic"),
    LOG_LEVEL: "info",
  })
  .scale({ min: 0, max: 10, idle: "30s" })
  .http({ port: 3000 });
```

A cron job:

```ts
import { Deploy, Cron } from "deploy.me";

export default Deploy
  .name("daily-scraper")
  .image("ghcr.io/me/scraper:latest")
  .target("ovh:rise-1@eu-west")
  .schedule(Cron.daily("09:00", "Europe/London"))
  .timeout("10m");
```

## What's exported

| Name | What it does |
|---|---|
| `Deploy` | The root builder. Every `deploy.me.ts` calls into this. |
| `Secret` | Reference a secret by name. Resolved at deploy time, never in your code. |
| `Cron` | `Cron.daily("HH:MM", tz?)`, `Cron.hourly()`, `Cron.expression("* * * * *")`. |

## What this isn't (yet)

- The runtime / CLI — `deploy.me up` isn't shipped yet
- `Db`, `Resource.*` typed-link primitives — coming once the control plane supports linking
- Build providers (`.build("./")`, `.from("Dockerfile")`) — types are there, behavior is not

## License

MIT
