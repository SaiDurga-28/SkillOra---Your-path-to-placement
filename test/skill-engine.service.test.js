import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeJobLocally,
  buildRoadmap,
  daysUntil,
  difficultyFor,
  extractSkills,
} from "../server/services/skill-engine.service.js";

test("extractSkills finds catalog terms, aliases, and explicit technical terms once", () => {
  const skills = extractSkills(`
    Requirements: Build RESTful APIs with NodeJS, React, MongoDB, AWS, CI CD, OAuth2, and JWT.
    Preferred: PowerBI, LangChain, UI/UX, and strong verbal communication.
  `);

  assert.equal(skills.filter((skill) => skill === "Node.js").length, 1);
  assert.ok(skills.includes("REST APIs"));
  assert.ok(skills.includes("React"));
  assert.ok(skills.includes("MongoDB"));
  assert.ok(skills.includes("AWS"));
  assert.ok(skills.includes("CI/CD"));
  assert.ok(skills.includes("OAuth"));
  assert.ok(skills.includes("JWT"));
  assert.ok(skills.includes("Power BI"));
  assert.ok(skills.includes("LangChain"));
  assert.ok(skills.includes("UI/UX"));
  assert.ok(extractSkills("Required: strong verbal communication and presentation skills.").includes("Communication"));
});

test("analyzeJobLocally builds a deployable roadmap from a valid JD", () => {
  const analysis = analyzeJobLocally({
    description: "Senior React Node.js MongoDB developer needed for REST APIs, AWS, Docker, Testing, and System Design.",
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
  });

  assert.equal(analysis.analysisSource, "local-engine");
  assert.equal(analysis.difficulty, "advanced");
  assert.ok(analysis.estimatedDays >= 1);
  assert.ok(analysis.extractedSkills.length >= 7);
  assert.ok(analysis.roadmapPhases.length > 0);
  assert.ok(analysis.roadmapPhases.every((phase) => phase.skills.length > 0));
  assert.ok(analysis.roadmapPhases.flatMap((phase) => phase.skills).every((skill) => skill.resources.length === 3));
});

test("analyzeJobLocally rejects descriptions without clear skills", () => {
  assert.throws(
    () => analyzeJobLocally({ description: "Friendly team with good benefits and a nice office.", deadline: "" }),
    /No clear skills/,
  );
});

test("daysUntil and difficultyFor keep safe fallbacks", () => {
  assert.equal(daysUntil("not-a-date"), 14);
  assert.equal(difficultyFor(["React"], "entry level frontend role"), "beginner");
  assert.equal(difficultyFor(Array.from({ length: 8 }, (_, index) => `Skill ${index}`), "production app"), "intermediate");
  assert.equal(difficultyFor(["React"], "senior architecture role"), "advanced");
});

test("buildRoadmap creates stable phase and skill ids", () => {
  const roadmap = buildRoadmap(["React", "Node.js", "MongoDB", "Testing"], 21);
  const skills = roadmap.flatMap((phase) => phase.skills);

  assert.deepEqual(roadmap.map((phase) => phase.id), ["foundation", "practice"]);
  assert.equal(skills.length, 4);
  assert.equal(skills[0].id, "technical-0-react");
  assert.equal(skills[1].priority, "high");
  assert.equal(skills.at(-1).completed, false);
});
