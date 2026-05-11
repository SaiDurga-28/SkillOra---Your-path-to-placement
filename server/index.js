import "dotenv/config";
import http from "node:http";
import { getAiStatus } from "./services/ai.service.js";
import { getDbLocation } from "./services/db.service.js";
import { handleApiRequest } from "./routes/api.routes.js";

const PORT = Number(process.env.PORT || 3001);

http.createServer(handleApiRequest).listen(PORT, () => {
  const ai = getAiStatus();
  console.log(`SkillOra API running at http://localhost:${PORT}`);
  console.log(`DB: ${getDbLocation()}`);
  console.log(`AI: ${ai.enabled ? `${ai.provider} enabled (${ai.model})` : "local fallback enabled"}`);
});
