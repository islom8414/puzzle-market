import fs from "node:fs";

const requiredFiles = [
  "lib/user-profile.ts",
  "app/api/profile/route.ts",
  "app/api/create-checkout-session/route.ts",
  "app/api/create-subscription-session/route.ts",
  "app/api/create-custom-puzzle-order-session/route.ts",
  "app/api/list-owned-piece/route.ts",
  "app/api/purchase-listing/route.ts",
  "app/api/stripe/connect-onboarding/route.ts",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const helper = fs.readFileSync("lib/user-profile.ts", "utf8");

for (const expected of [
  "export async function ensureUserProfile",
  "collector_",
  "wallet_accounts",
  "onConflict: \"id\"",
]) {
  if (!helper.includes(expected)) {
    throw new Error(`ensureUserProfile is missing: ${expected}`);
  }
}

for (const route of requiredFiles.filter((file) => file.startsWith("app/api/"))) {
  const source = fs.readFileSync(route, "utf8");
  if (!source.includes("ensureUserProfile")) {
    throw new Error(`${route} does not call ensureUserProfile`);
  }
}

console.log("Auth profile recovery checks passed.");
