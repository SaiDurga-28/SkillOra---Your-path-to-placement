import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { readDb, writeDb, getDbLocation } from "../services/db.service.js";
import { authTokenFrom, isJwtSecretConfigured, signJwt, verifyJwt } from "../services/jwt.service.js";
import {
  analyzeJobWithAi,
  analyzeResumeWithAi,
  evaluateInterviewAnswerLocally,
  evaluateInterviewAnswerWithAi,
  extractJobDescriptionFromImage,
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
      if (body.length > 15_000_000) {
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
    visionEnabled: ai.visionEnabled,
    visionProvider: ai.visionProvider,
    visionModel: ai.visionModel,
    jwtConfigured: isJwtSecretConfigured(),
  });
}

function publicUser(user) {
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

export function requireUserEmail(req) {
  const claims = verifyJwt(authTokenFrom(req));
  const email = String(claims.email || "").trim().toLowerCase();
  if (!email) {
    throw new Error("Authentication token is missing an email claim.");
  }
  return email;
}

function tokenForUser(user) {
  return signJwt({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

export async function listJobs(req, res) {
  const db = await readDb();
  const userEmail = requireUserEmail(req);
  return sendJson(res, 200, db.jobs.filter((job) => job.userEmail === userEmail));
}

export async function analyzeJob(req, res) {
  const body = await readBody(req);
  const userEmail = requireUserEmail(req);
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

export async function extractJobImage(req, res) {
  requireUserEmail(req);
  const body = await readBody(req);
  const result = await extractJobDescriptionFromImage(body);
  return sendJson(res, 200, result);
}

export async function updateJob(req, res, jobId) {
  const body = await readBody(req);
  const userEmail = requireUserEmail(req);
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
  const userEmail = requireUserEmail(req);
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
  const userEmail = requireUserEmail(req);
  return sendJson(res, 200, db.interviews.filter((interview) => interview.userEmail === userEmail));
}

export async function createInterview(req, res) {
  const body = await readBody(req);
  const userEmail = requireUserEmail(req);
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
  const userEmail = requireUserEmail(req);
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
  requireUserEmail(req);
  const body = await readBody(req);
  const fallback = () => body.fallbackQuestions ?? [];
  const questions = await generateAssessmentQuestionsWithAi(body, fallback);
  return sendJson(res, 200, questions);
}

export async function generateInterviewQuestions(req, res) {
  requireUserEmail(req);
  const body = await readBody(req);
  const fallback = () => body.fallbackQuestions ?? [];
  const questions = await generateInterviewQuestionsWithAi(body, fallback);
  return sendJson(res, 200, questions);
}

export async function evaluateInterview(req, res) {
  requireUserEmail(req);
  const body = await readBody(req);
  const fallback = () => evaluateInterviewAnswerLocally(body);
  const result = await evaluateInterviewAnswerWithAi(body, fallback);
  return sendJson(res, 200, result);
}

export async function analyzeResume(req, res) {
  requireUserEmail(req);
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
  return sendJson(res, 201, { token: tokenForUser(user), user });
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
  const user = publicUser(account);
  return sendJson(res, 200, { token: tokenForUser(user), user });
}
