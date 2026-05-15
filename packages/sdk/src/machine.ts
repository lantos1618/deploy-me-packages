// Machine factory. A Machine is a sized compute target that containers deploy
// onto. Engine-side machines aren't first-class yet — for now a Machine is an
// in-memory sizing record whose specs ride along on each deploy.

import type { Transport } from "./transport.js";
import type { MachineConfig } from "./types.js";
import { DeployBuilderImpl, type DeployBuilder } from "./deploy-builder.js";

export interface Machine {
  readonly id: string;
  readonly cpu: number;
  readonly ram: number;
  /** Compose a deployment scheduled onto this machine. */
  deploy(name: string): DeployBuilder;
  /** Stop the machine and everything running on it. */
  stop(): Promise<void>;
}

export function makeMachine(transport: Transport, config: MachineConfig): Machine {
  const id = `m_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    cpu: config.cpu,
    ram: config.ram,
    deploy(name: string): DeployBuilder {
      return new DeployBuilderImpl({ name, machine: { ...config } }, transport).name(name);
    },
    async stop(): Promise<void> {
      // No-op until machines are first-class on the engine.
    },
  };
}
