import { ReplitConnectors } from "@replit/connectors-sdk";

const PRODUCT_NAME = "Habit Garden Pro";
const cache = new Map<string, { value: boolean; expiresAt: number }>();
const connectors = new ReplitConnectors();

export async function stripeRequest<T>(
  path: string,
  options: { method?: string; body?: URLSearchParams } = {},
): Promise<T> {
  const response = await connectors.proxy("stripe", path, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
    body: options.body?.toString(),
  });
  if (!response.ok) throw new Error(`Stripe returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getOrCreateProPrice(): Promise<string> {
  const products = await stripeRequest<{
    data: Array<{ id: string; metadata?: Record<string, string> }>;
  }>(`/v1/products/search?query=${encodeURIComponent(`name:'${PRODUCT_NAME}' AND active:'true'`)}`);
  const product = products.data.find((item) => item.metadata?.app === "habit-garden");
  if (!product) throw new Error("Habit Garden Pro has not been configured in Stripe");

  const prices = await stripeRequest<{
    data: Array<{ id: string; currency: string; recurring?: { interval?: string } }>;
  }>(`/v1/prices?product=${encodeURIComponent(product.id)}&active=true&type=recurring&limit=20`);
  const price = prices.data.find(
    (item) => item.currency === "eur" && item.recurring?.interval === "month",
  );
  if (!price) throw new Error("The monthly Habit Garden Pro price is unavailable");
  return price.id;
}

export async function findOrCreateCustomer(userId: string): Promise<{ id: string }> {
  const query = `metadata['clerkUserId']:'${userId.replaceAll("'", "")}'`;
  const matches = await stripeRequest<{ data: Array<{ id: string }> }>(
    `/v1/customers/search?query=${encodeURIComponent(query)}&limit=1`,
  );
  if (matches.data[0]) return matches.data[0];
  return stripeRequest<{ id: string }>("/v1/customers", {
    method: "POST",
    body: new URLSearchParams({
      "metadata[clerkUserId]": userId,
      "metadata[app]": "habit-garden",
    }),
  });
}

export async function hasStripeProSubscription(userId: string): Promise<boolean> {
  const existing = cache.get(userId);
  if (existing && existing.expiresAt > Date.now()) return existing.value;

  try {
    const query = `metadata['clerkUserId']:'${userId.replaceAll("'", "")}'`;
    const customers = await stripeRequest<{ data: Array<{ id: string }> }>(
      `/v1/customers/search?query=${encodeURIComponent(query)}&limit=10`,
    );
    for (const customer of customers.data) {
      const subscriptions = await stripeRequest<{
        data: Array<{ status: string; metadata?: Record<string, string> }>;
      }>(`/v1/subscriptions?customer=${encodeURIComponent(customer.id)}&status=all&limit=20`);
      const active = subscriptions.data.some(
        (subscription) =>
          ["active", "trialing"].includes(subscription.status) &&
          subscription.metadata?.app === "habit-garden",
      );
      if (active) {
        cache.set(userId, { value: true, expiresAt: Date.now() + 60_000 });
        return true;
      }
    }
  } catch {
    // RevenueCat remains available when Stripe has a temporary outage.
  }
  cache.set(userId, { value: false, expiresAt: Date.now() + 15_000 });
  return false;
}