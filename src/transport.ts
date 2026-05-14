// HTTP transport for the deploy.me control-plane.
// Keeps auth, error mapping, and retry logic in one place so the public
// API classes don't have to think about it.

export class DeployMeError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "DeployMeError";
    this.status = status;
    this.body = body;
  }
}

export type TransportOptions = {
  baseUrl: string;
  token: string;
  /** Optional fetch override (Node 18+, Bun, Deno, browsers all have global fetch). */
  fetch?: typeof fetch;
  /** Per-request timeout in ms. Default 30s. */
  timeoutMs?: number;
  /** Number of automatic retries on transient 5xx / network errors. Default 2. */
  retries?: number;
};

export class Transport {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(opts: TransportOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.token = opts.token;
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.retries = opts.retries ?? 2;
    if (typeof this.fetchImpl !== "function") {
      throw new Error("deploy.me SDK: global fetch is not available; pass `fetch` in client opts");
    }
  }

  async request<T = unknown>(
    method: "GET" | "POST" | "DELETE" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      authorization: `Bearer ${this.token}`,
      accept: "application/json",
    };
    if (body !== undefined) headers["content-type"] = "application/json";

    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await this.fetchImpl(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);

        const text = await res.text();
        const parsed = text ? safeJson(text) : null;
        if (!res.ok) {
          // Retry on 5xx; bubble up everything else.
          if (res.status >= 500 && attempt < this.retries) {
            await backoff(attempt);
            lastErr = new DeployMeError(`HTTP ${res.status}`, res.status, parsed);
            continue;
          }
          const msg =
            (parsed && typeof parsed === "object" && "error" in (parsed as any) && (parsed as any).error) ||
            `HTTP ${res.status}`;
          throw new DeployMeError(msg, res.status, parsed);
        }
        return parsed as T;
      } catch (err: any) {
        clearTimeout(timer);
        if (err instanceof DeployMeError) throw err;
        // Network / abort — retry up to `retries`.
        if (attempt < this.retries) {
          await backoff(attempt);
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    throw lastErr ?? new Error("deploy.me SDK: request failed");
  }
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

function backoff(attempt: number): Promise<void> {
  const ms = Math.min(2000, 150 * Math.pow(2, attempt));
  return new Promise((r) => setTimeout(r, ms));
}
