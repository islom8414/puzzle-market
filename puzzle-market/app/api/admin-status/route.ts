import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/market-access";
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

  const email =
    data.user?.email?.toLowerCase() ||
    "";

  return NextResponse.json({
    allowed: isAdminEmail(email),
  });
}
