// Cron helpers. Pure value types — no transport, no IO.

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
