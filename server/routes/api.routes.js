import {
  analyzeJob,
  analyzeResume,
  createInterview,
  deleteJob,
  evaluateInterview,
  generateAssessmentQuestions,
  generateInterviewQuestions,
  getHealth,
  listInterviews,
  listJobs,
  login,
  register,
  sendJson,
  updateInterview,
  updateJob,
} from "../controllers/api.controller.js";

export async function handleApiRequest(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/health") return getHealth(req, res);
    if (url.pathname === "/api/jobs" && req.method === "GET") return listJobs(req, res);
    if (url.pathname === "/api/jobs/analyze" && req.method === "POST") return analyzeJob(req, res);
    const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
    if (jobMatch && req.method === "PATCH") return updateJob(req, res, jobMatch[1]);
    if (jobMatch && req.method === "DELETE") return deleteJob(req, res, jobMatch[1]);
    if (url.pathname === "/api/assessments/questions" && req.method === "POST") return generateAssessmentQuestions(req, res);
    if (url.pathname === "/api/interviews" && req.method === "GET") return listInterviews(req, res);
    if (url.pathname === "/api/interviews" && req.method === "POST") return createInterview(req, res);
    const interviewMatch = url.pathname.match(/^\/api\/interviews\/([^/]+)$/);
    if (interviewMatch && req.method === "PATCH") return updateInterview(req, res, interviewMatch[1]);
    if (url.pathname === "/api/interviews/questions" && req.method === "POST") return generateInterviewQuestions(req, res);
    if (url.pathname === "/api/interviews/evaluate" && req.method === "POST") return evaluateInterview(req, res);
    if (url.pathname === "/api/resume/analyze" && req.method === "POST") return analyzeResume(req, res);
    if (url.pathname === "/api/auth/register" && req.method === "POST") return register(req, res);
    if (url.pathname === "/api/auth/login" && req.method === "POST") return login(req, res);

    return sendJson(res, 404, { message: "Not found" });
  } catch (error) {
    return sendJson(res, 500, { message: error.message || "Server error" });
  }
}
