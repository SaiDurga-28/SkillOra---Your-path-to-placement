import http from "node:http";
import crypto from "node:crypto";
import { readDb, writeDb, getDbLocation } from "./db.js";
import { analyzeJobWithAi, evaluateInterviewAnswerLocally, evaluateInterviewAnswerWithAi, generateAssessmentQuestionsWithAi, generateInterviewQuestionsWithAi } from "./openai.js";

const PORT = Number(process.env.PORT || 3001);

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Email",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

function userEmailFrom(req, body = {}) {
  return req.headers["x-user-email"] || body.userEmail || "demo@skillora.local";
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        db: getDbLocation(),
        ai: Boolean(process.env.OPENAI_API_KEY),
      });
    }

    if (url.pathname === "/api/jobs" && req.method === "GET") {
      const db = await readDb();
      const userEmail = userEmailFrom(req);
      return sendJson(res, 200, db.jobs.filter((job) => job.userEmail === userEmail));
    }

    if (url.pathname === "/api/jobs/analyze" && req.method === "POST") {
      const body = await readBody(req);
      const userEmail = userEmailFrom(req, body);
      const analysis = await analyzeJobWithAi(body);
      const job = {
        id: Date.now(),
        userEmail,
        title: body.title,
        company: body.company,
        description: body.description,
        deadline: body.deadline,
        status: "analyzed",
        createdAt: new Date().toISOString(),
        ...analysis,
      };
      const db = await readDb();
      db.jobs.push(job);
      await writeDb(db);
      return sendJson(res, 201, job);
    }

    if (url.pathname === "/api/assessments/questions" && req.method === "POST") {
      const body = await readBody(req);
      const fallback = () => body.fallbackQuestions ?? [];
      const questions = await generateAssessmentQuestionsWithAi(body, fallback);
      return sendJson(res, 200, questions);
    }

    if (url.pathname === "/api/interviews/questions" && req.method === "POST") {
      const body = await readBody(req);
      const fallback = () => body.fallbackQuestions ?? [];
      const questions = await generateInterviewQuestionsWithAi(body, fallback);
      return sendJson(res, 200, questions);
    }

    if (url.pathname === "/api/interviews/evaluate" && req.method === "POST") {
      const body = await readBody(req);
      const fallback = () => evaluateInterviewAnswerLocally(body);
      const result = await evaluateInterviewAnswerWithAi(body, fallback);
      return sendJson(res, 200, result);
    }

    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      const body = await readBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !body.password || !body.name) return sendJson(res, 400, { message: "Name, email, and password are required." });
      const db = await readDb();
      if (db.users.some((user) => user.email === email)) return sendJson(res, 409, { message: "Account already exists." });
      const user = { id: crypto.randomUUID(), name: body.name.trim(), email, createdAt: new Date().toISOString() };
      db.users.push({ ...user, password: body.password });
      await writeDb(db);
      return sendJson(res, 201, { token: `server-${crypto.randomUUID()}`, user });
    }

    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      const account = (await readDb()).users.find((user) => user.email === email && user.password === body.password);
      if (!account) return sendJson(res, 401, { message: "Invalid email or password." });
      const { password, ...user } = account;
      return sendJson(res, 200, { token: `server-${crypto.randomUUID()}`, user });
    }

    return sendJson(res, 404, { message: "Not found" });
  } catch (error) {
    return sendJson(res, 500, { message: error.message || "Server error" });
  }
}

http.createServer(handle).listen(PORT, () => {
  console.log(`SkillOra API running at http://localhost:${PORT}`);
  console.log(`DB: ${getDbLocation()}`);
  console.log(`AI: ${process.env.OPENAI_API_KEY ? "OpenAI enabled" : "local fallback enabled"}`);
});
