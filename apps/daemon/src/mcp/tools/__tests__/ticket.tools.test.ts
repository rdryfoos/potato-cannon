import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ticketTools, ticketHandlers } from "../ticket.tools.js";

/**
 * A tool nobody registered is a tool that does not exist.
 *
 * update_ticket is reachable only through this pair - the definition an agent is
 * shown and the handler the proxy dispatches to - and the two are declared far
 * enough apart in the file that adding one without the other compiles fine and
 * fails at run time, in an agent's session, where nobody is watching.
 */
describe("the ticket tools an agent is offered", () => {
  it("offers a handler for every tool it declares, and declares every handler", () => {
    const declared = ticketTools.map((t) => t.name).sort();
    const handled = Object.keys(ticketHandlers).sort();
    assert.deepEqual(declared, handled);
  });

  it("offers update_ticket, with blocks, lines and blocked", () => {
    const tool = ticketTools.find((t) => t.name === "update_ticket");
    assert.ok(tool, "update_ticket is not declared");

    const props = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(props.blocks, "no blocks");
    assert.ok(props.lines, "no lines");
    assert.ok(props.blocked, "no blocked");

    // Nothing is required: a call that sets only a line is a whole valid call.
    assert.deepEqual(tool.inputSchema.required, []);
    assert.equal(typeof ticketHandlers.update_ticket, "function");
  });

  it("tells an agent that everything it does not name is left alone", () => {
    const tool = ticketTools.find((t) => t.name === "update_ticket")!;
    // The whole point of the tool is in its description, because an agent reads the
    // description and never reads this file.
    assert.match(tool.description, /without disturbing the rest/i);
    assert.match(tool.description, /exactly as it was/i);
  });

  it("names both of the lines the Build worker writes", () => {
    const tool = ticketTools.find((t) => t.name === "update_ticket")!;
    assert.match(tool.description, /\bpr\b/);
    assert.match(tool.description, /blocked-reason/);
  });

  it("says that blocking a card silently is not allowed", () => {
    const tool = ticketTools.find((t) => t.name === "update_ticket")!;
    const blocked = (tool.inputSchema.properties as Record<string, { description: string }>)
      .blocked;
    assert.match(blocked.description, /silently is\s+forbidden|silently is forbidden/);
    assert.match(blocked.description, /blocked-reason/);
  });
});
