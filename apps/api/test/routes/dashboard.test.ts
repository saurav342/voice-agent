import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import request from "supertest";
import type { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ObjectId } from "mongodb";

import { createApp } from "../../src/server.js";
import { connectDb, closeDb, getDb } from "../../src/db/connection.js";
import { signAuthToken } from "../../src/lib/jwt.js";

process.env.JWT_SECRET = "test-secret-must-be-at-least-16-chars-long";
process.env.BYOK_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let mongo: MongoMemoryServer;
let app: Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri(), "voiceplatform-dashboard-test");
  app = createApp();
});

afterAll(async () => {
  await closeDb();
  await mongo.stop();
});

beforeEach(async () => {
  for (const c of ["users", "tenants", "agents", "calls", "campaigns"]) {
    await getDb().collection(c).deleteMany({});
  }
});

let providerClientIdSeq = 80_000;

async function seedTenantAndOwner(
  email = "owner@example.com",
): Promise<{ token: string; tenantId: string }> {
  const db = getDb();
  const tenantId = new ObjectId().toString();
  await db.collection("tenants").insertOne({
    _id: tenantId,
    name: "Acme",
    plan: "starter",
    status: "active",
    telephony: {
      provider: "voicelink",
      providerClientId: providerClientIdSeq++,
      walletThresholdNotify: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const userId = new ObjectId().toString();
  await db.collection("users").insertOne({
    _id: userId,
    email,
    passwordHash: "x",
    role: "owner",
    isSuperadmin: false,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const token = signAuthToken({
    sub: userId,
    tenantId,
    role: "owner",
    isSuperadmin: false,
  });
  return { token, tenantId };
}

describe("GET /dashboard/stats", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/dashboard/stats");
    expect(res.status).toBe(401);
  });

  it("returns 0 stats for a fresh tenant", async () => {
    const { token } = await seedTenantAndOwner();
    const res = await request(app)
      .get("/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      activeAgents: 0,
      callsToday: 0,
      activeCampaigns: 0,
    });
  });

  it("calculates active agents, calls today, and running campaigns with tenant isolation", async () => {
    const { token, tenantId } = await seedTenantAndOwner("a@example.com");
    const { tenantId: otherTenantId } = await seedTenantAndOwner("b@example.com");

    const db = getDb();

    // 1. Seed agents for main tenant: 2 active, 1 draft
    await db.collection("agents").insertMany([
      { _id: "a1", tenantId, name: "Agent 1", status: "active", createdAt: new Date() },
      { _id: "a2", tenantId, name: "Agent 2", status: "active", createdAt: new Date() },
      { _id: "a3", tenantId, name: "Agent 3", status: "draft", createdAt: new Date() },
      // Other tenant agent
      { _id: "b1", tenantId: otherTenantId, name: "Agent Other", status: "active", createdAt: new Date() },
    ]);

    // 2. Seed calls for main tenant: 2 today, 1 yesterday
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.collection("calls").insertMany([
      { _id: "c1", tenantId, status: "completed", createdAt: today },
      { _id: "c2", tenantId, status: "ringing", createdAt: today },
      { _id: "c3", tenantId, status: "failed", createdAt: yesterday },
      // Other tenant call
      { _id: "c4", tenantId: otherTenantId, status: "completed", createdAt: today },
    ]);

    // 3. Seed campaigns for main tenant: 1 running, 1 paused, 1 draft
    await db.collection("campaigns").insertMany([
      { _id: "cp1", tenantId, name: "Camp 1", status: "running", createdAt: new Date() },
      { _id: "cp2", tenantId, name: "Camp 2", status: "paused", createdAt: new Date() },
      { _id: "cp3", tenantId, name: "Camp 3", status: "draft", createdAt: new Date() },
      // Other tenant campaign
      { _id: "cp4", tenantId: otherTenantId, name: "Camp Other", status: "running", createdAt: new Date() },
    ]);

    const res = await request(app)
      .get("/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      activeAgents: 2,
      callsToday: 2,
      activeCampaigns: 1,
    });
  });
});
