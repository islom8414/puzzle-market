import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  const content = fs.readFileSync(file, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

loadEnv(path.join(process.cwd(), ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing Supabase environment");
}

const admin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function maskId(id) {
  return `${String(id).slice(0, 8)}...${String(id).slice(-4)}`;
}

function providersFor(user) {
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const providers = identities
    .map((identity) => identity.provider)
    .filter(Boolean);
  if (providers.length) return [...new Set(providers)].sort();
  return [user.app_metadata?.provider || "unknown"];
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    users.push(...(data.users || []));
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

const [users, profilesResult, walletsResult] = await Promise.all([
  listAllUsers(),
  admin
    .from("market_profiles")
    .select("id,username,created_at,referral_code,subscription_tier,subscription_status"),
  admin.from("wallet_accounts").select("user_id,created_at,balance_cents"),
]);

if (profilesResult.error) throw profilesResult.error;
if (walletsResult.error) throw walletsResult.error;

const profiles = profilesResult.data || [];
const wallets = walletsResult.data || [];
const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
const userMap = new Map(users.map((user) => [user.id, user]));
const walletMap = new Map(wallets.map((wallet) => [wallet.user_id, wallet]));

const missingProfiles = users.filter((user) => !profileMap.has(user.id));
const orphanProfiles = profiles.filter((profile) => !userMap.has(profile.id));
const missingWallets = profiles.filter((profile) => !walletMap.has(profile.id));

const providerBreakdown = {};
for (const user of users) {
  const key = providersFor(user).join("+");
  providerBreakdown[key] = (providerBreakdown[key] || 0) + 1;
}

const missingProviderBreakdown = {};
for (const user of missingProfiles) {
  const key = providersFor(user).join("+");
  missingProviderBreakdown[key] = (missingProviderBreakdown[key] || 0) + 1;
}

const missingProfileDetails = missingProfiles.map((user) => ({
  id: maskId(user.id),
  providers: providersFor(user),
  created_at: user.created_at,
  last_sign_in_at: user.last_sign_in_at,
  email_confirmed: Boolean(user.email_confirmed_at),
  has_username_metadata: Boolean(user.user_metadata?.username),
  has_name_metadata: Boolean(user.user_metadata?.full_name || user.user_metadata?.name),
  has_email: Boolean(user.email),
  banned_until: user.banned_until || null,
  deleted_at: user.deleted_at || null,
}));

const orphanProfileDetails = orphanProfiles.map((profile) => ({
  id: maskId(profile.id),
  username_present: Boolean(profile.username),
  created_at: profile.created_at,
}));

const missingWalletDetails = missingWallets.map((profile) => ({
  id: maskId(profile.id),
  username_present: Boolean(profile.username),
  created_at: profile.created_at,
}));

console.log(
  JSON.stringify(
    {
      project_url_host: new URL(url).host,
      auth_users_count: users.length,
      market_profiles_count: profiles.length,
      wallet_accounts_count: wallets.length,
      missing_profiles_count: missingProfiles.length,
      orphan_profiles_count: orphanProfiles.length,
      missing_wallets_for_profiles_count: missingWallets.length,
      provider_breakdown: providerBreakdown,
      missing_profile_provider_breakdown: missingProviderBreakdown,
      missing_profiles: missingProfileDetails,
      orphan_profiles: orphanProfileDetails,
      missing_wallets_for_profiles: missingWalletDetails,
    },
    null,
    2
  )
);
