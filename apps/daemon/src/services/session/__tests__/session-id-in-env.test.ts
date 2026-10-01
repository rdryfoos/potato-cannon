import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A worker can learn its own session id.
 *
 * `build.md` tells the Build worker to put `Session:` on every commit, read "from the
 * daemon's session list". There was no such list to read: no MCP tool returns a session,
 * there is no sessions route on the daemon, and the id was in no environment the worker
 * was given. Every worker that ever filled that trailer guessed at it, and the one on
 * the first Linux run wrote "unavailable", which was the only honest answer available.
 *
 * It is in the environment now, in both places a phase session gets one: the agent's own
 * process and the MCP proxy spawned beside it.
 *
 * From the source tree by cwd, because these tests run out of dist/ where there is no
 * .ts beside them. Same form as buddy-pen.test.ts, for the same reason.
 */
const src = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");

describe("POTATO_SESSION_ID", () => {
  const service = src("services/session/session.service.ts");

  it("is in the environment the agent itself is spawned with", () => {
    // The pty env block, identified by the line that follows it in the same call.
    const at = service.indexOf("const proc = pty.spawn(claudePath, args, {");
    assert.ok(at > 0, "the phase worker's spawn is not where this test thinks it is");
    const block = service.slice(at, at + 900);
    assert.match(block, /POTATO_SESSION_ID: sessionId/);
  });

  it("is in the environment the MCP proxy beside it is spawned with", () => {
    // Both halves of a session have to agree about which session they are: the agent
    // writes the trailer, and the proxy is what its tool calls arrive through.
    const at = service.indexOf("const mcpConfig = {");
    assert.ok(at > 0, "the MCP config is not where this test thinks it is");
    const block = service.slice(at, at + 600);
    assert.match(block, /POTATO_SESSION_ID: sessionId/);
  });

  it("is the id the session row is keyed by, not a second name for the same thing", () => {
    // `sessionId` is the row this spawn already records its pid against, two lines below
    // the env block. A worker whose trailer named a different id than the row would be
    // worse than one that wrote nothing: it would read as a record.
    assert.match(service, /setStoredSessionPid\(sessionId, proc\.pid \?\? null\)/);
  });
});
