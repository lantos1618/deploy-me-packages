// deploy.me SDK
//
// The typed contract between your code and the deploy.me control plane.
// See ARCHITECTURE.md in the main repo for how this fits with the engine,
// website, and CLI.

import { Transport, DeployMeError } from "./transport.js";

export { DeployMeError } from "./transport.js";

const DEFAULT_BASE_URL = "https://api.run.deploy.me";

// ─────────────────────────── Types ───────────────────────────

export type Target = `ovh:${string}` | `aws:${string}` | `gcp:${string}` | `ssh:${string}` | string;

export type ScaleConfig = { min: number; max: number; idle?: string };
export type HttpConfig = { port: number; path?: string };
export type EnvValue = string | SecretRef;
export type EnvMap = Record<string, EnvValue>;

export const Currency = { EUR: "EUR", USD: "USD", GBP: "GBP" } as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

export type MachineConfig = {
  /** vCPU count. */
  cpu: number;
  /** RAM in GB. */
  ram: number;
  /** Disk in GB. Defaults to a sensible value for the chosen tier. */
  storage?: number;
  /** Region override for this machine. Defaults to the client's region. */
  region?: string;
};

export type DeployConfig = {
  readonly name?: string;
  readonly image?: string;
  readonly target?: Target;
  readonly env?: Readonly<EnvMap>;
  readonly scale?: Readonly<ScaleConfig>;
  readonly http?: Readonly<HttpConfig>;
  readonly schedule?: CronExpr;
  readonly timeout?: string;
  readonly budget?: { amount: number; currency: Currency };
  readonly machine?: Readonly<MachineConfig>;
};

export type DeploymentStatus = "live" | "deploying" | "stopped" | "failed";

export interface Deployment {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly region: string;
  readonly status: DeploymentStatus;
  readonly image: string;
  readonly createdAt: string;
  stop(): Promise<void>;
  /** Async iterator over log lines. May not be implemented by all engines. */
  logs(): AsyncIterable<string>;
}

// ─────────────────────── DeployBuilder ───────────────────────

/**
 * Fluent builder for one container. Call `.up()` to deploy and resolve
 * a `Deployment` handle. Always returns a fresh builder per call.
 */
export class DeployBuilder {
  constructor(
    private readonly _cfg: Readonly<DeployConfig> = {},
    private readonly _transport?: Transport,
  ) {}

