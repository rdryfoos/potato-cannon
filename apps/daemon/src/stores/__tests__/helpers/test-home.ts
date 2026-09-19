import fs from "fs";
import os from "os";
import path from "path";

/**
 * A Cannon home of this test run's own.
 *
 * Importing this module, before anything that reads config/paths.js, moves the
 * database, the templates and every other file the daemon keeps out of the
 * developer's live installation and into a temporary directory.
 *
 * It is a module rather than a line in the test file because ES modules
 * evaluate every import before any statement in the importing file: a
 * `process.env` assignment written above the imports still runs after them.
 * A side-effect import, placed first, is what actually runs first.
 */
export const TEST_HOME: string = fs.mkdtempSync(path.join(os.tmpdir(), "potato-test-home-"));

process.env.POTATO_CANNON_HOME = TEST_HOME;

export function removeTestHome(): void {
  fs.rmSync(TEST_HOME, { recursive: true, force: true });
}
