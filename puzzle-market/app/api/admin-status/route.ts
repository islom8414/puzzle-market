import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/market-access";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export async function GET(
  request: Request
) {
  const token =
    getBearerToken(request);

  if (!token) {
    return NextResponse.json({
      allowed: false,
    });
  }

  const admin =
    createSupabaseAdmin();

  const {
    data,
  } =
    await admin.auth.getUser(
      token
    );

  return NextResponse.json({
    allowed: isAdminUser(data.user),
  });
}
