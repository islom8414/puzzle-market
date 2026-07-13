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
const apply = process.argv.includes("--apply");

if (!url || !serviceKey) {
  throw new Error("Missing Supabase environment");
}

const admin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function sanitizeUsername(value = "") {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 24);
}

function normalizeReferralCode(value = "") {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

function makeReferralCode(username, userId) {
  const base =
    normalizeReferralCode(username)
      .replace(/[_-]/g, "")
      .slice(0, 12) || "PUZZLE";
  const suffix = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `${base}-${suffix}`;
}

function isCompleteUsername(value) {
  return sanitizeUsername(value).length >= 3;
}

function usernameCandidates(user) {
  const idSuffix = user.id.replace(/-/g, "").slice(0, 8);
  const metadata = user.user_metadata || {};
  const raw = [
    metadata.username,
    metadata.preferred_username,
    `collector_${idSuffix}`,
  ];
  const unique = new Set();
  for (const value of raw) {
    const clean = sanitizeUsername(value || "");
    if (isCompleteUsername(clean)) unique.add(clean);
  }
  unique.add(`collector_${idSuffix}`);
  unique.add(`collector_${user.id.replace(/-/g, "").slice(0, 12)}`);
  return [...unique];
}

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
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...(data.users || []));
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

async function createProfileFor(user) {
  if (!user.email) {
    return { ok: false, reason: "missing_email" };
  }

  for (const username of usernameCandidates(user)) {
    const payload = {
      id: user.id,
      email: user.email,
      username,
      referral_code: makeReferralCode(username, user.id),
      referred_by_user_id: null,
      referral_applied_at: null,
    };

    const { error } = await admin
      .from("market_profiles")
      .upsert(payload, { onConflict: "id" });

    if (!error) {
      await admin
        .from("wallet_accounts")
        .upsert({ user_id: user.id }, { onConflict: "user_id" });
      return { ok: true, username };
    }

    if (
      error.code !== "23505" &&
      !error.message?.toLowerCase().includes("duplicate")
    ) {
      return { ok: false, reason: error.message };
    }
  }

  return { ok: false, reason: "username_conflict" };
}

const [users, profilesResult] = await Promise.all([
  listAllUsers(),
  admin.from("market_profiles").select("id,username"),
]);

if (profilesResult.error) throw profilesResult.error;

const profileIds = new Set((profilesResult.data || []).map((profile) => profile.id));
const missing = users.filter((user) => !profileIds.has(user.id));

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "preview",
      missing_profiles_count: missing.length,
      missing_profiles: missing.map((user) => ({
        id: maskId(user.id),
        providers: providersFor(user),
        has_email: Boolean(user.email),
        has_username_metadata: Boolean(user.user_metadata?.username),
        has_name_metadata: Boolean(
          user.user_metadata?.full_name || user.user_metadata?.name
        ),
        selected_username_preview: usernameCandidates(user)[0],
      })),
    },
    null,
    2
  )
);

if (!apply) {
  process.exit(0);
}

const results = [];
for (const user of missing) {
  const result = await createProfileFor(user);
  results.push({
    id: maskId(user.id),
    providers: providersFor(user),
    ok: result.ok,
    reason: result.reason || null,
    username_created: Boolean(result.username),
  });
}

console.log(
  JSON.stringify(
    {
      created_count: results.filter((result) => result.ok).length,
      failed_count: results.filter((result) => !result.ok).length,
      results,
    },
    null,
    2
  )
);
