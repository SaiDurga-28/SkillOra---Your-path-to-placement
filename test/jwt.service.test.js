import test from "node:test";
import assert from "node:assert/strict";
import { isJwtSecretConfigured, signJwt, verifyJwt } from "../server/services/jwt.service.js";

test("signJwt and verifyJwt round-trip signed user claims", () => {
  process.env.JWT_SECRET = "unit-test-secret";

  const token = signJwt({ sub: "user-1", email: "user@example.com", name: "User" }, { expiresInSeconds: 60 });
  const claims = verifyJwt(token);

  assert.equal(token.split(".").length, 3);
  assert.equal(claims.sub, "user-1");
  assert.equal(claims.email, "user@example.com");
  assert.ok(claims.iat);
  assert.ok(claims.exp);
  assert.equal(isJwtSecretConfigured(), true);
});

test("verifyJwt rejects tampered and expired tokens", () => {
  process.env.JWT_SECRET = "unit-test-secret";

  const token = signJwt({ email: "user@example.com" }, { expiresInSeconds: 60 });
  const parts = token.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({ email: "attacker@example.com", exp: Math.floor(Date.now() / 1000) + 60 })).toString("base64url");
  assert.throws(() => verifyJwt(`${parts[0]}.${tamperedPayload}.${parts[2]}`), /Invalid authentication token/);

  const expired = signJwt({ email: "user@example.com" }, { expiresInSeconds: -1 });
  assert.throws(() => verifyJwt(expired), /expired/);
});