  name(slug: string): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, name: slug }, this._transport);
  }
  image(ref: string): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, image: ref }, this._transport);
  }
  target(t: Target): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, target: t }, this._transport);
  }
  env(map: EnvMap): DeployBuilder {
    return new DeployBuilder(
      { ...this._cfg, env: { ...this._cfg.env, ...map } },
      this._transport,
    );
  }
  scale(s: ScaleConfig): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, scale: s }, this._transport);
  }
  http(h: HttpConfig): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, http: h }, this._transport);
  }
  schedule(c: CronExpr): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, schedule: c }, this._transport);
  }
  timeout(t: string): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, timeout: t }, this._transport);
  }
  budget(amount: number, currency: Currency = Currency.EUR): DeployBuilder {
    return new DeployBuilder(
      { ...this._cfg, budget: { amount, currency } },
      this._transport,
    );
  }
  onMachine(m: MachineConfig): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, machine: m }, this._transport);
  }

  toJSON(): DeployConfig {
    return this._cfg;
  }

  /**
   * Deploy now. Resolves once the container is live and addressable.
   * Throws DeployMeError if the deploy fails.
   */
  async up(): Promise<Deployment> {
    if (!this._transport) {
      throw new Error(
        "DeployBuilder.up() requires a client(). Build via `client(...).deploy(name)` or `client(...).machine(...).deploy(name)`.",
      );
    }
    if (!this._cfg.name) throw new Error("DeployBuilder.up(): missing name");
    if (!this._cfg.image) throw new Error("DeployBuilder.up(): missing image");

    const body: Record<string, unknown> = {
      name: this._cfg.name,
      image: this._cfg.image,
    };
    if (this._cfg.http?.port) body.port = this._cfg.http.port;
    if (this._cfg.machine?.cpu) body.cpu = this._cfg.machine.cpu;
    if (this._cfg.machine?.ram) body.ramGB = this._cfg.machine.ram;

    const res = await this._transport.request<{
      name: string;
      image: string;
      url: string;
      container?: string;
    }>("POST", "/deploy", body);

    return makeDeployment(this._transport, {
      id: res.container ?? `dpm-${res.name}`,
      name: res.name,
      url: res.url,
      region: this._cfg.machine?.region ?? "eu-west",
      status: "live",
      image: res.image,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Pre-built top-level builder. Used in `main.ts` files that haven't called
 * `client()` yet — they compose a config and `.toJSON()` it for the CLI to
 * deploy. To actually deploy, use `client(...).deploy(...)` or `machine.deploy(...)`.
 */
export const Deploy: DeployBuilder = new DeployBuilder();

// ─────────────────────────── Machine ───────────────────────────

export interface Machine {
  readonly id: string;
  readonly cpu: number;
  readonly ram: number;
  /** Compose a deployment scheduled onto this machine. */
  deploy(name: string): DeployBuilder;
  /** Stop the machine and everything running on it. */
  stop(): Promise<void>;
}

function makeMachine(transport: Transport, config: MachineConfig): Machine {
  // Until the engine tracks machines as first-class entities, a Machine is
  // an in-memory sizing record: its specs ride along on each deploy.
  const id = `m_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    cpu: config.cpu,
    ram: config.ram,
    deploy(name: string) {
      return new DeployBuilder({ name, machine: { ...config } }, transport).name(name);
    },
    async stop() {
      // No-op for now — there's nothing on the engine side to stop until
      // machines are first-class. Returns immediately.
    },
  };
}

// ─────────────────────────── Deployment ───────────────────────────

function makeDeployment(
  transport: Transport,
  fields: Omit<Deployment, "stop" | "logs">,
): Deployment {
  return {
    ...fields,
    async stop(): Promise<void> {
      await transport.request("DELETE", `/deploy/${fields.name}`);
    },
    logs(): AsyncIterable<string> {
      // Placeholder until the engine grows GET /deploy/:name/logs (SSE).
      return (async function* () {})();
    },
  };
}

// ─────────────────────────── Client ───────────────────────────

export interface ClientOptions {
  /** API token from deploy.me/dashboard. */
  token: string;
  /** Override the control-plane base URL. Defaults to api.run.deploy.me. */
  baseUrl?: string;
  /** Default region, e.g. `"gra"`, `"sbg"`. */
  region?: string;
  /** Optional fetch override (e.g. in tests). */
  fetch?: typeof fetch;
  /** Per-request timeout in ms. Default 30s. */
  timeoutMs?: number;
  /** Auto-retries on 5xx / network error. Default 2. */
  retries?: number;
}

export interface Client {
  /** Provision a machine with the given specs. */
  machine(config: MachineConfig): Machine;
  /** Compose a deployment using an auto-sized machine. */
  deploy(name: string): DeployBuilder;
  /** List active deployments under this token. */
  list(): Promise<Deployment[]>;
  /** Fetch a deployment by name. Returns null if not found. */
  get(name: string): Promise<Deployment | null>;
}

/** Create a deploy.me client. */
export function client(opts: ClientOptions): Client {
  if (!opts.token) throw new Error("deploy.me SDK: client({ token }) is required");

  const transport = new Transport({
    baseUrl: opts.baseUrl ?? DEFAULT_BASE_URL,
    token: opts.token,
    fetch: opts.fetch,
    timeoutMs: opts.timeoutMs,
    retries: opts.retries,
  });
  const defaultRegion = opts.region ?? "eu-west";

  const list = async (): Promise<Deployment[]> => {
    const rows = await transport.request<
      Array<{ name: string; image: string; state: string; status: string; url: string }>
    >("GET", "/list");
    return rows.map((r) =>
      makeDeployment(transport, {
        id: `dpm-${r.name}`,
        name: r.name,
        url: r.url,
        region: defaultRegion,
        status: mapEngineStatus(r.state),
        image: r.image,
        createdAt: new Date().toISOString(),
      }),
    );
  };

  return {
    machine(config) {
      return makeMachine(transport, config);
    },
    deploy(name: string) {
      return new DeployBuilder({ name }, transport).name(name);
    },
    list,
    async get(name: string) {
      const all = await list();
      return all.find((d) => d.name === name) ?? null;
    },
  };
}

function mapEngineStatus(state: string): DeploymentStatus {
  switch (state) {
    case "running": return "live";
    case "created":
    case "restarting":
      return "deploying";
    case "exited":
    case "removing":
      return "stopped";
    case "dead": return "failed";
    default: return "live";
  }
}

// ─────────────────────── Secrets + Cron ───────────────────────

export class SecretRef {
  constructor(public readonly name: string) {}
  toJSON() { return { $secret: this.name }; }
}

export const Secret = {
  from(name: string): SecretRef { return new SecretRef(name); },
};

export class CronExpr {
  constructor(public readonly expr: string, public readonly tz?: string) {}
  toJSON() { return { $cron: this.expr, tz: this.tz }; }
}

function hourFromHHMM(time: string): { h: number; m: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) throw new Error(`Cron time must be "HH:MM", got "${time}"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`Cron time out of range: ${time}`);
  return { h, m: min };
}

export const Cron = {
  daily(time: string, tz?: string): CronExpr {
    const { h, m } = hourFromHHMM(time);
    return new CronExpr(`${m} ${h} * * *`, tz);
  },
  hourly(): CronExpr { return new CronExpr("0 * * * *"); },
  expression(expr: string, tz?: string): CronExpr { return new CronExpr(expr, tz); },
};
