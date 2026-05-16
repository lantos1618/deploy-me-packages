import { describe, test, expect } from "bun:test";
import { mapEngineStatus } from "./types.js";

describe("mapEngineStatus", () => {
  test("running → live", () => {
    expect(mapEngineStatus("running")).toBe("live");
  });
  test("created → deploying", () => {
    expect(mapEngineStatus("created")).toBe("deploying");
  });
  test("restarting → deploying", () => {
    expect(mapEngineStatus("restarting")).toBe("deploying");
  });
  test("exited → stopped", () => {
    expect(mapEngineStatus("exited")).toBe("stopped");
  });
  test("removing → stopped", () => {
    expect(mapEngineStatus("removing")).toBe("stopped");
  });
  test("dead → failed", () => {
    expect(mapEngineStatus("dead")).toBe("failed");
  });
  test("unknown engine state falls back to failed, not live", () => {
    expect(mapEngineStatus("garbage")).toBe("failed");
    expect(mapEngineStatus("")).toBe("failed");
    expect(mapEngineStatus("paused")).toBe("failed");
  });
});
