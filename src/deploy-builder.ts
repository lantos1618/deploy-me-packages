// Fluent builder for a single deployment. Immutable per call — every method
// returns a fresh builder so the original is reusable.

import type { Transport } from "./transport.js";
import type { CronExpr } from "./cron.js";
import type {
  Currency as CurrencyType,
  DeployConfig,
  EnvMap,
  HttpConfig,
  MachineConfig,
  ScaleConfig,
  Target,
} from "./types.js";
import { Currency } from "./types.js";
import type { Deployment } from "./deployment.js";
import { deploymentFromEngineRow } from "./deployment.js";

export interface DeployBuilder {
  name(slug: string): DeployBuilder;
  image(ref: string): DeployBuilder;
  target(t: Target): DeployBuilder;
  env(map: EnvMap): DeployBuilder;
  scale(s: ScaleConfig): DeployBuilder;
  http(h: HttpConfig): DeployBuilder;
  schedule(c: CronExpr): DeployBuilder;
  timeout(t: string): DeployBuilder;
  budget(amount: number, currency?: CurrencyType): DeployBuilder;
  onMachine(m: MachineConfig): DeployBuilder;
  toJSON(): DeployConfig;
  up(): Promise<Deployment>;
}

export class DeployBuilderImpl implements DeployBuilder {
  constructor(
    private readonly _cfg: Readonly<DeployConfig> = {},
    private readonly _transport?: Transport,
  ) {}

  name(slug: string): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, name: slug }, this._transport);
  }
  image(ref: string): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, image: ref }, this._transport);
  }
  target(t: Target): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, target: t }, this._transport);
  }
  env(map: EnvMap): DeployBuilder {
    return new DeployBuilderImpl(
      { ...this._cfg, env: { ...this._cfg.env, ...map } },
      this._transport,
    );
  }
  scale(s: ScaleConfig): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, scale: s }, this._transport);
  }
  http(h: HttpConfig): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, http: h }, this._transport);
  }
  schedule(c: CronExpr): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, schedule: c }, this._transport);
  }
  timeout(t: string): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, timeout: t }, this._transport);
  }
  budget(amount: number, currency: CurrencyType = Currency.EUR): DeployBuilder {
    return new DeployBuilderImpl(
      { ...this._cfg, budget: { amount, currency } },
      this._transport,
    );
  }
  onMachine(m: MachineConfig): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, machine: m }, this._transport);
  }

  toJSON(): DeployConfig {
    return this._cfg;
  }

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
    if (this._cfg.env) {
      // Strip SecretRef placeholders — the engine resolves secrets server-side
      // once that's wired. For now, only plain string values flow.
      const plain: Record<string, string> = {};
      for (const [k, v] of Object.entries(this._cfg.env)) {
        if (typeof v === "string") plain[k] = v;
      }
      if (Object.keys(plain).length > 0) body.env = plain;
    }

    const res = await this._transport.request<{
      name: string;
      image: string;
      url: string;
      container?: string;
    }>("POST", "/deploy", body);

    return deploymentFromEngineRow(
      this._transport,
      {
        name: res.name,
        image: res.image,
        url: res.url,
        state: "running",
        cpu: this._cfg.machine?.cpu,
        ramGB: this._cfg.machine?.ram,
      },
      this._cfg.machine?.region ?? "eu-west",
    );
  }
}

/** Top-level static builder. Used in main.ts files before `client()` is called. */
export const Deploy: DeployBuilder = new DeployBuilderImpl();
