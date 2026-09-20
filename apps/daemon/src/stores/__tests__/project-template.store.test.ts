// First, before anything that reads config/paths.js: a Cannon home of this run's own.
// Until 2026-09-20 this file wrote its fixtures into the developer's live
// ~/.potato-cannon, beside real project data, because it built its paths from
// os.homedir() rather than from where the daemon was told to look. Two suite runs at
// once deleted each other's fixtures, and this file failed for reasons no commit
// explained: the cleanup swallowed its own errors, so the only trace was directories
// left behind in a live installation. Twenty-four had accumulated by then.
import { TEST_HOME, removeTestHome } from "./helpers/test-home.js";

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";

describe("project-template.store", () => {
  describe("hasProjectAgentOverride", () => {
    let testProjectDir: string;
    const potatoDir = TEST_HOME;
    const projectId = "test-override-check-" + Date.now();

    before(async () => {
      const projectDataDir = path.join(potatoDir, "project-data", projectId, "template", "agents");
      testProjectDir = projectDataDir;
      await fs.mkdir(projectDataDir, { recursive: true });
    });

    after(async () => {
      const projectDataDir = path.join(potatoDir, "project-data", projectId);
      await fs.rm(projectDataDir, { recursive: true, force: true }).catch(() => {});
    });

    it("should return true when override file exists", async () => {
      const { hasProjectAgentOverride } = await import("../project-template.store.js");

      // Create override file
      await fs.writeFile(path.join(testProjectDir, "refinement.override.md"), "override content");

      const result = await hasProjectAgentOverride(projectId, "agents/refinement.md");

      assert.strictEqual(result, true);
    });

    it("should return false when override file does not exist", async () => {
      const { hasProjectAgentOverride } = await import("../project-template.store.js");

      // Create standard agent file but not override
      await fs.writeFile(path.join(testProjectDir, "brainstorm.md"), "standard content");

      const result = await hasProjectAgentOverride(projectId, "agents/brainstorm.md");

      assert.strictEqual(result, false);
    });
  });

  describe("getProjectAgentOverride", () => {
    let testProjectDir: string;
    const potatoDir = TEST_HOME;
    const projectId = "test-override-read-" + Date.now();

    before(async () => {
      const projectDataDir = path.join(potatoDir, "project-data", projectId, "template", "agents");
      testProjectDir = projectDataDir;
      await fs.mkdir(projectDataDir, { recursive: true });
    });

    after(async () => {
      const projectDataDir = path.join(potatoDir, "project-data", projectId);
      await fs.rm(projectDataDir, { recursive: true, force: true }).catch(() => {});
    });

    it("should return override content when file exists", async () => {
      const { getProjectAgentOverride } = await import("../project-template.store.js");

      // Create override file
      await fs.writeFile(path.join(testProjectDir, "refinement.override.md"), "# Custom Override\n\nThis is custom content.");

      const result = await getProjectAgentOverride(projectId, "agents/refinement.md");

      assert.strictEqual(result, "# Custom Override\n\nThis is custom content.");
    });

    it("should throw when override file does not exist", async () => {
      const { getProjectAgentOverride } = await import("../project-template.store.js");

      const projectId2 = "test-override-no-file-" + Date.now();

      await assert.rejects(
        async () => getProjectAgentOverride(projectId2, "agents/nonexistent.md"),
        /ENOENT/
      );
    });
  });

  describe("saveProjectAgentOverride", () => {
    const potatoDir = TEST_HOME;
    const projectId = "test-save-override-" + Date.now();

    after(async () => {
      const projectDataDir = path.join(potatoDir, "project-data", projectId);
      await fs.rm(projectDataDir, { recursive: true, force: true }).catch(() => {});
    });

    it("should create override file and directories", async () => {
      const { saveProjectAgentOverride, getProjectAgentOverride } = await import("../project-template.store.js");

      await saveProjectAgentOverride(projectId, "agents/refinement.md", "# Custom Override Content");

      const content = await getProjectAgentOverride(projectId, "agents/refinement.md");
      assert.strictEqual(content, "# Custom Override Content");
    });

    it("should overwrite existing override file", async () => {
      const { saveProjectAgentOverride, getProjectAgentOverride } = await import("../project-template.store.js");

      await saveProjectAgentOverride(projectId, "agents/refinement.md", "First content");
      await saveProjectAgentOverride(projectId, "agents/refinement.md", "Updated content");

      const content = await getProjectAgentOverride(projectId, "agents/refinement.md");
      assert.strictEqual(content, "Updated content");
    });
  });

  describe("deleteProjectAgentOverride", () => {
    const potatoDir = TEST_HOME;
    const projectId = "test-delete-override-" + Date.now();

    before(async () => {
      const projectDataDir = path.join(potatoDir, "project-data", projectId, "template", "agents");
      await fs.mkdir(projectDataDir, { recursive: true });
    });

    after(async () => {
      const projectDataDir = path.join(potatoDir, "project-data", projectId);
      await fs.rm(projectDataDir, { recursive: true, force: true }).catch(() => {});
    });

    it("should delete existing override file", async () => {
      const { saveProjectAgentOverride, deleteProjectAgentOverride, hasProjectAgentOverride } = await import("../project-template.store.js");

      await saveProjectAgentOverride(projectId, "agents/refinement.md", "content");
      assert.strictEqual(await hasProjectAgentOverride(projectId, "agents/refinement.md"), true);

      await deleteProjectAgentOverride(projectId, "agents/refinement.md");

      assert.strictEqual(await hasProjectAgentOverride(projectId, "agents/refinement.md"), false);
    });

    it("should succeed when override file does not exist (idempotent)", async () => {
      const { deleteProjectAgentOverride } = await import("../project-template.store.js");

      // Should not throw
      await deleteProjectAgentOverride(projectId, "agents/nonexistent.md");
    });
  });
});

after(removeTestHome);
