import { NextResponse } from "next/server";

import { cleanPublicName } from "@/lib/public-identity";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

type ChatRow = Record<
  string,
  string | number | null
>;

const nameColumns = [
  "username",
  "user_email",
  "sender",
  "author",
  "name",
];

const messageColumns = [
  "message",
  "text",
  "content",
  "body",
];

function normalizeMessage(
  row: ChatRow
) {
  const nameValue =
    nameColumns
      .map((column) => row[column])
      .find(Boolean) || "Collector";

  const messageValue =
    messageColumns
      .map((column) => row[column])
      .find(Boolean) || "";

  return {
    id:
      String(row.id || row.created_at),
    created_at:
      String(
        row.created_at ||
        new Date().toISOString()
      ),
    username:
      cleanPublicName(
        String(nameValue)
      ),
    message:
      String(messageValue),
  };
}

async function getChatColumns(
  admin: ReturnType<
    typeof createSupabaseAdmin
  >
) {
  const { data } =
    await admin
      .from("chat")
      .select("*")
      .limit(1);

  const first =
    data?.[0] as
      | ChatRow
      | undefined;

  return first
    ? Object.keys(first)
    : [
        "username",
        "message",
        "created_at",
      ];
}

export async function GET() {
  try {
    const admin =
      createSupabaseAdmin();

    const { data, error } =
      await admin
        .from("chat")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(80);

    if (error) {
      return NextResponse.json({
        messages: [],
      });
    }

    return NextResponse.json({
      messages:
        (data || []).map(
          normalizeMessage
        ),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        messages: [],
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: "Login required",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const text =
      String(body.message || "")
        .trim()
        .slice(0, 600);

    if (!text) {
      return NextResponse.json(
        {
          error: "Message required",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createSupabaseAdmin();

    const {
      data: userData,
      error: userError,
    } =
      await admin.auth.getUser(
        token
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error: "Invalid session",
        },
        {
          status: 401,
        }
      );
    }

    const { data: profile } =
      await admin
        .from("market_profiles")
        .select("username")
        .eq(
          "id",
          userData.user.id
        )
        .maybeSingle();

    const publicName =
      cleanPublicName(
        profile?.username ||
        body.username
      );

    const columns =
      await getChatColumns(
        admin
      );

    const nameColumn =
      nameColumns.find((column) =>
        columns.includes(column)
      ) || "username";

    const messageColumn =
      messageColumns.find((column) =>
        columns.includes(column)
      ) || "message";

    const payload: Record<
      string,
      string
    > = {
      [nameColumn]: publicName,
      [messageColumn]: text,
    };

    if (
      columns.includes("user_id")
    ) {
      payload.user_id =
        userData.user.id;
    }

    const { data, error } =
      await admin
        .from("chat")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      message:
        normalizeMessage(
          data as ChatRow
        ),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Chat send failed",
      },
      {
        status: 500,
      }
    );
  }
}
