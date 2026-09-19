import { Router, type IRouter, type RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db, gardenSyncTable } from "@workspace/db";
import {
  GetGardenParams,
  GetGardenResponse,
  SaveGardenBody,
  SaveGardenParams,
  SaveGardenResponse,
} from "@workspace/api-zod";
import { hasProEntitlement } from "../lib/revenuecat";

const router: IRouter = Router();

const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  const userId = auth.sessionClaims?.userId ?? auth.userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.locals.userId = userId;
  next();
};

const requirePro: RequestHandler = async (_req, res, next) => {
  if (!(await hasProEntitlement(res.locals.userId))) {
    res.status(403).json({ error: "Habit Garden Pro is required" });
    return;
  }
  next();
};

router.get("/garden/:platform", requireAuth, requirePro, async (req, res): Promise<void> => {
  const params = GetGardenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [saved] = await db.select().from(gardenSyncTable).where(and(
    eq(gardenSyncTable.userId, res.locals.userId),
    eq(gardenSyncTable.platform, params.data.platform),
  ));
  res.json(GetGardenResponse.parse(saved ? {
    platform: saved.platform,
    data: saved.data,
    updatedAt: saved.updatedAt,
  } : { platform: params.data.platform, data: {}, updatedAt: new Date(0) }));
});

router.put("/garden/:platform", requireAuth, requirePro, async (req, res): Promise<void> => {
  const params = SaveGardenParams.safeParse(req.params);
  const body = SaveGardenBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [saved] = await db.insert(gardenSyncTable).values({
    userId: res.locals.userId,
    platform: params.data.platform,
    data: body.data.data,
  }).onConflictDoUpdate({
    target: [gardenSyncTable.userId, gardenSyncTable.platform],
    set: { data: body.data.data, updatedAt: new Date() },
  }).returning();
  res.json(SaveGardenResponse.parse({ platform: saved.platform, data: saved.data, updatedAt: saved.updatedAt }));
});

export default router;