import { NextResponse } from "next/server";

import {
  cleanPublicName,
  isPlatformOwnerEmail,
  platformOwnerName,
} from "@/lib/public-identity";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

type SupportThread = {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  market_profiles?: {
    username?: string | null;
  } | null;
  support_messages?: SupportMessage[];
};

type SupportMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

async function getSessionUser(
  request: Request
) {
  const token =
    getBearerToken(request);

  if (!token) {
    return {
      error: NextResponse.json(
        {
          error: "Login required",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const admin =
    createSupabaseAdmin();

  const {
    data,
    error,
  } =
    await admin.auth.getUser(
      token
    );

  if (
    error ||
    !data.user
  ) {
    return {
      error: NextResponse.json(
        {
          error: "Invalid session",
        },
        {
          status: 401,
        }
      ),
    };
  }

  return {
    admin,
    user: data.user,
    isAdmin:
      isPlatformOwnerEmail(
        data.user.email
      ),
  };
}

function shapeThread(
  thread: SupportThread
) {
  return {
    id: thread.id,
    subject: thread.subject,
    status: thread.status,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
    ownerName:
      cleanPublicName(
        thread.market_profiles
          ?.username
      ),
    messages:
      (
        thread.support_messages ||
        []
      )
        .slice()
        .sort(
          (a, b) =>
            new Date(
              a.created_at
            ).getTime() -
            new Date(
              b.created_at
            ).getTime()
        )
        .map((message) => ({
          id: message.id,
          role:
            message.sender_role,
          body: message.body,
          created_at:
            message.created_at,
          name:
            message.sender_role ===
            "admin"
              ? platformOwnerName
              : cleanPublicName(
                  thread
                    .market_profiles
                    ?.username
                ),
        })),
  };
}

export async function GET(
  request: Request
) {
  try {
    const session =
      await getSessionUser(
        request
      );

    if (session.error) {
      return session.error;
    }

    const query =
      session.admin
        .from("support_threads")
        .select(
          "*,market_profiles(username),support_messages(*)"
        )
        .order("updated_at", {
          ascending: false,
        });

    const {
      data,
      error,
    } =
      session.isAdmin
        ? await query
        : await query.eq(
            "user_id",
            session.user.id
          );

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
      isAdmin:
        session.isAdmin,
      threads:
        (data || []).map(
          (thread) =>
            shapeThread(
              thread as SupportThread
            )
        ),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Support load failed",
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
    const session =
      await getSessionUser(
        request
      );

    if (session.error) {
      return session.error;
    }

    const body =
      await request.json();

    const message =
      String(body.message || "")
        .trim()
        .slice(0, 1200);

    if (!message) {
      return NextResponse.json(
        {
          error: "Message required",
        },
        {
          status: 400,
        }
      );
    }

    let threadId =
      String(body.threadId || "");

    if (!threadId) {
      const subject =
        String(
          body.subject ||
            "Support request"
        )
          .trim()
          .slice(0, 120);

      const {
        data: thread,
        error: threadError,
      } =
        await session.admin
          .from("support_threads")
          .insert({
            user_id:
              session.user.id,
            subject,
          })
          .select("*")
          .single();

      if (
        threadError ||
        !thread
      ) {
        return NextResponse.json(
          {
            error:
              threadError?.message ||
              "Thread create failed",
          },
          {
            status: 500,
          }
        );
      }

      threadId = thread.id;
    } else if (!session.isAdmin) {
      const {
        data: thread,
      } =
        await session.admin
          .from("support_threads")
          .select("id")
          .eq("id", threadId)
          .eq(
            "user_id",
            session.user.id
          )
          .maybeSingle();

      if (!thread) {
        return NextResponse.json(
          {
            error: "Thread not found",
          },
          {
            status: 404,
          }
        );
      }
    }

    const {
      error: messageError,
    } =
      await session.admin
        .from(
          "support_messages"
        )
        .insert({
          thread_id: threadId,
          sender_user_id:
            session.user.id,
          sender_role:
            session.isAdmin
              ? "admin"
              : "user",
          body: message,
        });

    if (messageError) {
      return NextResponse.json(
        {
          error:
            messageError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Support send failed",
      },
      {
        status: 500,
      }
    );
  }
}
