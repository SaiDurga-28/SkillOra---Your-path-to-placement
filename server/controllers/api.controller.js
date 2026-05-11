import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { readDb, writeDb, getDbLocation } from "../services/db.service.js";
import {
  analyzeJobWithAi,
  analyzeResumeWithAi,
  evaluateInterviewAnswerLocally,
  evaluateInterviewAnswerWithAi,
  generateAssessmentQuestionsWithAi,
  generateInterviewQuestionsWithAi,
  getAiStatus,
} from "../services/ai.service.js";

const BCRYPT_ROUNDS = 10;

export function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Email",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  res.end(JSON.stringify(data));
}

export function readBody(req) {
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

export async function getHealth(req, res) {
  const ai = getAiStatus();
  return sendJson(res, 200, {
    ok: true,
    db: getDbLocation(),
    ai: ai.enabled,
    aiProvider: ai.provider,
    aiModel: ai.model,
  });
}

export async function listJobs(req, res) {
  const db = await readDb();
  const userEmail = userEmailFrom(req);
  return sendJson(res, 200, db.jobs.filter((job) => job.userEmail === userEmail));
}

export async function analyzeJob(req, res) {
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

export async function updateJob(req, res, jobId) {
  const body = await readBody(req);
  const userEmail = userEmailFrom(req, body);
  const db = await readDb();
  const id = Number(jobId);
  const index = db.jobs.findIndex((job) => Number(job.id) === id && job.userEmail === userEmail);

  if (index < 0) return sendJson(res, 404, { message: "Job not found." });

  db.jobs[index] = {
    ...db.jobs[index],
    ...body,
    id: db.jobs[index].id,
    userEmail,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(db);
  return sendJson(res, 200, db.jobs[index]);
}

export async function deleteJob(req, res, jobId) {
  const userEmail = userEmailFrom(req);
  const db = await readDb();
  const id = Number(jobId);
  const originalLength = db.jobs.length;
  db.jobs = db.jobs.filter((job) => Number(job.id) !== id || job.userEmail !== userEmail);
  db.interviews = db.interviews.filter((interview) => Number(interview.jobId) !== id || interview.userEmail !== userEmail);

  if (db.jobs.length === originalLength) return sendJson(res, 404, { message: "Job not found." });

  await writeDb(db);
  return sendJson(res, 200, { jobId: id });
}

export async function listInterviews(req, res) {
  const db = await readDb();
  const userEmail = userEmailFrom(req);
  return sendJson(res, 200, db.interviews.filter((interview) => interview.userEmail === userEmail));
}

export async function createInterview(req, res) {
  const body = await readBody(req);
  const userEmail = userEmailFrom(req, body);
  const interview = {
    ...body,
    id: body.id ?? Date.now(),
    userEmail,
    createdAt: body.createdAt ?? new Date().toISOString(),
  };
  const db = await readDb();
  const index = db.interviews.findIndex((item) => Number(item.id) === Number(interview.id) && item.userEmail === userEmail);
  if (index >= 0) {
    db.interviews[index] = interview;
  } else {
    db.interviews.push(interview);
  }
  await writeDb(db);
  return sendJson(res, 201, interview);
}

export async function updateInterview(req, res, interviewId) {
  const body = await readBody(req);
  const userEmail = userEmailFrom(req, body);
  const db = await readDb();
  const id = Number(interviewId);
  const index = db.interviews.findIndex((interview) => Number(interview.id) === id && interview.userEmail === userEmail);

  if (index < 0) return sendJson(res, 404, { message: "Interview not found." });

  db.interviews[index] = {
    ...db.interviews[index],
    ...body,
    id: db.interviews[index].id,
    userEmail,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(db);
  return sendJson(res, 200, db.interviews[index]);
}

export async function generateAssessmentQuestions(req, res) {
  const body = await readBody(req);
  const fallback = () => body.fallbackQuestions ?? [];
  const questions = await generateAssessmentQuestionsWithAi(body, fallback);
  return sendJson(res, 200, questions);
}

export async function generateInterviewQuestions(req, res) {
  const body = await readBody(req);
  const fallback = () => body.fallbackQuestions ?? [];
  const questions = await generateInterviewQuestionsWithAi(body, fallback);
  return sendJson(res, 200, questions);
}

export async function evaluateInterview(req, res) {
  const body = await readBody(req);
  const fallback = () => evaluateInterviewAnswerLocally(body);
  const result = await evaluateInterviewAnswerWithAi(body, fallback);
  return sendJson(res, 200, result);
}

export async function analyzeResume(req, res) {
  const body = await readBody(req);
  const fallback = () => body.fallbackResult;
  const result = await analyzeResumeWithAi(body, fallback);
  return sendJson(res, 200, result);
}

export async function register(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !body.password || !body.name) return sendJson(res, 400, { message: "Name, email, and password are required." });
  const db = await readDb();
  if (db.users.some((user) => user.email === email)) return sendJson(res, 409, { message: "Account already exists." });
  const user = { id: crypto.randomUUID(), name: body.name.trim(), email, createdAt: new Date().toISOString() };
  db.users.push({ ...user, passwordHash: await bcrypt.hash(body.password, BCRYPT_ROUNDS) });
  await writeDb(db);
  return sendJson(res, 201, { token: `server-${crypto.randomUUID()}`, user });
}

export async function login(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const db = await readDb();
  const account = db.users.find((user) => user.email === email);
  const passwordMatches = account?.passwordHash
    ? await bcrypt.compare(body.password || "", account.passwordHash)
    : account?.password === body.password;
  if (!account || !passwordMatches) return sendJson(res, 401, { message: "Invalid email or password." });
  if (!account.passwordHash) {
    account.passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    delete account.password;
    await writeDb(db);
  }
  const { password, passwordHash, ...user } = account;
  return sendJson(res, 200, { token: `server-${crypto.randomUUID()}`, user });
}
