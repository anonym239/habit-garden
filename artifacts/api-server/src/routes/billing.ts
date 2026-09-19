import { getAuth } from "@clerk/express";
import { Router, type IRouter, type RequestHandler } from "express";
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

router.get("/billing/status", requireAuth, async (_req, res) => {
  res.json({ isPro: await hasProEntitlement(res.locals.userId) });
});

export default router;