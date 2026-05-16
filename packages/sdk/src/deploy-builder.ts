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

  // Every chain method returns a fresh builder with one cfg field swapped in.
  // Centralizing the spread + transport-forwarding keeps individual methods
  // one line of intent.
  private _with(patch: Partial<DeployConfig>): DeployBuilder {
    return new DeployBuilderImpl({ ...this._cfg, ...patch }, this._transport);
  }

  name(slug: string)       { return this._with({ name: slug }); }
  image(ref: string)       { return this._with({ image: ref }); }
  target(t: Target)        { return this._with({ target: t }); }
  env(map: EnvMap)         { return this._with({ env: { ...this._cfg.env, ...map } }); }
  scale(s: ScaleConfig)    { return this._with({ scale: s }); }
  http(h: HttpConfig)      { return this._with({ http: h }); }
  schedule(c: CronExpr)    { return this._with({ schedule: c }); }
  timeout(t: string)       { return this._with({ timeout: t }); }
  onMachine(m: MachineConfig) { return this._with({ machine: m }); }
  budget(amount: number, currency: CurrencyType = Currency.EUR) {
    return this._with({ budget: { amount, currency } });
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
