import { ReplitConnectors } from "@replit/connectors-sdk";
import { hasStripeProSubscription } from "./stripePro";

const connectors = new ReplitConnectors();
let proEntitlementId: string | undefined;

async function revenueCatRequest<T>(path: string): Promise<T> {
  const response = await connectors.proxy("revenuecat", path, { method: "GET" });
  if (!response.ok) throw new Error(`RevenueCat returned ${response.status}`);
  return response.json() as Promise<T>;
}

async function hasRevenueCatProEntitlement(userId: string): Promise<boolean> {
  const projectId = process.env.REVENUECAT_PROJECT_ID;
  if (!projectId) return false;

  if (!proEntitlementId) {
    const entitlements = await revenueCatRequest<{ items?: Array<{ id: string; lookup_key?: string }> }>(
      `/v2/projects/${projectId}/entitlements?limit=100`,
    );
    proEntitlementId = entitlements.items?.find((item) => item.lookup_key === "pro")?.id;
  }
  if (!proEntitlementId) return false;

  try {
    const active = await revenueCatRequest<{
      items?: Array<{ entitlement_id?: string; lookup_key?: string }>;
    }>(
      `/v2/projects/${projectId}/customers/${encodeURIComponent(userId)}/active_entitlements?limit=100`,
    );
    return active.items?.some(
      (item) => item.entitlement_id === proEntitlementId || item.lookup_key === "pro",
    ) ?? false;
  } catch {
    return false;
  }
}

export async function hasProEntitlement(userId: string): Promise<boolean> {
  const [revenueCat, stripe] = await Promise.all([
    hasRevenueCatProEntitlement(userId),
    hasStripeProSubscription(userId),
  ]);
  return revenueCat || stripe;
}