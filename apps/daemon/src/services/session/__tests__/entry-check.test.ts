import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import os from "os";

import {
  findEntryCheck,
  validateEntryChecks,
  runEntryCheck,
  checkPhaseEntry,
  type EntryCheckContext,
} from "../entry-check.js";
import { buildNewTemplate, applyTemplateUpdate } from "../../../stores/template.store.js";

describe("phase entry checks", () => {
  let dir: string;
  let projectDir: string;
  const script = (name: string) => path.join(dir, name);

  const ctx = (overrides: Partial<EntryCheckContext> = {}): EntryCheckContext => ({
    projectId: "proj-1",
    projectPath: projectDir,
    ticketId: "CHA-99",
    fromPhase: "Review",
    toPhase: "Done",
    ...overrides,
  });

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "potato-entry-check-"));
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), "potato-entry-project-"));
    const write = async (name: string, body: string) => {
      await fs.writeFile(script(name), `#!/bin/sh\n${body}\n`);
      await fs.chmod(script(name), 0o755);
    };
    await write("pass.sh", 'echo "all four facts hold"; exit 0');
    await write("refuse.sh", 'echo "line one"; echo "PR #35 is not merged" >&2; exit 1');
    await write(
      "env.sh",
      'echo "$POTATO_PROJECT_ID|$POTATO_TICKET_ID|$POTATO_FROM_PHASE|$POTATO_TO_PHASE|$(pwd -P)"; exit 3',
    );
    await write("slow.sh", "sleep 5; exit 0");
    await write("args.sh", 'for a in "$@"; do echo "arg=$a"; done; exit 1');
  });

  after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  describe("validateEntryChecks", () => {
    it("accepts an absent field and a well-formed check", () => {
      assert.strictEqual(validateEntryChecks(undefined), null);
      assert.strictEqual(validateEntryChecks({ Done: { command: ["/bin/true"] } }), null);
      assert.strictEqual(validateEntryChecks({ Done: { command: ["/bin/true"], timeoutSeconds: 30 } }), null);
    });

    it("refuses malformed checks, naming the phase", () => {
      assert.match(validateEntryChecks([]) ?? "", /object keyed by phase name/);
      assert.match(validateEntryChecks({ Done: {} }) ?? "", /entryChecks\.Done\.command/);
      assert.match(validateEntryChecks({ Done: { command: [] } }) ?? "", /non-empty array/);
      assert.match(validateEntryChecks({ Done: { command: ["ok", 3] } }) ?? "", /non-empty strings/);
      assert.match(validateEntryChecks({ Done: { command: ["ok"], timeoutSeconds: 0 } }) ?? "", /positive number/);
    });
  });

  describe("findEntryCheck", () => {
    it("finds a check keyed by an injected phase name and nothing for other phases", () => {
      const template = { entryChecks: { Done: { command: ["x"] } } };
      assert.deepStrictEqual(findEntryCheck(template, "Done"), { command: ["x"] });
      assert.strictEqual(findEntryCheck(template, "Review"), null);
      assert.strictEqual(findEntryCheck({}, "Done"), null);
      assert.strictEqual(findEntryCheck(null, "Done"), null);
    });
  });

  describe("runEntryCheck", () => {
    it("allows the move when the command exits zero", async () => {
      const r = await runEntryCheck({ command: [script("pass.sh")] }, ctx());
      assert.strictEqual(r.allowed, true);
      assert.match(r.reason, /all four facts hold/);
    });

    it("refuses the move on a nonzero exit, with the exit and the command's last lines", async () => {
      const r = await runEntryCheck({ command: [script("refuse.sh")] }, ctx());
      assert.strictEqual(r.allowed, false);
      assert.match(r.reason, /entry check exited 1/);
      assert.match(r.reason, /PR #35 is not merged/);
    });

    it("passes the ticket, project and both phases in the environment, and runs in the project path", async () => {
      const r = await runEntryCheck({ command: [script("env.sh")] }, ctx());
      assert.strictEqual(r.allowed, false);
      const real = await fs.realpath(projectDir);
      assert.match(r.reason, new RegExp(`proj-1\\|CHA-99\\|Review\\|Done\\|${real.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    });

    it("refuses on timeout", async () => {
      const started = Date.now();
      const r = await runEntryCheck({ command: [script("slow.sh")], timeoutSeconds: 0.5 }, ctx());
      assert.strictEqual(r.allowed, false);
      assert.match(r.reason, /timed out after 0.5s/);
      assert.ok(Date.now() - started < 4000, "the timeout, not the script, ended the check");
    });

    it("refuses when the program cannot be started", async () => {
      const r = await runEntryCheck({ command: [path.join(dir, "does-not-exist.sh")] }, ctx());
      assert.strictEqual(r.allowed, false);
      assert.match(r.reason, /could not run \(ENOENT\)/);
    });

    it("passes arguments verbatim without a shell", async () => {
      const marker = path.join(dir, "injected");
      const r = await runEntryCheck({ command: [script("args.sh"), `$(touch ${marker})`, "a b"] }, ctx());
      assert.match(r.reason, new RegExp(`arg=\\$\\(touch ${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`));
      assert.match(r.reason, /arg=a b/);
      await assert.rejects(fs.access(marker), "no shell ran the argument");
    });
  });

  describe("checkPhaseEntry", () => {
    const withCheck = async () => ({ entryChecks: { Done: { command: [script("refuse.sh")] } } });

    it("returns null when the target phase has no check", async () => {
      assert.strictEqual(await checkPhaseEntry(ctx({ toPhase: "Review" }), withCheck), null);
      assert.strictEqual(await checkPhaseEntry(ctx(), async () => null), null);
    });

    it("runs the configured check for the target phase", async () => {
      const r = await checkPhaseEntry(ctx(), withCheck);
      assert.strictEqual(r?.allowed, false);
      assert.match(r?.reason ?? "", /PR #35 is not merged/);
    });

    it("fails closed when a check is configured but the project has no known path", async () => {
      let ran = false;
      const r = await checkPhaseEntry(ctx({ projectPath: undefined }), withCheck, async () => {
        ran = true;
        return { allowed: true, reason: "" };
      });
      assert.strictEqual(ran, false);
      assert.strictEqual(r?.allowed, false);
      assert.match(r?.reason ?? "", /no known path/);
    });
  });

  describe("templates carry entryChecks", () => {
    it("keeps them on create, keeps them when an update omits them, and replaces or clears them when given", () => {
      const created = buildNewTemplate("t", "test", [], { Done: { command: ["/bin/true"] } });
      assert.deepStrictEqual(created.entryChecks, { Done: { command: ["/bin/true"] } });
      assert.strictEqual("entryChecks" in buildNewTemplate("t", "test", []), false, "absent when not given");

      const edited = applyTemplateUpdate(created, { description: "edited", phases: [] });
      assert.deepStrictEqual(edited.entryChecks, { Done: { command: ["/bin/true"] } },
        "an update that omits entryChecks, as the template editor's does, keeps them");
      assert.strictEqual(edited.version, "1.0.1");

      const replaced = applyTemplateUpdate(edited, { entryChecks: { Done: { command: ["/bin/false"], timeoutSeconds: 5 } } });
      assert.deepStrictEqual(replaced.entryChecks, { Done: { command: ["/bin/false"], timeoutSeconds: 5 } });

      assert.deepStrictEqual(applyTemplateUpdate(replaced, { entryChecks: {} }).entryChecks, {});
    });
  });
});
