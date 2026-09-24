import { describe, it } from "node:test";
import assert from "node:assert";

import { allTools } from "../index.js";
import { ticketTools } from "../ticket.tools.js";

/**
 * What Buddy can reach, and what it cannot.
 *
 * Two things it could not do. It could not see further back than the transcript in its
 * prompt, so a question about something said earlier got "I cannot see that far" or a
 * guess. And it could not look at the board at all: asked what to do next on
 * 2026-09-24 it read the repository's reservations alone and told Rik that T904 had no
 * card, while BAN-1 sat in Spec carrying T904's five IDs.
 *
 * And one thing it must never do. Buddy reads a card and answers about it; every drag
 * on the board is a person's hand.
 */
describe("Buddy's tools", () => {
  const byName = (name: string) => allTools.find((t) => t.name === name);

  it("can read further back than its prompt's transcript", () => {
    const tool = byName("get_conversation");
    assert.ok(tool, "get_conversation is not registered");
    assert.ok(/further back|earlier/i.test(tool.description), "it should say what it is for");
    const properties = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(properties.limit, "it pages");
    assert.ok(properties.offset, "it pages backwards");
  });

  it("can list its own board", () => {
    const tool = byName("list_tickets");
    assert.ok(tool, "list_tickets is not registered");
    assert.ok(/read-only/i.test(tool.description), "it should say it cannot move anything");
  });

  it("takes no project, so it can only ever list its own board", () => {
    // The context supplies the project. A tool that took one as an argument would let
    // a card's agent read a board it was not opened on.
    const tool = byName("list_tickets");
    const properties = (tool!.inputSchema.properties ?? {}) as Record<string, unknown>;
    assert.ok(!("projectId" in properties), "list_tickets must not take a project");
    assert.ok(!("project" in properties), "list_tickets must not take a project");
  });

  it("offers nothing that moves a card", () => {
    // Every drag on the board is a person's hand, and no tool here is a hand. The two
    // tools that take a `phase` take it to filter a list and to label a question; the
    // check is that neither, nor anything else, sets one.
    const MAY_TAKE_PHASE: Record<string, RegExp> = {
      list_tickets: /Only cards in this phase/i,
      chat_ask: /phase/i,
    };

    for (const tool of allTools) {
      assert.ok(
        !/\b(move|promote|demote|advance|transition)\b/i.test(tool.name),
        `${tool.name} sounds like it moves a card`,
      );
      assert.ok(
        !/\b(moves?|promotes?|demotes?|advances?) the (card|ticket)\b/i.test(tool.description),
        `${tool.name} says it moves a card`,
      );

      const properties = (tool.inputSchema?.properties ?? {}) as Record<
        string,
        { description?: string }
      >;
      if (!("phase" in properties)) continue;

      const allowed = MAY_TAKE_PHASE[tool.name];
      assert.ok(allowed, `${tool.name} takes a phase and is not one of the two that may`);
      assert.match(
        String(properties.phase?.description ?? ""),
        allowed,
        `${tool.name}'s phase argument should say it does not set one`,
      );
    }
  });

  it("list_tickets filters by phase and does not set one", () => {
    const tool = byName("list_tickets");
    const phase = (tool!.inputSchema.properties as Record<string, { description?: string }>).phase;
    assert.match(String(phase?.description), /Only cards in this phase/);
  });

  it("registers both on the ticket tools, where get_ticket already lives", () => {
    const names = ticketTools.map((t) => t.name);
    assert.ok(names.includes("get_conversation"));
    assert.ok(names.includes("list_tickets"));
  });
});
