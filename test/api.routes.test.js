import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../server/index.js";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "skillora-api-test-"));
process.env.SKILLORA_DB_FILE = path.join(tempDir, "skillora-db.json");
process.env.JWT_SECRET = "test-secret-at-least-long-enough-for-jwt-tests";
delete process.env.MONGODB_URI;

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

async function requestJson(baseUrl, route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json();
  return { response, body };
}

test("API supports health, auth, job analysis, updates, interviews, and delete", async (t) => {
  const server = createApiServer();
  const baseUrl = await listen(server);
  t.after(() => server.close());

  const health = await requestJson(baseUrl, "/api/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.body.ok, true);
  assert.equal(health.body.db, process.env.SKILLORA_DB_FILE);

  const register = await requestJson(baseUrl, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "secret123" }),
  });
  assert.equal(register.response.status, 201);
  assert.equal(register.body.user.email, "test@example.com");
  assert.ok(register.body.token);
  assert.equal(register.body.token.split(".").length, 3);

  const unauthorized = await requestJson(baseUrl, "/api/jobs");
  assert.equal(unauthorized.response.status, 401);

  const login = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "test@example.com", password: "secret123" }),
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.body.user.email, "test@example.com");
  assert.equal(login.body.user.passwordHash, undefined);
  const authHeader = { Authorization: `Bearer ${login.body.token}` };

  const created = await requestJson(baseUrl, "/api/jobs/analyze", {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      title: "Full Stack Developer",
      company: "SkillOra",
      description: "Requirements: React, Node.js, MongoDB, REST APIs, AWS, Docker, Testing, and Communication.",
      deadline: "",
    }),
  });
  assert.equal(created.response.status, 201);
  assert.ok(created.body.extractedSkills.includes("React"));

  const listed = await requestJson(baseUrl, "/api/jobs", {
    headers: authHeader,
  });
  assert.equal(listed.response.status, 200);
  assert.equal(listed.body.length, 1);

  const updated = await requestJson(baseUrl, `/api/jobs/${created.body.id}`, {
    method: "PATCH",
    headers: authHeader,
    body: JSON.stringify({ status: "in_progress" }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.status, "in_progress");

  const interview = await requestJson(baseUrl, "/api/interviews", {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ jobId: created.body.id, jobTitle: "Full Stack Developer", type: "technical", questions: [] }),
  });
  assert.equal(interview.response.status, 201);
  assert.equal(interview.body.userEmail, "test@example.com");

  const deleted = await requestJson(baseUrl, `/api/jobs/${created.body.id}`, {
    method: "DELETE",
    headers: authHeader,
  });
  assert.equal(deleted.response.status, 200);
  assert.equal(deleted.body.jobId, created.body.id);
});

test("API returns useful errors for invalid JSON and missing routes", async (t) => {
  const server = createApiServer();
  const baseUrl = await listen(server);
  t.after(() => server.close());

  const invalid = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  assert.equal(invalid.status, 500);
  assert.match((await invalid.json()).message, /Invalid JSON/);

  const missing = await requestJson(baseUrl, "/api/not-real");
  assert.equal(missing.response.status, 404);
  assert.equal(missing.body.message, "Not found");
});
