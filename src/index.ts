// deploy.me SDK — types and builders for `deploy.me.ts` files.
//
// The runtime that actually pushes a deployment lives at api.run.deploy.me
// and is fronted by the `deploy.me` CLI (coming). For now this package
// exists so your editor can type-check the config file you'll eventually
// deploy.

export type Target = `ovh:${string}` | `aws:${string}` | `gcp:${string}` | `ssh:${string}` | string;

export type ScaleConfig = {
  min: number;
  max: number;
  idle: string;
};

export type HttpConfig = {
  port: number;
  path?: string;
};

export type EnvValue = string | SecretRef;
export type EnvMap = Record<string, EnvValue>;

export type DeployConfig = {
  readonly name?: string;
  readonly image?: string;
  readonly target?: Target;
  readonly env?: Readonly<EnvMap>;
  readonly scale?: Readonly<ScaleConfig>;
  readonly http?: Readonly<HttpConfig>;
  readonly schedule?: CronExpr;
  readonly timeout?: string;
};

export class DeployBuilder {
  constructor(private readonly _cfg: Readonly<DeployConfig> = {}) {}

  name(slug: string): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, name: slug });
  }
  image(ref: string): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, image: ref });
  }
  target(t: Target): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, target: t });
  }
  env(map: EnvMap): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, env: { ...this._cfg.env, ...map } });
  }
  scale(s: ScaleConfig): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, scale: s });
  }
  http(h: HttpConfig): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, http: h });
  }
  schedule(c: CronExpr): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, schedule: c });
  }
  timeout(t: string): DeployBuilder {
    return new DeployBuilder({ ...this._cfg, timeout: t });
  }

  toJSON(): DeployConfig {
    return this._cfg;
  }
}

export const Deploy: DeployBuilder = new DeployBuilder();

export class SecretRef {
  constructor(public readonly name: string) {}
  toJSON() {
    return { $secret: this.name };
  }
}

export const Secret = {
  from(name: string): SecretRef {
    return new SecretRef(name);
  },
};

export class CronExpr {
  constructor(public readonly expr: string, public readonly tz?: string) {}
  toJSON() {
    return { $cron: this.expr, tz: this.tz };
  }
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
  hourly(): CronExpr {
    return new CronExpr("0 * * * *");
  },
  expression(expr: string, tz?: string): CronExpr {
    return new CronExpr(expr, tz);
  },
};
