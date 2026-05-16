import { DeployMeError } from "./errors.js";

export type LogLine = { kind: "out" | "err"; text: string; t: number };

/**
 * Open a server-sent-events stream and yield each `data:` JSON payload.
 * Returns an AsyncIterable that closes when the upstream closes or the
 * consumer breaks out of the loop.
 */
export async function* streamSSE(
  url: string,
  init: { headers: Record<string, string>; fetch: typeof fetch },
): AsyncIterable<LogLine> {
  const res = await init.fetch(url, { headers: init.headers });
  if (!res.ok || !res.body) {
    throw new DeployMeError(`SSE failed ${res.status}`, res.status, null);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        for (const line of frame.split("\n")) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6);
            try { yield JSON.parse(raw) as LogLine; } catch {}
          }
        }
      }
    }
  } finally {
    try { reader.cancel(); } catch {}
  }
}
