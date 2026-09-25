import { describe, it } from "node:test";
import assert from "node:assert";
import { scriptCommand, whichCommand, findBash } from "../windows-exec.js";

/**
 * A project's own scripts, started on the machine the reader is on.
 *
 * On 2026-09-25 the first Windows run of Bang reached the board and then could not move
 * a card: dragging it to Spec was refused with `spawn EFTYPE`, Node's way of saying it
 * was handed a file Windows will not execute. The file was `scripts/column-entry.sh`.
 *
 * Every test here passes the platform in, because the only machine this was written on
 * is a Mac and a Windows behaviour nobody can run is a Windows behaviour nobody can
 * check. The first group is the one that matters most: nothing changes off Windows.
 */

const bash = () => "C:\\Program Files\\Git\\bin\\bash.exe";

describe("running a project script off Windows", () => {
  for (const platform of ["darwin", "linux"]) {
    it(`hands ${platform} the script itself, unchanged, because the shebang runs it`, () => {
      const cmd = scriptCommand("/p/scripts/column-entry.sh", ["Spec"], platform, bash);
      assert.strictEqual(cmd.program, "/p/scripts/column-entry.sh");
      assert.deepStrictEqual(cmd.args, ["Spec"]);
    });

    it(`asks ${platform} for a program with which`, () => {
      assert.strictEqual(whichCommand("claude", platform), "which claude");
    });
  }
});

describe("running a project script on Windows", () => {
  it("puts bash in front of a .sh, which is the EFTYPE fixed", () => {
    const cmd = scriptCommand("C:\\p\\scripts\\column-entry.sh", ["Spec"], "win32", bash);
    assert.strictEqual(cmd.program, bash());
    assert.deepStrictEqual(cmd.args, ["C:\\p\\scripts\\column-entry.sh", "Spec"]);
  });

  it("does the same for try.sh, which takes no arguments", () => {
    const cmd = scriptCommand("C:\\p\\.potato\\worktrees\\BAN-1\\scripts\\try.sh", [], "win32", bash);
    assert.strictEqual(cmd.program, bash());
    assert.deepStrictEqual(cmd.args, ["C:\\p\\.potato\\worktrees\\BAN-1\\scripts\\try.sh"]);
  });

  it("runs a .cmd through cmd.exe, the only thing that runs a batch file", () => {
    const cmd = scriptCommand("C:\\p\\scripts\\check.cmd", ["Gate"], "win32", bash);
    assert.strictEqual(cmd.program, "cmd.exe");
    assert.deepStrictEqual(cmd.args, ["/c", "C:\\p\\scripts\\check.cmd", "Gate"]);
  });

  it("runs a .ps1 through powershell, bypassing the policy a cold account is on", () => {
    const cmd = scriptCommand("C:\\p\\scripts\\check.ps1", ["Gate"], "win32", bash);
    assert.strictEqual(cmd.program, "powershell.exe");
    assert.deepStrictEqual(cmd.args, [
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "C:\\p\\scripts\\check.ps1", "Gate",
    ]);
  });

  it("leaves an .exe alone, because it needs no help", () => {
    const cmd = scriptCommand("C:\\p\\tool.exe", ["x"], "win32", bash);
    assert.strictEqual(cmd.program, "C:\\p\\tool.exe");
    assert.deepStrictEqual(cmd.args, ["x"]);
  });

  it("leaves a file with no extension alone rather than guessing at it", () => {
    const cmd = scriptCommand("C:\\p\\scripts\\pre-commit", [], "win32", bash);
    assert.strictEqual(cmd.program, "C:\\p\\scripts\\pre-commit");
  });

  it("does not care how the extension is spelled", () => {
    assert.strictEqual(scriptCommand("C:\\p\\a.SH", [], "win32", bash).program, bash());
    assert.strictEqual(scriptCommand("C:\\p\\a.Cmd", [], "win32", bash).program, "cmd.exe");
  });

  it("asks Windows for a program with where, since which is not a Windows command", () => {
    // All ten of the daemon's `which` calls would have failed here, in the worker
    // launch, after the EFTYPE above was out of the way.
    assert.strictEqual(whichCommand("claude", "win32"), "where claude");
  });

  it("falls back to a bare bash rather than nothing, so the error names bash", () => {
    // A reader can act on "bash: not found". They cannot act on EFTYPE.
    assert.ok(findBash("win32").length > 0);
  });
});

describe("the call sites, on a fake win32", () => {
  // Run, not read. Both take the platform so the Windows path can be exercised from a
  // Mac; each is handed a fake runner and asked what command it produced.
  type Call = { program: string; args: string[] };

  function recorder(calls: Call[]) {
    return ((program: string, args: string[], _opts: unknown, cb: Function) => {
      calls.push({ program, args });
      cb(null, "", "");
      return {} as never;
    }) as never;
  }

  const ctx = {
    projectId: "p", ticketId: "BAN-1", projectPath: "/p",
    fromPhase: "Ideas", toPhase: "Spec",
  };

  it("the column entry check asks bash to run column-entry.sh", async () => {
    const { runEntryCheck } = await import("../../services/session/entry-check.js");
    const calls: Call[] = [];
    await runEntryCheck(
      { command: ["scripts/column-entry.sh", "Spec"] }, ctx, "win32", recorder(calls));
    assert.strictEqual(calls.length, 1, "the entry check never ran anything");
    assert.match(calls[0]!.program, /bash/i);
    assert.deepStrictEqual(calls[0]!.args, ["scripts/column-entry.sh", "Spec"]);
  });

  it("and hands it the script itself on a Mac, which is the EFTYPE-free case", async () => {
    const { runEntryCheck } = await import("../../services/session/entry-check.js");
    const calls: Call[] = [];
    await runEntryCheck(
      { command: ["scripts/column-entry.sh", "Spec"] }, ctx, "darwin", recorder(calls));
    assert.strictEqual(calls[0]!.program, "scripts/column-entry.sh");
    assert.deepStrictEqual(calls[0]!.args, ["Spec"]);
  });
});
