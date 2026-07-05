import { NextResponse } from "next/server";

function retiredChatResponse() {
  return NextResponse.json(
    {
      error:
        "Community chat is retired. Use private support instead.",
    },
    {
      status: 410,
    }
  );
}

export const GET = retiredChatResponse;
export const POST = retiredChatResponse;
