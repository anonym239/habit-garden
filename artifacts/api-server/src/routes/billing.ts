import { getAuth } from "@clerk/express";
import { Router, type IRouter, type RequestHandler } from "express";
import { findOrCreateCustomer, getOrCreateProPrice, hasStripeProSubscription, stripeRequest } from "../lib/stripePro";

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

function safeReturnOrigin(req: Parameters<RequestHandler>[0]): string {
  const origin = req.get("origin");
  if (origin?.startsWith("https://") || origin?.startsWith("http://localhost")) return origin;
  return `${req.protocol}://${req.get("host")}`;
}

router.get("/billing/status", requireAuth, async (_req, res) => {
  res.json({ isPro: await hasStripeProSubscription(res.locals.userId) });
});

router.post("/billing/checkout", requireAuth, async (req, res): Promise<void> => {
  try {
    const customer = await findOrCreateCustomer(res.locals.userId);
    const priceId = await getOrCreateProPrice();
    const origin = safeReturnOrigin(req);
    const returnPath = typeof req.body?.returnPath === "string" && req.body.returnPath.startsWith("/")
      ? req.body.returnPath
      : "/upgrade";
    const session = await stripeRequest<{ url?: string }>("/v1/checkout/sessions", {
      method: "POST",
      body: new URLSearchParams({
        customer: customer.id,
        mode: "subscription",
        "payment_method_types[0]": "card",
        "payment_method_types[1]": "sepa_debit",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "subscription_data[metadata][clerkUserId]": res.locals.userId,
        "subscription_data[metadata][app]": "habit-garden",
        "subscription_data[metadata][entitlement]": "pro",
        "metadata[clerkUserId]": res.locals.userId,
        "metadata[app]": "habit-garden",
        allow_promotion_codes: "true",
        success_url: `${origin}${returnPath}?checkout=success`,
        cancel_url: `${origin}${returnPath}?checkout=cancelled`,
      }),
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    res.json({ url: session.url });
  } catch (error) {
    req.log.error({ error }, "Unable to create Stripe checkout");
    res.status(503).json({ error: "Checkout is temporarily unavailable" });
  }
});

router.post("/billing/portal", requireAuth, async (req, res): Promise<void> => {
  try {
    const customer = await findOrCreateCustomer(res.locals.userId);
    const origin = safeReturnOrigin(req);
    const session = await stripeRequest<{ url: string }>("/v1/billing_portal/sessions", {
      method: "POST",
      body: new URLSearchParams({
        customer: customer.id,
        return_url: `${origin}/upgrade`,
      }),
    });
    res.json({ url: session.url });
  } catch (error) {
    req.log.error({ error }, "Unable to create Stripe portal");
    res.status(503).json({ error: "Subscription management is temporarily unavailable" });
  }
});

export default router;