import { analyzeJobLocally } from "./skill-engine.js";

function extractTextFromResponse(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    ?.map((content) => content.text ?? "")
    ?.join("");
  return text || "";
}

async function callOpenAiJson(system, payload, fallback) {
  if (!process.env.OPENAI_API_KEY) return fallback();

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: `${system}\nReturn only valid JSON.` },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed: ${message.slice(0, 300)}`);
  }

  const data = await response.json();
  return JSON.parse(extractTextFromResponse(data).trim());
}

export async function analyzeJobWithAi(payload) {
  if (!process.env.OPENAI_API_KEY) {
    return analyzeJobLocally(payload);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You analyze job descriptions. Return only valid JSON with extractedSkills, difficulty, estimatedDays, roadmapPhases. Use only skills clearly present in the JD.",
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI analysis failed: ${message.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = extractTextFromResponse(data).trim();
  const parsed = JSON.parse(text);
  const fallback = analyzeJobLocally(payload);

  return {
    extractedSkills: Array.isArray(parsed.extractedSkills) && parsed.extractedSkills.length ? parsed.extractedSkills.slice(0, 12) : fallback.extractedSkills,
    estimatedDays: Number.isFinite(parsed.estimatedDays) ? parsed.estimatedDays : fallback.estimatedDays,
    difficulty: parsed.difficulty || fallback.difficulty,
    roadmapPhases: Array.isArray(parsed.roadmapPhases) && parsed.roadmapPhases.length ? parsed.roadmapPhases : fallback.roadmapPhases,
    analysisSource: `openai:${model}`,
  };
}

export async function generateAssessmentQuestionsWithAi(payload, fallback) {
  const data = await callOpenAiJson(
    "Create 10 assessment MCQs. Each item must have id, category, difficulty, question, options array of 4 strings, and correctOption number 0-3. Match the requested category, difficulty, skills, and round. Make every round different.",
    payload,
    fallback,
  );

  return Array.isArray(data) ? data : data.questions;
}

export async function generateInterviewQuestionsWithAi(payload, fallback) {
  const data = await callOpenAiJson(
    "Create mock interview questions for the job. Return an array of 5 objects with id, category, question, answered:false. Use the requested interview type and job skills.",
    payload,
    fallback,
  );

  return Array.isArray(data) ? data : data.questions;
}

export async function evaluateInterviewAnswerWithAi(payload, fallback) {
  return callOpenAiJson(
    "Evaluate this interview answer. Return JSON with score number 0-100, feedback string, and tips array of 3 concise strings. Be practical and interview-focused.",
    payload,
    fallback,
  );
}

export function evaluateInterviewAnswerLocally(payload) {
  const answer = payload.answer ?? "";
  const question = payload.question ?? "";
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const lowerAnswer = answer.toLowerCase();
  const keywords = [...new Set(question.toLowerCase().match(/[a-z][a-z+#.]{3,}/g) ?? [])]
    .filter((word) => !["explain", "would", "your", "with", "what", "about", "tell", "describe", "time"].includes(word))
    .slice(0, 6);
  const keywordHits = keywords.filter((word) => lowerAnswer.includes(word)).length;
  const hasStructure = /situation|task|action|result|first|second|finally|because|example|impact|tradeoff|challenge|outcome/i.test(answer);
  const hasExample = /example|project|built|implemented|used|worked|created|handled|improved|reduced|increased/i.test(answer);
  const hasResult = /result|impact|outcome|therefore|so that|which helped|measured|percent|%|users|latency|time/i.test(answer);
  const score = Math.min(95, Math.max(35, Math.min(30, Math.round((words.length / 90) * 30)) + Math.min(25, keywordHits * 5 + (keywords.length === 0 ? 10 : 0)) + (hasStructure ? 20 : 8) + (hasExample ? 15 : 5) + (hasResult ? 10 : 3)));
  return {
    score,
    feedback: score >= 80
      ? "Strong answer. It is relevant to the question, includes practical detail, and explains impact."
      : "Good start. Make it stronger with clearer structure, a concrete example, and measurable impact.",
    tips: [
      keywords.length ? `Connect directly to: ${keywords.slice(0, 3).join(", ")}.` : "Answer the exact question first.",
      "Use situation, action, and result.",
      "Mention a tradeoff, metric, or learning.",
    ],
  };
}
