// Secret references. Resolved at deploy time by the engine, never visible
// in user code as a raw value.

export class SecretRef {
  constructor(public readonly name: string) {}
  toJSON() { return { $secret: this.name }; }
}

export const Secret = {
  from(name: string): SecretRef {
    return new SecretRef(name);
  },
};
