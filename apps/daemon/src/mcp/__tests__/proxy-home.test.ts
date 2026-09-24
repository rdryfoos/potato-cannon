import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import os from "os";
import path from "path";

import { cannonHome, getDaemonUrl } from "../daemon-url.js";

/**
 * Which daemon an agent's proxy talks to.
 *
 * POTATO_CANNON_HOME moves the Cannon's whole home and every other part of the daemon
 * honours it. This file read os.homedir() directly, so a second daemon started on
 * another port with its own home had agents that resolved the *first* daemon's
 * daemon.json, called its API and wrote to its board. Nothing agent-shaped could be
 * tested on a scratch daemon, which is why a live Buddy round trip could never be
 * proved on one.
 */
describe("the proxy finds the daemon it belongs to", () => {
  const saved = {
    home: process.env.POTATO_CANNON_HOME,
    host: process.env.POTATO_DAEMON_HOST,
    port: process.env.POTATO_DAEMON_PORT,
  };
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "proxy-home-"));
    delete process.env.POTATO_DAEMON_HOST;
    delete process.env.POTATO_DAEMON_PORT;
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
    for (const [key, value] of [
      ["POTATO_CANNON_HOME", saved.home],
      ["POTATO_DAEMON_HOST", saved.host],
      ["POTATO_DAEMON_PORT", saved.port],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("reads daemon.json from POTATO_CANNON_HOME when it is set", async () => {
    process.env.POTATO_CANNON_HOME = tmp;
    await fs.writeFile(path.join(tmp, "daemon.json"), JSON.stringify({ port: 4242 }));

    assert.strictEqual(cannonHome(), tmp);
    assert.strictEqual(await getDaemonUrl(), "http://localhost:4242");
  });

  it("does not fall through to the live installation's daemon.json", async () => {
    // The defect: a scratch home with no daemon.json still found the real one and
    // returned the running board's port. With the home honoured, a scratch home with
    // no file answers with the fallback instead of somebody else's daemon.
    process.env.POTATO_CANNON_HOME = tmp;
    assert.strictEqual(await getDaemonUrl(), "http://localhost:8443");
  });

  it("falls back to the real home when the variable is unset", async () => {
    delete process.env.POTATO_CANNON_HOME;
    assert.strictEqual(cannonHome(), path.join(os.homedir(), ".potato-cannon"));
  });

  it("ignores an empty or whitespace variable rather than reading /daemon.json", async () => {
    process.env.POTATO_CANNON_HOME = "   ";
    assert.strictEqual(cannonHome(), path.join(os.homedir(), ".potato-cannon"));
  });

  it("takes an explicit host and port over any file", async () => {
    // A proxy told where to go does not need to discover anything, and the session
    // spawner already sets these for the worker beside it.
    process.env.POTATO_CANNON_HOME = tmp;
    await fs.writeFile(path.join(tmp, "daemon.json"), JSON.stringify({ port: 4242 }));
    process.env.POTATO_DAEMON_HOST = "127.0.0.1";
    process.env.POTATO_DAEMON_PORT = "3131";

    assert.strictEqual(await getDaemonUrl(), "http://127.0.0.1:3131");
  });
});
