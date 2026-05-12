import crypto from "node:crypto";

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return buffer.toString("base64url");
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function getJwtSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production.");
  }

  return process.env.JWT_SECRET || "skillora-development-secret-change-before-production";
}

function signSegment(value) {
  return crypto
    .createHmac("sha256", getJwtSecret())
    .update(value)
    .digest("base64url");
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function isJwtSecretConfigured() {
  return Boolean(process.env.JWT_SECRET);
}

export function signJwt(payload, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Number(options.expiresInSeconds || DEFAULT_EXPIRES_IN_SECONDS);
  const header = { alg: "HS256", typ: "JWT" };
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(claims)}`;
  return `${unsigned}.${signSegment(unsigned)}`;
}

export function verifyJwt(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Missing authentication token.");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid authentication token.");
  }

  const [header, payload, signature] = parts;
  const expectedSignature = signSegment(`${header}.${payload}`);
  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error("Invalid authentication token.");
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid authentication token.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (Number(claims.exp) <= now) {
    throw new Error("Authentication token expired.");
  }

  return claims;
}

export function authTokenFrom(req) {
  const header = req.headers.authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}
