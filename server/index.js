import "dotenv/config";
import http from "node:http";
import { pathToFileURL } from "node:url";
import { getAiStatus } from "./services/ai.service.js";
import { getDbLocation } from "./services/db.service.js";
import { handleApiRequest } from "./routes/api.routes.js";

const PORT = Number(process.env.PORT || 3001);

export function createApiServer() {
  return http.createServer(handleApiRequest);
}

export function startApiServer(port = PORT) {
  return createApiServer().listen(port, () => {
    const ai = getAiStatus();
    console.log(`SkillOra API running at http://localhost:${port}`);
    console.log(`DB: ${getDbLocation()}`);
    console.log(`AI: ${ai.enabled ? `${ai.provider} enabled (${ai.model})` : "local fallback enabled"}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startApiServer();
}
