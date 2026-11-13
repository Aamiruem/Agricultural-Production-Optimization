// Integration tests: real Express app + real MongoDB (throwaway database).
// Requires MongoDB on MONGODB_TEST_URI (default mongodb://127.0.0.1:27017); skipped otherwise.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, beforeEach, describe, it } from "node:test";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { io as ioClient } from "socket.io-client";
import request from "supertest";

// Configure before the app reads its environment.
const MONGO = process.env.MONGODB_TEST_URI ?? "mongodb://127.0.0.1:27017";
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = `${MONGO}/agrioptima_test_${process.pid}`;
process.env.S3_BUCKET = "agrioptima-test-bucket";
process.env.AWS_ACCESS_KEY_ID = "AKIAEXAMPLETEST00000"; // dummy: presigning is offline
process.env.AWS_SECRET_ACCESS_KEY = "dummy-secret-for-offline-presigning";

const { createApp } = await import("../src/app.js");
const { connectDb } = await import("../src/config/db.js");
const { initRealtime, closeRealtime } = await import("../src/services/realtime.js");
const { env } = await import("../src/config/env.js");

const token = (sub, extra = {}) =>
  jwt.sign({ sub: String(sub), email: `${sub}@example.com`, role: "farmer", ...extra }, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: "5m",
  });
const ALICE = { Authorization: `Bearer ${token(1)}` };
const BOB = { Authorization: `Bearer ${token(2)}` };

let mongoAvailable = true;
try {
  await connectDb(process.env.MONGODB_URI);
} catch {
  mongoAvailable = false;
}

