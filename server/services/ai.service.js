import { analyzeJobLocally } from "./skill-engine.service.js";

function getAiConfig() {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }

  if (process.env.XAI_API_KEY) {
    return {
      provider: "xai",
      apiKey: process.env.XAI_API_KEY,
      baseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
      model: process.env.XAI_MODEL || "grok-4-fast",
    };
  }

  return null;
}

function extractTextFromResponse(data) {
  const chatText = data.choices?.[0]?.message?.content;
  if (typeof chatText === "string") return chatText;
  if (typeof data.output_text === "string") return data.output_text;
  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    ?.map((content) => content.text ?? "")
    ?.join("");
  return text || "";
}

function parseJsonText(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

function buildChatCompletionBody(ai, system, payload) {
  return {
    model: ai.model,
    messages: [
      { role: "system", content: `${system}\nReturn only valid JSON.` },
      { role: "user", content: JSON.stringify(payload) },
    ],
  };
}

function buildResponsesBody(ai, system, payload) {
  return {
    model: ai.model,
    input: [
      { role: "system", content: `${system}\nReturn only valid JSON.` },
      { role: "user", content: JSON.stringify(payload) },
    ],
  };
}

async function callAiJson(system, payload, fallback) {
  const ai = getAiConfig();
  if (!ai) return fallback();
  const usesChatCompletions = ai.provider === "xai" || ai.provider === "groq";

  try {
    const response = await fetch(`${ai.baseUrl}/${usesChatCompletions ? "chat/completions" : "responses"}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(usesChatCompletions ? buildChatCompletionBody(ai, system, payload) : buildResponsesBody(ai, system, payload)),
    });

    if (!response.ok) {
      return fallback();
    }

    const data = await response.json();
    return parseJsonText(extractTextFromResponse(data));
  } catch {
    return fallback();
  }
}

export async function analyzeJobWithAi(payload) {
  const ai = getAiConfig();
  const fallback = analyzeJobLocally(payload);
  if (!ai) return fallback;

  const usesChatCompletions = ai.provider === "xai" || ai.provider === "groq";
  const system =
    "You analyze job descriptions. Return only valid JSON with extractedSkills, difficulty, estimatedDays, roadmapPhases. Use only skills clearly present in the JD.";

  try {
    const response = await fetch(`${ai.baseUrl}/${usesChatCompletions ? "chat/completions" : "responses"}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(usesChatCompletions ? buildChatCompletionBody(ai, system, payload) : buildResponsesBody(ai, system, payload)),
    });

    if (!response.ok) return fallback;

    const data = await response.json();
    const text = extractTextFromResponse(data).trim();
    const parsed = parseJsonText(text);

    return {
      extractedSkills: Array.isArray(parsed.extractedSkills) && parsed.extractedSkills.length ? parsed.extractedSkills.slice(0, 12) : fallback.extractedSkills,
      estimatedDays: Number.isFinite(parsed.estimatedDays) ? parsed.estimatedDays : fallback.estimatedDays,
      difficulty: parsed.difficulty || fallback.difficulty,
      roadmapPhases: fallback.roadmapPhases,
      analysisSource: `${ai.provider}:${ai.model}`,
    };
  } catch {
    return fallback;
  }
}

export function getAiStatus() {
  const ai = getAiConfig();
  return ai ? { enabled: true, provider: ai.provider, model: ai.model } : { enabled: false, provider: "local", model: "fallback" };
}

export async function generateAssessmentQuestionsWithAi(payload, fallback) {
  const data = await callAiJson(
    "Create 10 assessment MCQs. Each item must have id, category, difficulty, question, options array of 4 strings, and correctOption number 0-3. Match the requested category, difficulty, skills, and round. Make every round different.",
    payload,
    fallback,
  );

  const questions = Array.isArray(data) ? data : data?.questions;
  return Array.isArray(questions) && questions.length ? questions : fallback();
}

export async function generateInterviewQuestionsWithAi(payload, fallback) {
  const data = await callAiJson(
    "Create mock interview questions for the job. Return an array of 5 objects with id, category, question, answered:false. Use the requested interview type and job skills.",
    payload,
    fallback,
  );

  const questions = Array.isArray(data) ? data : data?.questions;
  return Array.isArray(questions) && questions.length ? questions : fallback();
}

export async function evaluateInterviewAnswerWithAi(payload, fallback) {
  return callAiJson(
    "Evaluate this interview answer. Return JSON with score number 0-100, feedback string, and tips array of 3 concise strings. Be practical and interview-focused.",
    payload,
    fallback,
  );
}

export async function analyzeResumeWithAi(payload, fallback) {
  return callAiJson(
    "Analyze this resume for ATS readiness. Return JSON with atsScore number 0-100, summary string, strengths array, improvements array, missingKeywords array, and sectionScores object with contact, summary, skills, experience, education, keywords, formatting numbers 0-100. Be specific, practical, and concise.",
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
