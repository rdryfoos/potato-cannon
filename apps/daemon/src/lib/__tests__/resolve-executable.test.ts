import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { resolveExecutable } from "../windows-exec.js";

/**
 * A command that cannot be found is an error, not an empty string.
 *
 * `whichSync` returns "" when it finds nothing. Seven call sites had written a fallback
 * into a `catch` block, which therefore never ran: `claudePath` became "", and
 * `pty.spawn("", args)` starts a shell. On the Mini on 2026-10-05 the shell was handed
 * Claude Code's flags and said so, into a session log nobody reads:
 *
 *     sh: --dangerously-skip-permissions: invalid option
 *
 * Every phase worker died in under half a second with exit 2, and the board showed a
 * session that started and ended. The daemon there runs under a scrubbed PATH with no
 * ~/.local/bin, which is the ordinary case this was supposed to survive.
 */
describe("resolveExecutable", () => {
  it("returns what is on PATH when something is", () => {
    // `ls` is on PATH everywhere this runs.
    const found = resolveExecutable("ls");
    assert.ok(found.length > 0, "found an empty path for ls");
    assert.ok(fs.existsSync(found), `${found} does not exist`);
  });

  it("falls back to a named path that exists, which the old shape never did", () => {
    const real = resolveExecutable("ls");
    const found = resolveExecutable("a-command-no-machine-has-xyzzy", [real]);
    assert.equal(found, real);
  });

  it("skips fallbacks that do not exist and takes the first that does", () => {
    const real = resolveExecutable("ls");
    const found = resolveExecutable("a-command-no-machine-has-xyzzy", [
      path.join(os.tmpdir(), "no-such-thing-here-1"),
      path.join(os.tmpdir(), "no-such-thing-here-2"),
      real,
    ]);
    assert.equal(found, real);
  });

  it("throws rather than handing back an empty command", () => {
    // The whole defect in one assertion. "" is the one answer a caller cannot use, and
    // it is what the old shape returned.
    assert.throws(
      () => resolveExecutable("a-command-no-machine-has-xyzzy", [
        path.join(os.tmpdir(), "no-such-thing-here"),
      ]),
      (err: Error) => {
        assert.match(err.message, /a-command-no-machine-has-xyzzy is not on PATH/);
        assert.match(err.message, /none of its fallbacks exist/);
        return true;
      },
    );
  });

  it("says what PATH was, because that is the thing to look at", () => {
    // The Mini's failure was a PATH question, and nothing in the old message said so.
    assert.throws(
      () => resolveExecutable("a-command-no-machine-has-xyzzy"),
      (err: Error) => {
        assert.match(err.message, /PATH was:/);
        return true;
      },
    );
  });

  it("throws with no fallbacks given, rather than returning the name", () => {
    assert.throws(() => resolveExecutable("a-command-no-machine-has-xyzzy", []));
  });
});
