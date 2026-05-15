// Deployment factory. Wraps an `EngineDeployRow` into a public `Deployment`
// with bound transport for stop/restart/refresh/logs.

import type { Transport } from "./transport.js";
import type { LogLine } from "./transport.js";
import type {
  DeploymentStats,
  DeploymentStatus,
  EngineDeployRow,
} from "./types.js";
import { mapEngineStatus } from "./types.js";

export interface Deployment {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly region: string;
  readonly status: DeploymentStatus;
  readonly image: string;
  readonly createdAt: string;
  readonly stats?: DeploymentStats;
  stop(): Promise<void>;
  /** Restart the container in place. */
  restart(): Promise<void>;
  /** Re-fetch this deployment's state from the engine. */
  refresh(): Promise<Deployment>;
  /**
   * Stream container logs. By default tails the last 100 lines then follows
   * new output until the iterator is broken out of.
   */
  logs(opts?: { follow?: boolean; tail?: number }): AsyncIterable<LogLine>;
}

type DeploymentFields = Omit<Deployment, "stop" | "logs" | "restart" | "refresh">;

function buildDeployment(transport: Transport, fields: DeploymentFields): Deployment {
  const region = fields.region;
  return {
    ...fields,
    async stop(): Promise<void> {
      await transport.request("DELETE", `/deploy/${fields.name}`);
    },
    async restart(): Promise<void> {
      await transport.request("POST", `/deploy/${fields.name}/restart`);
    },
    async refresh(): Promise<Deployment> {
      const row = await transport.request<EngineDeployRow>("GET", `/deploy/${fields.name}`);
      return deploymentFromEngineRow(transport, row, region);
    },
    logs(opts?: { follow?: boolean; tail?: number }): AsyncIterable<LogLine> {
      return transport.streamLogs(fields.name, opts);
    },
  };
}

/** Translate a raw engine row into a public `Deployment` bound to `transport`. */
export function deploymentFromEngineRow(
  transport: Transport,
  row: EngineDeployRow,
  region: string,
): Deployment {
  return buildDeployment(transport, {
    id: `dpm-${row.name}`,
    name: row.name,
    url: row.url,
    region,
    status: mapEngineStatus(row.state ?? "running"),
    image: row.image,
    createdAt: row.startedAt ?? new Date().toISOString(),
    stats: {
      cpu: row.cpu,
      ramGB: row.ramGB,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      restartCount: row.restartCount,
      exitCode: row.exitCode ?? null,
    },
  });
}
