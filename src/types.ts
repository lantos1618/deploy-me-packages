// Public type definitions. No runtime values — pure types and const enums
// so consumers can import the contract without pulling in any code.

import type { CronExpr } from "./cron.js";
import type { SecretRef } from "./secret.js";

export type Target =
  | `ovh:${string}`
  | `aws:${string}`
  | `gcp:${string}`
  | `ssh:${string}`
  | string;

export type ScaleConfig = { min: number; max: number; idle?: string };
export type HttpConfig = { port: number; path?: string };

export type EnvValue = string | SecretRef;
export type EnvMap = Record<string, EnvValue>;

/** Const-enum-style currency. Use as `Currency.EUR` etc. */
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

/** Configuration captured by `DeployBuilder` before `.up()`. */
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

export type DeploymentStats = {
  cpu?: number;
  ramGB?: number;
  startedAt?: string;
  finishedAt?: string;
  restartCount?: number;
  exitCode?: number | null;
};

/**
 * Internal shape returned by the control plane. Used as the wire format
 * between transport and the higher-level Deployment factory.
 *
 * Mirrors:
 *   GET  /list          → EngineDeployRow[]
 *   GET  /deploy/:name  → EngineDeployRow
 *   POST /deploy        → { name, image, url, container? }  (subset)
 */
export type EngineDeployRow = {
  name: string;
  image: string;
  state?: string;
  status?: string;
  url: string;
  cpu?: number;
  ramGB?: number;
  startedAt?: string;
  finishedAt?: string;
  restartCount?: number;
  exitCode?: number | null;
};

/** Map an engine container state to our public DeploymentStatus. */
export function mapEngineStatus(state: string): DeploymentStatus {
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
