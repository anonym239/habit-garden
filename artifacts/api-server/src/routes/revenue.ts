import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { GetRevenueResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const connectors = new ReplitConnectors();
let cache: { value: unknown; expires: number } | undefined;

router.get("/revenue", async (req, res): Promise<void> => {
  if (cache && cache.expires > Date.now()) {
    res.json(cache.value);
    return;
  }
  const projectId = process.env.REVENUECAT_PROJECT_ID;
  if (!projectId) {
    res.json(GetRevenueResponse.parse({ totalRevenueUsd: 0, activeSubscriptions: 0, updatedAt: new Date() }));
    return;
  }
  try {
    const response = await connectors.proxy("revenuecat", `/v2/projects/${projectId}/customers?limit=100`, { method: "GET" });
    if (!response.ok) throw new Error(`RevenueCat returned ${response.status}`);
    const customers = await response.json() as { items?: Array<{ id: string; total_revenue_in_usd?: number; active_entitlements?: unknown[] }> };
    const value = GetRevenueResponse.parse({
      totalRevenueUsd: customers.items?.reduce((sum, item) => sum + Number(item.total_revenue_in_usd ?? 0), 0) ?? 0,
      activeSubscriptions: customers.items?.filter((item) => (item.active_entitlements?.length ?? 0) > 0).length ?? 0,
      updatedAt: new Date(),
    });
    cache = { value, expires: Date.now() + 300_000 };
    res.json(value);
  } catch (error) {
    req.log.warn({ error }, "Could not load RevenueCat metrics");
    res.json(GetRevenueResponse.parse({ totalRevenueUsd: 0, activeSubscriptions: 0, updatedAt: new Date() }));
  }
});

export default router;