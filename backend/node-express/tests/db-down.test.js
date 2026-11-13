// Without MongoDB the API must answer quickly with a clear 503, not hang and 500.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import jwt from "jsonwebtoken";
import request from "supertest";

process.env.NODE_ENV = "test";
const { createApp } = await import("../src/app.js");
const { env } = await import("../src/config/env.js");

const auth = {
  Authorization: `Bearer ${jwt.sign({ sub: "9", email: "x@example.com", role: "farmer" }, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: "5m",
  })}`,
};

describe("database unavailable", () => {
  const app = createApp();

  it("returns 503 with a readable message for data routes", async () => {
    const started = Date.now();
    const res = await request(app).get("/farm-api/farms").set(auth);
    assert.equal(res.status, 503);
    assert.match(res.body.detail, /MongoDB is not connected/);
    assert.ok(Date.now() - started < 2000, "should fail fast");
  });

  it("still checks auth first", async () => {
    const res = await request(app).get("/farm-api/farms");
    assert.equal(res.status, 401);
  });

  it("reports degraded health", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 503);
    assert.equal(res.body.database, "unavailable");
  });
});
