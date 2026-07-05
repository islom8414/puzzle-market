import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/market-access";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const {
    data: { user },
  } = await admin.auth.getUser(token);

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { data: orders, error } = await admin
    .from("custom_puzzle_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = Array.from(
    new Set((orders || []).map((order) => order.user_id).filter(Boolean))
  );

  const { data: profiles } = userIds.length
    ? await admin
        .from("market_profiles")
        .select("id, username, email")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  return NextResponse.json({
    orders: (orders || []).map((order) => ({
      ...order,
      profile: profileMap.get(order.user_id) || null,
    })),
  });
}
