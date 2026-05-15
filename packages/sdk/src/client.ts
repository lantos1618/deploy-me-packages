// Client factory + interface. The single public entrypoint that binds an
// auth token to a transport and returns the machine/deploy/list/get surface.

import { Transport } from "./transport.js";
import type { MachineConfig, EngineDeployRow } from "./types.js";
import type { Machine } from "./machine.js";
import { makeMachine } from "./machine.js";
import type { Deployment } from "./deployment.js";
import { deploymentFromEngineRow } from "./deployment.js";
import type { DeployBuilder } from "./deploy-builder.js";
import { DeployBuilderImpl } from "./deploy-builder.js";

const DEFAULT_BASE_URL = "https://api.deploy.me";

export interface ClientOptions {
  /** API token from deploy.me/dashboard. */
  token: string;
  /** Override the control-plane base URL. Defaults to api.deploy.me. */
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
  machine(config: MachineConfig): Machine;
  deploy(name: string): DeployBuilder;
  list(): Promise<Deployment[]>;
  get(name: string): Promise<Deployment | null>;
}

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
    const rows = await transport.request<EngineDeployRow[]>("GET", "/list");
    return rows.map((r) => deploymentFromEngineRow(transport, r, defaultRegion));
  };

  return {
    machine(config) {
      return makeMachine(transport, config);
    },
    deploy(name: string) {
      return new DeployBuilderImpl({ name }, transport).name(name);
    },
    list,
    async get(name: string) {
      try {
        const row = await transport.request<EngineDeployRow>("GET", `/deploy/${name}`);
        return deploymentFromEngineRow(transport, row, defaultRegion);
      } catch (e: any) {
        if (e?.status === 404) return null;
        throw e;
      }
    },
  };
}
