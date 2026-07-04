import { Router, type Request, type Response } from "express";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { requireTenant, tenantScope } from "../middleware/tenant.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireTenant);

dashboardRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const db = getDb();

    // 1. Count active agents
    const activeAgents = await db
      .collection("agents")
      .countDocuments(tenantScope(req, { status: "active" }));

    // 2. Count calls placed/received today (since UTC midnight)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const callsToday = await db
      .collection("calls")
      .countDocuments(tenantScope(req, {
        createdAt: { $gte: startOfToday }
      }));

    // 3. Count active (running) campaigns
    const activeCampaigns = await db
      .collection("campaigns")
      .countDocuments(tenantScope(req, { status: "running" }));

    res.json({
      activeAgents,
      callsToday,
      activeCampaigns,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
