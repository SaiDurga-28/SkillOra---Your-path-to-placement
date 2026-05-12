import {
  analyzeJob,
  analyzeResume,
  createInterview,
  deleteJob,
  evaluateInterview,
  extractJobImage,
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
    if (url.pathname === "/api/health") return await getHealth(req, res);
    if (url.pathname === "/api/jobs" && req.method === "GET") return await listJobs(req, res);
    if (url.pathname === "/api/jobs/analyze" && req.method === "POST") return await analyzeJob(req, res);
    if (url.pathname === "/api/jobs/extract-image" && req.method === "POST") return await extractJobImage(req, res);
    const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
    if (jobMatch && req.method === "PATCH") return await updateJob(req, res, jobMatch[1]);
    if (jobMatch && req.method === "DELETE") return await deleteJob(req, res, jobMatch[1]);
    if (url.pathname === "/api/assessments/questions" && req.method === "POST") return await generateAssessmentQuestions(req, res);
    if (url.pathname === "/api/interviews" && req.method === "GET") return await listInterviews(req, res);
    if (url.pathname === "/api/interviews" && req.method === "POST") return await createInterview(req, res);
    const interviewMatch = url.pathname.match(/^\/api\/interviews\/([^/]+)$/);
    if (interviewMatch && req.method === "PATCH") return await updateInterview(req, res, interviewMatch[1]);
    if (url.pathname === "/api/interviews/questions" && req.method === "POST") return await generateInterviewQuestions(req, res);
    if (url.pathname === "/api/interviews/evaluate" && req.method === "POST") return await evaluateInterview(req, res);
    if (url.pathname === "/api/resume/analyze" && req.method === "POST") return await analyzeResume(req, res);
    if (url.pathname === "/api/auth/register" && req.method === "POST") return await register(req, res);
    if (url.pathname === "/api/auth/login" && req.method === "POST") return await login(req, res);

    return sendJson(res, 404, { message: "Not found" });
  } catch (error) {
    if (/authentication token|token expired/i.test(error.message || "")) {
      return sendJson(res, 401, { message: error.message });
    }
    return sendJson(res, 500, { message: error.message || "Server error" });
  }
}
