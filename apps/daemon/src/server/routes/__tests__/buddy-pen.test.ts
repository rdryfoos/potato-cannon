import { describe, it } from "node:test";
import assert from "node:assert";
import { penFor } from "../ticket-chat.routes.js";
import { buildAdhocChatArgs } from "../../../services/session/adhoc-chat-runner.js";

/**
 * What Buddy may do, and where.
 *
 * On 2026-09-27 a reader said "I was hoping it would be centered". Buddy judged it
 * within the card correctly, in about a minute, and then handed the change back for
 * the reader to type by hand, because it had no pen. The rules it writes under landed
 * first, in `cannon-template/agents/ticket-qa.md`; this is the powers, and the powers
 * arrive after the rules on purpose.
 */

const WORKTREE = "/p/.potato/worktrees/BAN-1";

function tools(args: string[], flag: string): string {
  const at = args.indexOf(flag);
  assert.ok(at >= 0, `${flag} is not in the arguments`);
  return args[at + 1]!;
}

describe("which column hands over the pen", () => {
  it("Review does", () => {
    assert.deepStrictEqual(penFor("Review", "/p", "BAN-1"), { worktree: WORKTREE });
  });

  it("and is not fussy about how it is spelled", () => {
    assert.ok(penFor("review", "/p", "BAN-1"));
    assert.ok(penFor(" Review ", "/p", "BAN-1"));
  });

  it("no other column does", () => {
    // Every other column has a worker of its own, or has not started: an agent writing
    // into those is writing over somebody mid-attempt, or ahead of the spec that would
    // have said what to write.
    for (const phase of ["Ideas", "Spec", "Build", "Gate", "Done", "Blocked", ""]) {
      assert.strictEqual(penFor(phase, "/p", "BAN-1"), null, phase || "(empty)");
    }
    assert.strictEqual(penFor(undefined, "/p", "BAN-1"), null);
  });

  it("points at the card's own worktree and not at the project", () => {
    const pen = penFor("Review", "/p", "BAN-2");
    assert.strictEqual(pen?.worktree, "/p/.potato/worktrees/BAN-2");
  });
});

describe("the powers that go with it", () => {
  const read = buildAdhocChatArgs({}, "hello");
  const pen = buildAdhocChatArgs({}, "hello", undefined, { worktree: WORKTREE });

  it("without the pen, writing and the shell are refused", () => {
    assert.strictEqual(tools(read, "--allowedTools"), "Read,Grep,Glob");
    for (const denied of ["Edit", "Write", "Bash", "WebFetch", "WebSearch"]) {
      assert.ok(
        tools(read, "--disallowedTools").includes(denied),
        `${denied} should be refused without the pen`,
      );
    }
  });

  it("with it, Edit, Write and Bash are allowed", () => {
    // The shell is the point: the commit, the tests and the Gate all run through it.
    for (const allowed of ["Edit", "Write", "Bash"]) {
      assert.ok(tools(pen, "--allowedTools").includes(allowed), allowed);
    }
  });

  it("the network stays refused either way", () => {
    // No change to a card's own files ever needs it, and it is the one power whose
    // absence cannot be checked afterwards by reading the branch.
    for (const args of [read, pen]) {
      assert.ok(tools(args, "--disallowedTools").includes("WebFetch"));
      assert.ok(tools(args, "--disallowedTools").includes("WebSearch"));
    }
  });

  it("the session is pointed at the worktree, and only when there is a pen", () => {
    const at = pen.indexOf("--add-dir");
    assert.ok(at >= 0, "the pen does not name the worktree");
    assert.strictEqual(pen[at + 1], WORKTREE);
    assert.strictEqual(read.indexOf("--add-dir"), -1, "a read-only session names a dir");
  });

  it("a null pen is a read-only pen, so a phase that returns null cannot write", () => {
    // The two are wired together: penFor returns null for every column but Review, and
    // null here is the read-only argument set. This is the whole gate, in one line.
    const none = buildAdhocChatArgs({}, "hello", undefined, penFor("Build", "/p", "BAN-1"));
    assert.strictEqual(tools(none, "--allowedTools"), "Read,Grep,Glob");
    assert.ok(tools(none, "--disallowedTools").includes("Write"));
  });
});
