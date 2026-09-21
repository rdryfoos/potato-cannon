import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  workerSpeaker,
  callerSpeaker,
  inferSpeaker,
  CANNON,
  BUDDY,
  PERSON,
} from "../speaker.js";

describe("workerSpeaker", () => {
  it("names the three workers this estate actually runs", () => {
    assert.deepEqual(workerSpeaker("agents/spec.md", "Spec"), {
      kind: "worker",
      name: "Spec worker",
    });
    assert.deepEqual(workerSpeaker("agents/build.md", "Build"), {
      kind: "worker",
      name: "Build worker",
    });
    // An agent whose file name says it is a runner is a runner. The Cannon does
    // not rename somebody else's agent to fit its own vocabulary.
    assert.deepEqual(workerSpeaker("agents/runner.md", "Gate"), {
      kind: "worker",
      name: "Gate runner",
    });
  });

  it("is a rule rather than a table of three names", () => {
    assert.deepEqual(workerSpeaker("agents/refinement.md", "Refinement"), {
      kind: "worker",
      name: "Refinement worker",
    });
    assert.deepEqual(workerSpeaker("agents/adversarial-reviewer.md", "Review"), {
      kind: "worker",
      name: "Review reviewer",
    });
  });

  it("recognises the ad-hoc Q&A agents by the source their sessions carry", () => {
    assert.deepEqual(workerSpeaker("ticket-qa"), BUDDY);
    assert.deepEqual(workerSpeaker("ticket-qa", "Align"), BUDDY);
    assert.deepEqual(workerSpeaker("artifact-qa"), {
      kind: "buddy",
      name: "Artifact Q&A",
    });
  });

  it("falls back to the agent's own name when no phase was recorded", () => {
    assert.deepEqual(workerSpeaker("agents/spec.md"), {
      kind: "worker",
      name: "Spec worker",
    });
  });

  it("says a general thing rather than inventing a specific one", () => {
    assert.deepEqual(workerSpeaker(null, null), { kind: "worker", name: "A worker" });
    assert.deepEqual(workerSpeaker("", ""), { kind: "worker", name: "A worker" });
  });
});

describe("callerSpeaker", () => {
  it("treats the panel, and only the panel, as the person", () => {
    assert.deepEqual(callerSpeaker("panel"), PERSON);
    assert.equal(PERSON.kind, "person");
  });

  it("does not put words in a person's mouth when nobody says who is calling", () => {
    const anonymous = callerSpeaker(undefined);
    assert.notEqual(anonymous.kind, "person");
    assert.deepEqual(anonymous, { kind: "cannon", name: "An unnamed caller" });
    assert.deepEqual(callerSpeaker("   "), { kind: "cannon", name: "An unnamed caller" });
  });

  it("names a caller that names itself", () => {
    assert.deepEqual(callerSpeaker("estate-hook"), {
      kind: "cannon",
      name: "estate-hook",
    });
  });

  it("does not let a caller choose how much of the feed its label occupies", () => {
    const shouty = callerSpeaker("x".repeat(200));
    assert.equal(shouty.name.length, 40);
    // Markup and newlines are stripped: this string is rendered as a caption.
    assert.deepEqual(callerSpeaker("<b>curl</b>\nagent"), {
      kind: "cannon",
      name: "bcurlbagent",
    });
  });
});

describe("inferSpeaker, for rows written before speakers existed", () => {
  it("never guesses a person", () => {
    for (const type of ["question", "notification", "artifact"]) {
      assert.notEqual(inferSpeaker(type, {}).kind, "person");
      assert.notEqual(inferSpeaker(type, { phase: "Build" }).kind, "person");
    }
  });

  it("reads a user row as the person, which is the one thing both schemas agree on", () => {
    assert.deepEqual(inferSpeaker("user", undefined), PERSON);
  });

  it("reads the ad-hoc markers the old rows do carry", () => {
    assert.deepEqual(inferSpeaker("question", { ticketChat: true }), BUDDY);
    assert.deepEqual(inferSpeaker("question", { artifactFilename: "spec.md" }), {
      kind: "buddy",
      name: "Artifact Q&A",
    });
  });

  it("reads a phase as the worker that ran in it", () => {
    assert.deepEqual(inferSpeaker("question", { phase: "Spec" }), {
      kind: "worker",
      name: "Spec worker",
    });
  });

  it("calls an unattributable old notification the Cannon rather than a wrong worker", () => {
    assert.deepEqual(inferSpeaker("notification", undefined), CANNON);
  });
});
