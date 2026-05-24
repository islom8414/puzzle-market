"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { cleanPublicName } from "@/lib/public-identity";

type ChatMessage = {
  id: number;
  created_at: string;
  username: string;
  message: string;
};

export default function ChatPage() {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [message, setMessage] =
    useState("");

  const [username, setUsername] =
    useState("Collector");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadChat();

    const channel =
      supabase
        .channel("public-chat")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat",
          },
          (payload) => {
            setMessages((current) => [
              payload.new as ChatMessage,
              ...current,
            ]);
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  async function loadChat() {
    const {
      data: {
        user,
      },
    } =
      await supabase.auth
        .getUser();

    if (user) {
      const { data: profile } =
        await supabase
          .from("market_profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

      const publicName =
        cleanPublicName(
          profile?.username ||
          localStorage.getItem(
            "puzzle-username"
          )
        );

      setUsername(publicName);
    }

    const { data } =
      await supabase
        .from("chat")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(80);

    setMessages(data || []);
    setLoading(false);
  }

  async function sendMessage() {
    const text =
      message.trim();

    if (text.length < 1) {
      return;
    }

    const {
      data: {
        user,
      },
    } =
      await supabase.auth
        .getUser();

    if (!user) {
      alert("Login required");
      location.href = "/login";
      return;
    }

    const publicName =
      cleanPublicName(username);

    const { error } =
      await supabase
        .from("chat")
        .insert({
          username: publicName,
          message: text,
        });

    if (error) {
      alert(
        "Chat is not ready yet. Check the chat table columns."
      );
      console.log(error);
      return;
    }

    setMessage("");
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Live Collector Chat
        </p>

        <h1 className="mt-5 text-5xl md:text-7xl font-black leading-none">
          Community Chat
        </h1>

        <p className="mt-6 max-w-2xl text-zinc-400 text-lg">
          Talk with collectors using public usernames. Emails and account details stay hidden.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-4 md:p-6">
            <div className="flex gap-3">
              <input
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Write a message..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400"
              />

              <button
                onClick={sendMessage}
                className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
              >
                Send
              </button>
            </div>

            <div className="mt-6 max-h-[620px] space-y-3 overflow-y-auto pr-1">
              {loading && (
                <div className="rounded-2xl border border-white/10 bg-black p-5 text-zinc-400">
                  Loading chat...
                </div>
              )}

              {!loading &&
                messages.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-black text-cyan-400">
                        {cleanPublicName(
                          item.username
                        )}
                      </p>

                      <p className="text-xs text-zinc-600">
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    <p className="mt-2 text-zinc-200">
                      {item.message}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <aside className="rounded-[32px] border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
            <h2 className="text-2xl font-black">
              Privacy Rule
            </h2>

            <p className="mt-4 text-zinc-400">
              Chat shows only public usernames. The platform owner stays hidden behind the marketplace vault identity.
            </p>

            <a
              href="/support"
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white/5 py-4 font-black transition hover:border-cyan-400"
            >
              Need Support
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}
