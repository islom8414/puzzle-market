import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This legacy purchase route is disabled. Use the secure listing purchase flow.",
    },
    {
      status: 410,
    }
  );
}
