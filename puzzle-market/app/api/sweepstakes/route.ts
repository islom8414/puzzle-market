import { NextResponse } from "next/server";

import {
  getSweepstakesSummary,
  sweepstakesPrizePool,
  sweepstakesWaves,
} from "@/lib/sweepstakes";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          authenticated: false,
          summary: null,
          waves: sweepstakesWaves,
          prizes: sweepstakesPrizePool,
        },
        { status: 200 }
      );
    }

    const admin = createSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const summary = await getSweepstakesSummary(
      admin,
      user.id
    );

    return NextResponse.json({
      authenticated: true,
      summary,
      waves: sweepstakesWaves,
      prizes: sweepstakesPrizePool,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load giveaway",
      },
      { status: 500 }
    );
  }
}
