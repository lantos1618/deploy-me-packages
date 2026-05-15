import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { visibleLen, statusBadge, table, getToken, getBaseUrl } from "./util.js";

describe("visibleLen", () => {
  test("counts plain ascii", () => {
    expect(visibleLen("hello")).toBe(5);
  });
  test("ignores ANSI color escapes", () => {
    expect(visibleLen("\x1b[31mred\x1b[0m")).toBe(3);
  });
  test("ignores multi-segment SGR sequences", () => {
    expect(visibleLen("\x1b[38;2;192;56;38mflare\x1b[0m")).toBe(5);
  });
  test("empty string is zero", () => {
    expect(visibleLen("")).toBe(0);
  });
});

describe("statusBadge", () => {
  test("live → green ●", () => {
    expect(visibleLen(statusBadge("live"))).toBe(visibleLen("● live"));
    expect(statusBadge("live")).toMatch(/● live/);
  });
  test("deploying → camo ●", () => {
    expect(statusBadge("deploying")).toMatch(/● deploying/);
  });
  test("stopped → mute ○", () => {
    expect(statusBadge("stopped")).toMatch(/○ stopped/);
  });
  test("unknown status falls back to red ●", () => {
    expect(statusBadge("crashloop")).toMatch(/● crashloop/);
  });
  test("visible width matches the bare label for known statuses", () => {
    expect(visibleLen(statusBadge("live"))).toBe("● live".length);
    expect(visibleLen(statusBadge("deploying"))).toBe("● deploying".length);
    expect(visibleLen(statusBadge("stopped"))).toBe("○ stopped".length);
  });
});

describe("table", () => {
  let lines: string[];
  let originalLog: typeof console.log;

  beforeEach(() => {
    lines = [];
    originalLog = console.log;
    console.log = (...args: unknown[]) => { lines.push(args.join(" ")); };
  });
  afterEach(() => { console.log = originalLog; });

  test("empty rows prints (no rows) and skips the header", () => {
    table(["a", "b"], []);
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/no rows/);
  });
  test("header row is uppercased", () => {
    table(["name", "url"], [["foo", "http://x"]]);
    expect(visibleLen(lines[0]!)).toBeGreaterThanOrEqual(visibleLen("NAME  URL"));
    expect(lines[0]).toMatch(/NAME/);
    expect(lines[0]).toMatch(/URL/);
  });
  test("columns are padded so subsequent rows align", () => {
    table(["a", "b"], [["short", "x"], ["muchlonger", "y"]]);
    // first body row index = 1
    const row1 = lines[1]!;
    const row2 = lines[2]!;
    expect(visibleLen(row1)).toBe(visibleLen(row2));
  });
  test("missing cells are tolerated", () => {
    expect(() => table(["a", "b", "c"], [["one"]])).not.toThrow();
  });
});

describe("getToken", () => {
  let originalEnv: NodeJS.ProcessEnv;
  beforeEach(() => { originalEnv = { ...process.env }; });
  afterEach(() => { process.env = originalEnv; });

  test("returns DEPLOY_ME_TOKEN when set", () => {
    process.env.DEPLOY_ME_TOKEN = "abc";
    delete process.env.DEPLOYME_TOKEN;
    expect(getToken()).toBe("abc");
  });
  test("falls back to legacy DEPLOYME_TOKEN", () => {
    delete process.env.DEPLOY_ME_TOKEN;
    process.env.DEPLOYME_TOKEN = "legacy";
    expect(getToken()).toBe("legacy");
  });
  test("DEPLOY_ME_TOKEN takes precedence over legacy", () => {
    process.env.DEPLOY_ME_TOKEN = "new";
    process.env.DEPLOYME_TOKEN = "old";
    expect(getToken()).toBe("new");
  });
});

describe("getBaseUrl", () => {
  let originalEnv: NodeJS.ProcessEnv;
  beforeEach(() => { originalEnv = { ...process.env }; });
  afterEach(() => { process.env = originalEnv; });

  test("returns env value when set", () => {
    process.env.DEPLOY_ME_API_URL = "https://staging.deploy.me";
    expect(getBaseUrl()).toBe("https://staging.deploy.me");
  });
  test("returns undefined when unset", () => {
    delete process.env.DEPLOY_ME_API_URL;
    expect(getBaseUrl()).toBeUndefined();
  });
  test("returns undefined for empty string (so SDK default kicks in)", () => {
    process.env.DEPLOY_ME_API_URL = "";
    expect(getBaseUrl()).toBeUndefined();
  });
});
