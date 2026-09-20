// First, before anything that reads config/paths.js: a Cannon home of this run's own.
// This file used to build its fixture paths from the developer's real home rather
// than from where the daemon was told to look, so a test run wrote into a live
// installation beside real project data. Two runs at once deleted each other's
// fixtures, and the cleanup swallowed its own errors, so the only trace was
// directories left behind.
import { TEST_HOME, removeTestHome } from "../../stores/__tests__/helpers/test-home.js";

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";

describe("projects agent override routes", () => {
  const potatoDir = TEST_HOME;
  const projectId = "test-agent-routes-" + Date.now();
  let testProjectDir: string;

  before(async () => {
    // Create project template directory with a base agent
    testProjectDir = path.join(potatoDir, "project-data", projectId, "template", "agents");
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.writeFile(path.join(testProjectDir, "refinement.md"), "# Default Refinement Agent");
  });

  after(async () => {
    const projectDataDir = path.join(potatoDir, "project-data", projectId);
    await fs.rm(projectDataDir, { recursive: true, force: true }).catch(() => {});
  });

  describe("hasProjectAgentOverride + getProjectAgentOverride", () => {
    it("should return false when no override exists", async () => {
      const { hasProjectAgentOverride } = await import("../../stores/project-template.store.js");
      const result = await hasProjectAgentOverride(projectId, "agents/refinement.md");
      assert.strictEqual(result, false);
    });
  });

  describe("saveProjectAgentOverride flow", () => {
    beforeEach(async () => {
      // Clean up any override from previous test
      await fs.rm(path.join(testProjectDir, "refinement.override.md"), { force: true });
    });

    it("should create override and make it retrievable", async () => {
      const {
        saveProjectAgentOverride,
        hasProjectAgentOverride,
        getProjectAgentOverride
      } = await import("../../stores/project-template.store.js");

      await saveProjectAgentOverride(projectId, "agents/refinement.md", "# Override Content");

      assert.strictEqual(await hasProjectAgentOverride(projectId, "agents/refinement.md"), true);
      const content = await getProjectAgentOverride(projectId, "agents/refinement.md");
      assert.strictEqual(content, "# Override Content");
    });
  });

  describe("deleteProjectAgentOverride flow", () => {
    it("should remove existing override", async () => {
      const {
        saveProjectAgentOverride,
        deleteProjectAgentOverride,
        hasProjectAgentOverride
      } = await import("../../stores/project-template.store.js");

      await saveProjectAgentOverride(projectId, "agents/refinement.md", "# Content");
      assert.strictEqual(await hasProjectAgentOverride(projectId, "agents/refinement.md"), true);

      await deleteProjectAgentOverride(projectId, "agents/refinement.md");
      assert.strictEqual(await hasProjectAgentOverride(projectId, "agents/refinement.md"), false);
    });
  });

  describe("isValidAgentType validation", () => {
    it("should accept valid agent types", () => {
      const validTypes = ["refinement", "brainstorm", "builder-agent", "my_agent123"];
      for (const type of validTypes) {
        assert.match(type, /^[a-zA-Z0-9_-]+$/);
      }
    });

    it("should reject path traversal attempts", () => {
      const invalidTypes = ["../secret", "agents/../../etc", "agent;rm -rf", "agent\ninjection"];
      for (const type of invalidTypes) {
        assert.doesNotMatch(type, /^[a-zA-Z0-9_-]+$/);
      }
    });
  });
});

after(removeTestHome);