describe("farm-service", { skip: !mongoAvailable && "MongoDB not reachable" }, () => {
  const app = createApp();

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });

  const newFarm = async (headers = ALICE, name = "Green Acres") =>
    (await request(app).post("/api/farms").set(headers).send({ name, location: { state: "Punjab", lat: 30.9, lng: 75.8 } }).expect(201)).body;
  const newField = async (farmId, body = {}) =>
    (await request(app).post(`/api/farms/${farmId}/fields`).set(ALICE)
      .send({ name: "North plot", crop: "Rice", season: "kharif", areaHa: 2.5, soil: { N: 20, P: 10, K: 40 }, ...body })
      .expect(201)).body;

  it("health reports the database", async () => {
    const res = await request(app).get("/health").expect(200);
    assert.deepEqual(res.body, { status: "ok", database: "ok" });
  });

  it("rejects missing, invalid and wrongly-signed tokens", async () => {
    await request(app).get("/api/farms").expect(401);
    await request(app).get("/api/farms").set("Authorization", "Bearer nope").expect(401);
    const forged = jwt.sign({ sub: "1" }, "wrong-secret", { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE });
    await request(app).get("/api/farms").set("Authorization", `Bearer ${forged}`).expect(401);
  });

  it("creates farms with GeoJSON location and enforces unique names per owner", async () => {
    const farm = await newFarm();
    assert.deepEqual(farm.location.point.coordinates, [75.8, 30.9]);
    await request(app).post("/api/farms").set(ALICE).send({ name: "Green Acres" }).expect(409);
    await newFarm(BOB, "Green Acres"); // other owners may reuse the name
  });

  it("validates input with Zod", async () => {
    const res = await request(app).post("/api/farms").set(ALICE).send({ name: "x" }).expect(422);
    assert.match(res.body.detail, /^name:/);
    await request(app).get("/api/farms/not-an-id").set(ALICE).expect(422);
    await request(app).post("/api/farms").set(ALICE).set("Content-Type", "application/json").send("{bad").expect(400);
  });

  it("keeps each owner's data private", async () => {
    const farm = await newFarm();
    await request(app).get(`/api/farms/${farm._id}`).set(BOB).expect(404);
    const list = await request(app).get("/api/farms").set(BOB).expect(200);
    assert.equal(list.body.length, 0);
  });

  it("lists farms with field counts and builds an aggregated summary", async () => {
    const farm = await newFarm();
    const f1 = await newField(farm._id);
    await newField(farm._id, { name: "South plot", crop: "chickpea", season: "rabi", areaHa: 1.5 });
    await newField(farm._id, { name: "East plot", crop: "rice", areaHa: 1 });
    await request(app).post(`/api/fields/${f1._id}/activities`).set(ALICE).send({ type: "sowing", notes: "Pusa Basmati" }).expect(201);

    const [listed] = (await request(app).get("/api/farms").set(ALICE).expect(200)).body;
    assert.equal(listed.fields, 3);
    assert.equal(listed.areaHa, 5);

    const summary = (await request(app).get(`/api/farms/${farm._id}/summary`).set(ALICE).expect(200)).body;
    assert.deepEqual(summary.totals, { fields: 3, areaHa: 5 });
    assert.deepEqual(summary.byCrop[0], { crop: "rice", fields: 2, areaHa: 3.5 });
    assert.deepEqual(summary.byStatus, { sown: 1, planned: 2 });
    assert.equal(summary.recentActivities[0].fieldName, "North plot"); // via $lookup
  });

  it("sowing and harvest activities advance the field status", async () => {
    const field = await newField((await newFarm())._id);
    await request(app).post(`/api/fields/${field._id}/activities`).set(ALICE).send({ type: "harvest", quantity: 9.5, unit: "t" }).expect(201);
    const activities = (await request(app).get(`/api/fields/${field._id}/activities`).set(ALICE).expect(200)).body;
    assert.equal(activities[0].quantity, 9.5);
    const [updated] = (await request(app).get(`/api/farms/${field.farmId}/fields`).set(ALICE).expect(200)).body;
    assert.equal(updated.status, "harvested");
  });

  it("deleting a farm removes its fields and activities", async () => {
    const farm = await newFarm();
    const field = await newField(farm._id);
    await request(app).post(`/api/fields/${field._id}/activities`).set(ALICE).send({ type: "note" }).expect(201);
    await request(app).delete(`/api/farms/${farm._id}`).set(ALICE).expect(204);
    assert.equal(await mongoose.connection.collection("fields").countDocuments(), 0);
    assert.equal(await mongoose.connection.collection("activities").countDocuments(), 0);
  });

  it("gets a fertilizer plan from the Python ML service", async (t) => {
    const field = await newField((await newFarm())._id);
    const calls = [];
    t.mock.method(globalThis, "fetch", async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ crop: "rice", doses: [{ product: "DAP (18-46-0)", total_kg: 207.5 }] }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    });
    const res = await request(app).post(`/api/fields/${field._id}/fertilizer-plan`).set(ALICE).expect(200);
    assert.equal(res.body.doses[0].total_kg, 207.5);
    assert.match(calls[0].url, /\/recommend\/fertilizer$/);
    assert.deepEqual(calls[0].body, { crop: "rice", N: 20, P: 10, K: 40, area_ha: 2.5 });

    t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
    await request(app).post(`/api/fields/${field._id}/fertilizer-plan`).set(ALICE).expect(502);
  });

  it("issues S3 presigned upload URLs and records photo keys for the field only", async () => {
    const field = await newField((await newFarm())._id);
    const presign = (await request(app).post(`/api/fields/${field._id}/photos/presign`).set(ALICE)
      .send({ contentType: "image/jpeg", size: 120_000 }).expect(200)).body;
    assert.match(presign.key, new RegExp(`^fields/${field._id}/[0-9a-f-]+\\.jpg$`));
    const url = new URL(presign.uploadUrl);
    assert.equal(url.hostname, "agrioptima-test-bucket.s3.ap-south-1.amazonaws.com");
    assert.ok(url.searchParams.get("X-Amz-Signature"));

    await request(app).post(`/api/fields/${field._id}/photos/presign`).set(ALICE).send({ contentType: "image/gif", size: 10 }).expect(422);
    await request(app).post(`/api/fields/${field._id}/photos`).set(ALICE).send({ key: "fields/someone-else/x.jpg" }).expect(422);
    const saved = (await request(app).post(`/api/fields/${field._id}/photos`).set(ALICE).send({ key: presign.key }).expect(201)).body;
    assert.equal(saved.photos[0].url, `https://agrioptima-test-bucket.s3.ap-south-1.amazonaws.com/${presign.key}`);
  });

  it("pushes real-time events over Socket.IO only to the owner", async () => {
    const server = createServer(app);
    initRealtime(server);
    await new Promise((r) => server.listen(0, r));
    const url = `http://127.0.0.1:${server.address().port}`;

    const alice = ioClient(url, { auth: { token: token(1) }, transports: ["websocket"] });
    const bob = ioClient(url, { auth: { token: token(2) }, transports: ["websocket"] });
    const rejected = ioClient(url, { auth: { token: "bad" }, transports: ["websocket"] });
    try {
      await Promise.all([alice, bob].map((s) => new Promise((r) => s.on("connect", r))));
      const err = await new Promise((r) => rejected.on("connect_error", r));
      assert.equal(err.message, "unauthorized");

      let bobGotEvent = false;
      bob.on("activity:created", () => { bobGotEvent = true; });
      const received = new Promise((r) => alice.on("activity:created", r));

      const field = await newField((await newFarm())._id);
      await request(server).post(`/api/fields/${field._id}/activities`).set(ALICE).send({ type: "irrigation", notes: "2 hours" }).expect(201);
      const event = await received;
      assert.equal(event.fieldName, "North plot");
      assert.equal(event.type, "irrigation");
      await new Promise((r) => setTimeout(r, 100));
      assert.equal(bobGotEvent, false);
    } finally {
      [alice, bob, rejected].forEach((s) => s.close());
      await closeRealtime();
      await new Promise((r) => server.close(r));
    }
  });
});
