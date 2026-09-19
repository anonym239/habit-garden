import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await connectors.proxy("revenuecat", path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text}`);
  return text ? JSON.parse(text) as T : ({} as T);
}

type Item = { id: string; name?: string; type?: string; lookup_key?: string; store_identifier?: string; app_id?: string; is_current?: boolean; key?: string };
type List = { items: Item[] };

async function main() {
  const projects = await request<List>("/v2/projects?limit=100");
  let project = projects.items.find((item) => item.name === "Habit Garden");
  if (!project) project = await request<Item>("/v2/projects", "POST", { name: "Habit Garden" });

  const projectPath = `/v2/projects/${project.id}`;
  const apps = await request<List>(`${projectPath}/apps?limit=100`);
  const testApp = apps.items.find((item) => item.type === "test_store");
  if (!testApp) throw new Error("RevenueCat Test Store app was not created automatically.");

  let playApp = apps.items.find((item) => item.type === "play_store");
  if (!playApp) {
    playApp = await request<Item>(`${projectPath}/apps`, "POST", {
      name: "Habit Garden Android",
      type: "play_store",
      play_store: { package_name: "com.habitgarden.app" },
    });
  }

  const products = await request<List>(`${projectPath}/products?limit=100`);
  const ensureProduct = async (appId: string, storeIdentifier: string, test: boolean) => {
    let product = products.items.find((item) => item.app_id === appId && item.store_identifier === storeIdentifier);
    if (!product) {
      product = await request<Item>(`${projectPath}/products`, "POST", {
        app_id: appId,
        store_identifier: storeIdentifier,
        type: "subscription",
        display_name: "Habit Garden Pro",
        ...(test ? { title: "Habit Garden Pro", subscription: { duration: "P1M" } } : {}),
      });
    }
    return product;
  };
  const testProduct = await ensureProduct(testApp.id, "habit_garden_pro_monthly", true);
  const playProduct = await ensureProduct(playApp.id, "habit_garden_pro:monthly", false);
  const ensureDonationProduct = async (appId: string, storeIdentifier: string, test: boolean) => {
    let product = products.items.find((item) => item.app_id === appId && item.store_identifier === storeIdentifier);
    if (!product) {
      product = await request<Item>(`${projectPath}/products`, "POST", {
        app_id: appId,
        store_identifier: storeIdentifier,
        type: "consumable",
        display_name: "Habit Garden Spende",
        ...(test ? { title: "Habit Garden Spende" } : {}),
      });
    }
    return product;
  };
  const testDonation = await ensureDonationProduct(testApp.id, "habit_garden_donation", true);
  const playDonation = await ensureDonationProduct(playApp.id, "habit_garden_donation", false);

  try {
    await request(`${projectPath}/products/${testProduct.id}/test_store_prices`, "POST", {
      prices: [{ amount_micros: 2990000, currency: "EUR" }, { amount_micros: 2990000, currency: "USD" }],
    });
  } catch (error) {
    if (!String(error).includes("resource_already_exists")) throw error;
  }
  try {
    await request(`${projectPath}/products/${testDonation.id}/test_store_prices`, "POST", {
      prices: [{ amount_micros: 2990000, currency: "EUR" }, { amount_micros: 2990000, currency: "USD" }],
    });
  } catch (error) {
    if (!String(error).includes("resource_already_exists")) throw error;
  }

  const entitlements = await request<List>(`${projectPath}/entitlements?limit=100`);
  let entitlement = entitlements.items.find((item) => item.lookup_key === "pro");
  if (!entitlement) entitlement = await request<Item>(`${projectPath}/entitlements`, "POST", { lookup_key: "pro", display_name: "Habit Garden Pro" });
  await request(`${projectPath}/entitlements/${entitlement.id}/actions/attach_products`, "POST", { product_ids: [testProduct.id, playProduct.id] });

  const offerings = await request<List>(`${projectPath}/offerings?limit=100`);
  let offering = offerings.items.find((item) => item.lookup_key === "default");
  if (!offering) offering = await request<Item>(`${projectPath}/offerings`, "POST", { lookup_key: "default", display_name: "Habit Garden Pro" });
  if (!offering.is_current) await request(`${projectPath}/offerings/${offering.id}`, "PATCH", { is_current: true });

  const packages = await request<List>(`${projectPath}/offerings/${offering.id}/packages?limit=100`);
  let pkg = packages.items.find((item) => item.lookup_key === "$rc_monthly");
  if (!pkg) pkg = await request<Item>(`${projectPath}/offerings/${offering.id}/packages`, "POST", { lookup_key: "$rc_monthly", display_name: "Monatlich" });
  await request(`${projectPath}/packages/${pkg.id}/actions/attach_products`, "POST", {
    products: [
      { product_id: testProduct.id, eligibility_criteria: "all" },
      { product_id: playProduct.id, eligibility_criteria: "all" },
    ],
  });
  const updatedPackages = await request<List>(`${projectPath}/offerings/${offering.id}/packages?limit=100`);
  let donationPackage = updatedPackages.items.find((item) => item.lookup_key === "$rc_custom_donation");
  if (!donationPackage) donationPackage = await request<Item>(`${projectPath}/offerings/${offering.id}/packages`, "POST", { lookup_key: "$rc_custom_donation", display_name: "Einmalige Spende" });
  await request(`${projectPath}/packages/${donationPackage.id}/actions/attach_products`, "POST", {
    products: [
      { product_id: testDonation.id, eligibility_criteria: "all" },
      { product_id: playDonation.id, eligibility_criteria: "all" },
    ],
  });

  const keys = await request<List>(`${projectPath}/apps/${testApp.id}/public_api_keys`);
  const playKeys = await request<List>(`${projectPath}/apps/${playApp.id}/public_api_keys`);
  process.stdout.write(JSON.stringify({
    projectId: project.id,
    testAppId: testApp.id,
    playAppId: playApp.id,
    testApiKey: keys.items[0]?.key,
    androidApiKey: playKeys.items[0]?.key,
  }));
}

main().catch((error) => {
  process.stderr.write(String(error));
  process.exitCode = 1;
});