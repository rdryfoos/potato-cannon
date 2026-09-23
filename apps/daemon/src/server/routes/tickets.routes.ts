import type { Express, Request, Response } from "express";
import path from "path";
import multer from "multer";
import { eventBus } from "../../utils/event-bus.js";
import { TASKS_DIR } from "../../config/paths.js";
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  archiveTicket,
  restoreTicket,
  listTicketImages,
  saveTicketImage,
  deleteTicketImage,
  listArtifacts,
  getArtifactContent,
  saveArtifact,
  loadConversations,
  appendConversation,
} from "../../stores/ticket.store.js";
import { DEFAULT_PHASES } from "../../types/index.js";
import { readQuestion, writeResponse, clearQuestion } from "../../stores/chat.store.js";
import { getActiveSessionForTicket } from "../../stores/session.store.js";
import { getMessages, addMessage } from "../../stores/conversation.store.js";
import { updateBrainstorm } from "../../stores/brainstorm.store.js";
import type { SessionService } from "../../services/session/index.js";
import type { Project } from "../../types/config.types.js";
import type { TicketPhase } from "../../types/ticket.types.js";
import { resolveTargetPhase, getPhaseConfig, orderedPhases } from "../../services/session/phase-config.js";
import { getWipStatus } from "../../services/session/wip.js";
import { checkPhaseEntry } from "../../services/session/entry-check.js";
import { chatService } from "../../services/chat.service.js";
import { applyEdit, setLine } from "../../services/card-description.js";
import { CANNON, callerSpeaker } from "../../services/speaker.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export function registerTicketRoutes(
  app: Express,
  sessionService: SessionService,
  getProjects: () => Map<string, Project>,
): void {
  // List tickets
  app.get("/api/tickets/:project", async (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.project);
      const phase = (req.query.phase as TicketPhase) || null;
      const archivedParam = req.query.archived as string | undefined;

      // Parse archived parameter: "true" = only archived, "false" or absent = non-archived
      let archived: boolean | undefined;
      if (archivedParam === "true") {
        archived = true;
      } else if (archivedParam === "false") {
        archived = false;
      }
      // If archivedParam is undefined, archived stays undefined (default = false in store)

      const tickets = await listTickets(projectId, { phase, archived });
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create ticket
  app.post("/api/tickets/:project", async (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.project);
      const { title, description, brainstormId, ticketNumber, epicId } = req.body as {
        title?: string;
        description?: string;
        brainstormId?: string;
        ticketNumber?: string;
        epicId?: string;
      };

      if (!title) {
        res.status(400).json({ error: "Missing title" });
        return;
      }

      if (epicId) {
        const { getEpicById: getEpic } = await import("../../stores/epic.store.js");
        const epic = getEpic(epicId);
        if (!epic) {
          res.status(400).json({ error: "Epic not found" });
          return;
        }
        if (epic.projectId !== projectId) {
          res.status(400).json({ error: "Epic belongs to a different project" });
          return;
        }
      }

      const ticket = await createTicket(projectId, { title, description, ticketNumber, epicId });
      eventBus.emit("ticket:created", { projectId, ticket });

      // Link brainstorm to created ticket
      if (brainstormId) {
        try {
          const brainstorm = await updateBrainstorm(projectId, brainstormId, {
            createdTicketId: ticket.id,
          });
          if (brainstorm) {
            eventBus.emit('brainstorm:updated', { projectId, brainstorm });
          }
        } catch (err) {
          console.error(`[createTicket] Failed to link brainstorm ${brainstormId}: ${(err as Error).message}`);
        }
      }

      res.json(ticket);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "VALIDATION_ERROR") {
        res.status(400).json({ error: err.message });
      } else if (err.code === "CONFLICT_ERROR") {
        res.status(409).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // Get ticket
  app.get("/api/tickets/:project/:id", async (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.project);
      const ticketId = req.params.id;
      const ticket = await getTicket(projectId, ticketId);
      res.json(ticket);
    } catch (error) {
      res.status(404).json({ error: "Ticket not found" });
    }
  });

  // Update ticket
  /**
   * "hook:<name>" when a caller declares itself one, "hand:<user>" otherwise. The name
   * is bounded and scrubbed so nothing a caller sends can be mistaken for something the
   * daemon decided.
   */
  function resolveActor(declared?: string): string {
    const m = /^hook:([A-Za-z0-9][A-Za-z0-9._-]{0,39})$/.exec((declared ?? "").trim());
    if (m) return `hook:${m[1]}`;
    const user = (process.env.USER || process.env.LOGNAME || "unknown").replace(/[^A-Za-z0-9._-]/g, "");
    return `hand:${user || "unknown"}`;
  }

  app.put("/api/tickets/:project/:id", async (req: Request, res: Response) => {
    try {
      const projectId = decodeURIComponent(req.params.project);
      const ticketId = req.params.id;
      const { force, actor: declaredActor, ...ticketUpdates } = req.body as {
        phase?: TicketPhase;
        sessionId?: string;
        force?: boolean;
        blocked?: boolean;
        title?: string;
        description?: string;
        actor?: string;
      };

      // Who is causing this move. A caller that is not a hand says so, and the only
      // callers that may are the estate's own hooks, which name themselves. Anything
      // else is a hand: this API has no other kind of caller, and the hand is the
      // account the daemon runs as.
      const actor = resolveActor(declaredActor);

      const oldTicket = await getTicket(projectId, ticketId);
      const oldPhase = oldTicket.phase;

      // Resolve target phase if moving to a potentially automated phase
      let resolvedPhase = ticketUpdates.phase;
      if (ticketUpdates.phase && ticketUpdates.phase !== oldPhase) {
        resolvedPhase = (await resolveTargetPhase(
          projectId,
          ticketUpdates.phase,
        )) as TicketPhase;
        if (resolvedPhase !== ticketUpdates.phase) {
          console.log(
            `[updateTicket] Phase ${ticketUpdates.phase} is disabled, resolved to ${resolvedPhase}`,
          );
        }
      }

      // Entry check: the template may name a command that must pass before a
      // ticket enters this phase. Runs before the WIP check and regardless of
      // force, which exceeds a limit but does not skip a check.
      if (resolvedPhase && resolvedPhase !== oldPhase) {
        const entry = await checkPhaseEntry({
          projectId,
          projectPath: getProjects().get(projectId)?.path,
          ticketId,
          fromPhase: oldPhase,
          toPhase: resolvedPhase,
          actor,
        });
        if (entry && !entry.allowed) {
          res.status(409).json({
            error: "Entry check refused",
            message: `Move to ${resolvedPhase} refused: ${entry.reason}`,
            phase: resolvedPhase,
            reason: entry.reason,
          });
          return;
        }
      }

      // Check WIP limit for manual moves
      if (resolvedPhase && resolvedPhase !== oldPhase && !force) {
        const wipStatus = getWipStatus(projectId, resolvedPhase);
        if (wipStatus.atLimit) {
          res.status(409).json({
            error: "WIP limit reached",
            phase: resolvedPhase,
            current: wipStatus.current,
            limit: wipStatus.limit,
          });
          return;
        }
      }

      // A card sent backwards says so on itself.
      //
      // The history tab records every move, and nobody reads it before starting work:
      // the Build worker reads the card. A card that arrives in Build for the second
      // time looks exactly like one arriving for the first, and the worker's only clue
      // that a person sent it back is a Rework block somebody may or may not have
      // written. This line is the move itself, written where the work starts.
      let updates = { ...ticketUpdates };
      if (resolvedPhase && resolvedPhase !== oldPhase) {
        const phases = await orderedPhases(projectId);
        const from = phases.indexOf(oldPhase);
        const to = phases.indexOf(resolvedPhase);
        if (from >= 0 && to >= 0 && to < from) {
          const base =
            typeof updates.description === "string" ? updates.description : oldTicket.description || "";
          updates.description = setLine(
            base,
            "sent-back",
            `from ${oldPhase} to ${resolvedPhase} by ${actor} on ${new Date().toISOString()}`,
          );
        }
      }

      const ticket = await updateTicket(projectId, ticketId, {
        ...updates,
        phase: resolvedPhase,
        ...(resolvedPhase && resolvedPhase !== oldPhase ? { pendingPhase: null, actor } : {}),
      });

      eventBus.emit("ticket:updated", { projectId, ticket });

      if (resolvedPhase && resolvedPhase !== oldPhase) {
        eventBus.emit("ticket:moved", {
          projectId,
          ticketId,
          from: oldPhase,
          to: resolvedPhase,
        });

        // Check if target phase has automation (workers defined in template)
        const phaseConfig = await getPhaseConfig(projectId, resolvedPhase);
        const hasAutomation = phaseConfig?.workers && phaseConfig.workers.length > 0;

        if (hasAutomation) {
          const projects = getProjects();
          const project = projects.get(projectId);
          if (project) {
            const activeSession = getActiveSessionForTicket(ticketId);
            if (activeSession) {
              console.log(
                `Ticket ${ticketId} already has an active session, skipping spawn`,
              );
            } else {
              console.log(
                `Ticket ${ticketId} moved to ${resolvedPhase}, spawning Claude...`,
              );
              sessionService
                .spawnForTicket(
                  projectId,
                  ticketId,
                  resolvedPhase,
                  project.path,
                )
                .catch((error: Error) => {
                  console.error(
                    `[spawnForTicket] Failed to spawn session: ${error.message}`,
                  );
                });
            }
          }
        }
      }

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Delete ticket
  app.delete(
    "/api/tickets/:project/:id",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        await deleteTicket(projectId, ticketId);
        eventBus.emit("ticket:deleted", { projectId, ticketId });
        res.json({ ok: true });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Archive ticket
  app.patch(
    "/api/tickets/:project/:id/archive",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;

        const result = await archiveTicket(projectId, ticketId);
        eventBus.emit("ticket:archived", {
          projectId,
          ticketId,
          ticket: result.ticket,
          cleanup: result.cleanup,
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Restore ticket
  app.patch(
    "/api/tickets/:project/:id/restore",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;

        const ticket = await restoreTicket(projectId, ticketId);
        eventBus.emit("ticket:restored", { projectId, ticketId, ticket });
        res.json(ticket);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // List ticket images
  app.get(
    "/api/tickets/:project/:id/images",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const images = await listTicketImages(projectId, ticketId);
        res.json(images);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Upload image
  app.post(
    "/api/tickets/:project/:id/images",
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;

        if (!req.file) {
          res.status(400).json({ error: "No image uploaded" });
          return;
        }

        const filename = req.file.originalname || `image-${Date.now()}.png`;
        const image = await saveTicketImage(
          projectId,
          ticketId,
          filename,
          req.file.buffer,
        );

        res.json(image);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Serve ticket image
  app.get(
    "/api/tickets/:project/:id/images/:name",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const filename = req.params.name;

        const safeProjectId = projectId.replace(/\//g, "__");
        const imagePath = path.join(
          TASKS_DIR,
          safeProjectId,
          ticketId,
          "images",
          filename,
        );

        res.sendFile(imagePath);
      } catch (error) {
        res.status(404).json({ error: "Image not found" });
      }
    },
  );

  // Delete image
  app.delete(
    "/api/tickets/:project/:id/images/:name",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const filename = req.params.name;
        await deleteTicketImage(projectId, ticketId, filename);
        res.json({ ok: true });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // List artifacts
  app.get(
    "/api/tickets/:project/:id/artifacts",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const artifacts = await listArtifacts(projectId, ticketId);
        res.json(artifacts);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Get artifact content
  app.get(
    "/api/tickets/:project/:id/artifacts/:filename",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const filename = req.params.filename;

        const content = await getArtifactContent(projectId, ticketId, filename);
        res.type("text/plain").send(content);
      } catch (error) {
        res.status(404).json({ error: "Artifact not found" });
      }
    },
  );

  // Update artifact content (manual edit)
  app.put(
    "/api/tickets/:project/:id/artifacts/:filename",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const filename = req.params.filename;
        const { content } = req.body;

        if (typeof content !== "string") {
          res.status(400).json({ error: "content is required and must be a string" });
          return;
        }

        const result = await saveArtifact(projectId, ticketId, filename, content);

        // Record the edit in the ticket's own conversation - not just the
        // manifest - so it shows up in the Activity tab and so a later
        // resumed session's "recent activity since last turn" digest
        // actually mentions it, instead of the file just silently changing
        // underneath whatever runs next.
        const ticket = await getTicket(projectId, ticketId);
        if (ticket?.conversationId) {
          const note =
            result.wroteThrough === false
              ? `Artifact "${filename}" was manually edited via the Cannon viewer, but the write-through to the real worktree file failed - the change may only be visible here.`
              : `Artifact "${filename}" was manually edited via the Cannon viewer.`;
          addMessage(ticket.conversationId, {
            type: "notification",
            text: note,
            speaker: CANNON,
          });
        }

        // Notify listeners so the frontend can update artifact list
        eventBus.emit("ticket:updated", { projectId, ticketId });

        res.json({
          ok: true,
          filename: result.filename,
          isNewVersion: result.isNewVersion,
          wroteThrough: result.wroteThrough,
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Get conversations
  app.get(
    "/api/tickets/:project/:id/conversations",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const conversations = await loadConversations(projectId, ticketId);
        res.json(conversations);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Add conversation
  app.post(
    "/api/tickets/:project/:id/conversations",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const entry = req.body;

        if (!entry.id) {
          res.status(400).json({ error: "Missing conversation id" });
          return;
        }

        const conversations = await appendConversation(
          projectId,
          ticketId,
          entry,
        );
        res.json(conversations);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Get pending question for ticket
  app.get(
    "/api/tickets/:project/:id/pending",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;

        const question = readQuestion(projectId, ticketId);

        res.json({ question });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Submit response to pending question
  app.post(
    "/api/tickets/:project/:id/input",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const { message } = req.body;

        if (!message) {
          res.status(400).json({ error: "Missing message" });
          return;
        }

        writeResponse(projectId, ticketId, { answer: message });

        // Check if there's an active session for this ticket.
        // If not, this is a response to a suspended session — spawn a resumed session.
        const activeSession = getActiveSessionForTicket(ticketId);

        if (!activeSession) {
          const projects = getProjects();
          const project = projects.get(projectId);

          if (project) {
            try {
              const newSessionId = await sessionService.resumeSuspendedTicket(
                projectId,
                ticketId,
                message,
              );
              console.log(`[input] Spawned resumed session ${newSessionId} for suspended ticket ${ticketId}`);
              res.json({ success: true, sessionId: newSessionId, resumed: true });
              return;
            } catch (err) {
              console.error(`[input] Failed to resume suspended ticket: ${(err as Error).message}`);
              // Clean up the stale pending question so the UI doesn't stay enabled
              clearQuestion(projectId, ticketId);
            }
          }
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Answer bot submits answer to pending question
  app.post(
    "/api/tickets/:project/:id/answer-question",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const { answer } = req.body as { answer: string };

        if (!answer) {
          res.status(400).json({ error: "Missing answer" });
          return;
        }

        const handled = await chatService.handleResponse(
          "answer-bot",
          { projectId, ticketId },
          answer,
        );

        if (!handled) {
          res.status(404).json({ error: "No pending question found" });
          return;
        }

        // Resume is handled by the answerBot's onExit handler in session.service.ts.
        // When the answerBot session ends, it triggers resumeSuspendedTicket automatically.
        // We don't attempt resume here because the answerBot session is still active.
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Targeted writes to a card's description.
  //
  // Every writer of a description has so far done read-modify-write across the
  // network: GET the ticket, rebuild the whole text, PUT it back. Two writers
  // overlapping in that window lose one of the two writes silently, and a card's
  // description is exactly the document several writers share - a person's story
  // and ids, a worker's `pr:` line, a robot's status block, a reader's rework
  // request. This does the read, the edit and the write inside the daemon, so the
  // window is gone: whatever else is on the card when the edit lands survives it.
  //
  // It changes only the blocks and lines it is given. A null text or value removes
  // one. It returns what it actually changed, so a caller that expected to change
  // something and changed nothing can tell.
  app.post(
    "/api/tickets/:project/:id/description",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const { blocks, lines, blocked } = req.body as {
          blocks?: Array<{ name: string; text?: string | null; at?: "top" | "bottom" }>;
          lines?: Array<{ name: string; value?: string | null }>;
          blocked?: boolean;
        };

        if (!blocks?.length && !lines?.length && blocked === undefined) {
          res
            .status(400)
            .json({ error: "Nothing to change: pass blocks, lines or blocked" });
          return;
        }

        const ticket = await getTicket(projectId, ticketId);

        let description = ticket.description || "";
        let changed: string[] = [];
        if (blocks?.length || lines?.length) {
          const edit = applyEdit(description, { blocks, lines });
          description = edit.description;
          changed = edit.changed;
        }

        const updates: { description?: string; blocked?: boolean } = {};
        if (description !== (ticket.description || "")) updates.description = description;
        if (blocked !== undefined && blocked !== ticket.blocked) {
          updates.blocked = blocked;
          changed.push(blocked ? "blocked" : "unblocked");
        }

        if (Object.keys(updates).length === 0) {
          res.json({ ticket, changed: [] });
          return;
        }

        const updated = await updateTicket(projectId, ticketId, updates);

        eventBus.emit("ticket:updated", { projectId, ticket: updated });

        res.json({ ticket: updated, changed });
      } catch (error) {
        const message = (error as Error).message;
        // A bad block or line name is the caller's mistake, not the daemon's.
        res.status(/not a usable name/.test(message) ? 400 : 500).json({ error: message });
      }
    },
  );

  // Post a human comment on a ticket, independent of whether any agent is
  // active. Unlike /input, this never touches session/pending-question
  // state - it exists specifically for phases with no running agent (manual
  // review gates), where /input is unusable because there's nothing to
  // resume. Appended to the same conversation the dashboard already reads
  // via GET .../messages, so it shows up in the normal activity feed
  // instead of a second, invisible channel.
  app.post(
    "/api/tickets/:project/:id/comments",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const { comment, type, origin } = req.body as {
          comment?: string;
          type?: string;
          origin?: string;
        };

        if (!comment || !comment.trim()) {
          res.status(400).json({ error: "Missing comment" });
          return;
        }

        // Defaults to "user" (the dashboard's own comment box - a human
        // speaking). Callers that are NOT the human user (the
        // add_ticket_comment MCP tool, used by agents) must pass
        // type: "notification" explicitly, so agent commentary doesn't
        // render in the same right-aligned bubble as something Rik typed.
        const messageType = type === "notification" ? "notification" : "user";

        const ticket = await getTicket(projectId, ticketId);
        if (!ticket.conversationId) {
          res.status(400).json({ error: "Ticket has no conversation" });
          return;
        }

        // A comment posted here is either the panel's box or something calling the
        // API. Same rule as the Q&A route: the panel is the person, anything else
        // says what it is. An agent posting a note through add_ticket_comment sends
        // type "notification" and is a worker saying something, not a person.
        const commentSpeaker =
          messageType === "notification"
            ? { kind: "worker" as const, name: "A worker" }
            : callerSpeaker(origin);
        const message = addMessage(ticket.conversationId, {
          type: messageType,
          text: comment.trim(),
          speaker: commentSpeaker,
        });

        eventBus.emit("ticket:message", {
          projectId,
          ticketId,
          message: {
            type: messageType,
            text: message.text,
            timestamp: message.timestamp,
            speaker: commentSpeaker,
          },
        });

        res.json({ success: true, message });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Get ticket messages (unified chat history)
  app.get(
    "/api/tickets/:project/:id/messages",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;

        const ticket = await getTicket(projectId, ticketId);
        if (!ticket.conversationId) {
          res.json({ messages: [] });
          return;
        }

        const rawMessages = getMessages(ticket.conversationId);

        // Map message id to conversationId for frontend compatibility
        // The frontend uses conversationId for deduplication
        // Also extract artifact from metadata for artifact messages
        const messages = rawMessages.map((msg) => ({
          ...msg,
          conversationId: msg.id,
          // Extract artifact from metadata for frontend compatibility
          artifact: msg.metadata?.artifact as { filename: string; description?: string } | undefined,
        }));

        res.json({ messages });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Restart ticket to a specific phase
  app.post(
    "/api/tickets/:project/:id/restart",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;
        const { targetPhase } = req.body as { targetPhase?: string };

        if (!targetPhase) {
          res.status(400).json({ error: "Missing targetPhase" });
          return;
        }

        const { restartToPhase } = await import(
          "../../services/ticket-restart.service.js"
        );

        const result = await restartToPhase(
          projectId,
          ticketId,
          targetPhase,
          sessionService,
        );

        // Emit events for UI updates
        eventBus.emit("ticket:restarted", {
          projectId,
          ticketId,
          targetPhase,
          ticket: result.ticket,
        });
        eventBus.emit("ticket:updated", { projectId, ticket: result.ticket });

        res.json(result);
      } catch (error) {
        const message = (error as Error).message;
        if (message.includes("not found")) {
          res.status(404).json({ error: message });
        } else if (message.includes("archived") || message.includes("history")) {
          res.status(400).json({ error: message });
        } else {
          res.status(500).json({ error: message });
        }
      }
    },
  );

  // Phases reference
  app.get("/api/phases", (_req: Request, res: Response) => {
    res.json(DEFAULT_PHASES);
  });
}
