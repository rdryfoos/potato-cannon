import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/**
 * Where the MCP proxy looks for the daemon it belongs to.
 *
 * POTATO_CANNON_HOME moves the Cannon's whole home and every other part of the daemon
 * honours it; the proxy did not, and read os.homedir() directly. So a second daemon
 * started on another port with its own home had agents that talked to the first one:
 * they resolved the first daemon's daemon.json, called its API, and wrote to its
 * board. Nothing agent-shaped could be tested on a scratch daemon, which is why a live
 * Buddy round trip could not be proved on one.
 *
 * It lives here rather than in proxy.ts because importing proxy.ts starts a proxy:
 * its top level demands POTATO_PROJECT_ID and opens a stdio transport. A path cannot
 * be tested through a process.
 */
export function cannonHome(): string {
  return process.env.POTATO_CANNON_HOME?.trim() || path.join(os.homedir(), '.potato-cannon');
}

export async function getDaemonUrl(): Promise<string> {
  // A host and port given outright beat the file: a proxy told where to go does not
  // need to discover anything, and the session spawner already sets these for the
  // worker beside it.
  const host = process.env.POTATO_DAEMON_HOST?.trim();
  const port = process.env.POTATO_DAEMON_PORT?.trim();
  if (port) return `http://${host || 'localhost'}:${port}`;

  const daemonFile = path.join(cannonHome(), 'daemon.json');
  try {
    const data = JSON.parse(await fs.readFile(daemonFile, 'utf-8'));
    return `http://${host || 'localhost'}:${data.port}`;
  } catch {
    return 'http://localhost:8443';
  }
}
