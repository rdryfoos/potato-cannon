import { getProjects } from "./routes/projects.routes.js";

export interface HealthPayload {
  status: "ok";
  uptime: number;
  telegramMode: string;
  projectCount: number;
}

/**
 * What /health answers, read at the moment it is asked.
 *
 * The count used to come from the projects map the server captured at boot.
 * refreshProjects() replaces that map rather than mutating it, so the captured one
 * never changed again and a daemon reported the number of projects it started with for
 * as long as it ran. Registering a project and then asking the daemon whether it knew
 * about it gave the answer from before.
 *
 * It lives in its own file so that it can be asserted without starting a server.
 */
export function healthPayload(telegramMode: string): HealthPayload {
  return {
    status: "ok",
    uptime: process.uptime(),
    telegramMode,
    projectCount: getProjects().size,
  };
}
