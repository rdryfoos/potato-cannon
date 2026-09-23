// A Cannon home of this run's own, before anything reads config/paths.js.
import { TEST_HOME } from "../../stores/__tests__/helpers/test-home.js";
void TEST_HOME;

import { describe, it } from "node:test";
import assert from "node:assert";

import { healthPayload } from "../health.js";
import { getProjects } from "../routes/projects.routes.js";

/**
 * /health's projectCount, and why it was a lie.
 *
 * The server read `const projects = getProjects()` once, at boot, and the handler
 * closed over that map. refreshProjects() replaces the map rather than mutating it, so
 * the captured one never changed again: a daemon that had been up since before a
 * project was registered reported the count it booted with, for ever. The one number a
 * person uses to check the daemon knows about their project was the one number that
 * could not tell them.
 */
describe("/health reports what is true now", () => {
  it("reads the project count at the moment it is asked", () => {
    const before = healthPayload("none").projectCount;
    assert.strictEqual(before, getProjects().size);
  });

  it("follows a registration made after boot", () => {
    // What the captured map could not do. The map getProjects() returns is replaced by
    // refreshProjects(); holding one is holding a photograph.
    const first = getProjects();
    const captured = first.size;

    first.set("registered-after-boot", {
      id: "registered-after-boot",
      path: "/tmp/does-not-need-to-exist",
      displayName: "later",
    } as never);

    assert.strictEqual(
      healthPayload("none").projectCount,
      captured + 1,
      "the count moved with the registration",
    );

    first.delete("registered-after-boot");
    assert.strictEqual(healthPayload("none").projectCount, captured);
  });

  it("still answers ok, with an uptime and the telegram mode it was given", () => {
    const payload = healthPayload("polling");
    assert.strictEqual(payload.status, "ok");
    assert.strictEqual(payload.telegramMode, "polling");
    assert.ok(payload.uptime > 0);
  });
});
