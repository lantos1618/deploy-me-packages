// deploy.me SDK — public surface.
//
// The implementation is split across focused modules. This file does
// re-exports only so consumers can `import { client, Currency, ... } from "@deploy-me/sdk"`.

// Transport / errors
export { DeployMeError } from "./transport.js";
export type { LogLine } from "./transport.js";

// Types
export type {
  Target,
  ScaleConfig,
  HttpConfig,
  EnvValue,
  EnvMap,
  DeployConfig,
  MachineConfig,
  DeploymentStatus,
  DeploymentStats,
} from "./types.js";
export { Currency } from "./types.js";

// Builders / handles
export type { DeployBuilder } from "./deploy-builder.js";
export { Deploy } from "./deploy-builder.js";
export type { Machine } from "./machine.js";
export type { Deployment } from "./deployment.js";

// Client
export type { Client, ClientOptions } from "./client.js";
export { client } from "./client.js";

// Cron / secrets
export { CronExpr, Cron } from "./cron.js";
export { SecretRef, Secret } from "./secret.js";
