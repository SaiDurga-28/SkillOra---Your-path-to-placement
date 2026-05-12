import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeJobWithAi,
  evaluateInterviewAnswerLocally,
  generateAssessmentQuestionsWithAi,
  generateInterviewQuestionsWithAi,
  getAiStatus,
} from "../server/services/ai.service.js";

test("getAiStatus reports local fallback when API keys are absent", () => {
  const previous = {
    openai: process.env.OPENAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    xai: process.env.XAI_API_KEY,
  };
  delete process.env.OPENAI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.XAI_API_KEY;

  const status = getAiStatus();

  assert.equal(status.enabled, false);
  assert.equal(status.provider, "local");
  assert.equal(status.model, "fallback");

  process.env.OPENAI_API_KEY = previous.openai;
  process.env.GROQ_API_KEY = previous.groq;
  process.env.XAI_API_KEY = previous.xai;
});

test("AI helpers return provided fallbacks when no provider is configured", async () => {
  const previous = {
    openai: process.env.OPENAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    xai: process.env.XAI_API_KEY,
  };
  delete process.env.OPENAI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.XAI_API_KEY;

  const assessmentFallback = [{ id: "q1", question: "Fallback?", options: ["a"], correctOption: 0 }];
  const interviewFallback = [{ id: "i1", question: "Tell me about React.", answered: false }];

  assert.deepEqual(
    await generateAssessmentQuestionsWithAi({}, () => assessmentFallback),
    assessmentFallback,
  );
  assert.deepEqual(
    await generateInterviewQuestionsWithAi({}, () => interviewFallback),
    interviewFallback,
  );

  const analysis = await analyzeJobWithAi({
    description: "React Node.js MongoDB role building REST APIs with Testing.",
    deadline: "",
  });
  assert.equal(analysis.analysisSource, "local-engine");
  assert.ok(analysis.extractedSkills.includes("React"));

  process.env.OPENAI_API_KEY = previous.openai;
  process.env.GROQ_API_KEY = previous.groq;
  process.env.XAI_API_KEY = previous.xai;
});

test("evaluateInterviewAnswerLocally returns bounded practical feedback", () => {
  const result = evaluateInterviewAnswerLocally({
    question: "Describe how you improved React performance with measurable impact.",
    answer: "In my project, I first measured render latency, then implemented memoization and code splitting. The result reduced page load time by 35 percent for users.",
  });

  assert.ok(result.score >= 35 && result.score <= 95);
  assert.match(result.feedback, /Strong answer|Good start/);
  assert.equal(result.tips.length, 3);
});
