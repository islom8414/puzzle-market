"use client";

import { useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";

type Message = {

  id?: number;

  username: string;

  text: string;

  created_at?: string;

};

export default function ChatPage() {

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [text, setText] =
    useState("");

  const [username, setUsername] =
    useState("Guest");

  const [loading, setLoading] =
    useState(true);

  const bottomRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {

    const savedUser =
      localStorage.getItem(
        "puzzle-user"
      );

    if (savedUser) {

      setUsername(savedUser);

    }

    loadMessages();

    const channel =
      supabase
        .channel(
          "live-chat"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat",
          },
          () => {

            loadMessages();

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);

  const loadMessages =
    async () => {

      const {
        data,
      } =
        await supabase
          .from("chat")
          .select("*")
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

      if (data) {

        setMessages(data);

      }

      setLoading(false);

    };

  const sendMessage =
    async () => {

      if (!text.trim()) {

        return;

      }

      await supabase
        .from("chat")
        .insert([
          {

            username,

            text,

          },
        ]);

      setText("");

    };

  return (

   <main className="h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* BG */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      {/* HERO */}

      <div className="relative border-b border-white/10 bg-white/[0.03] backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

          <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
            REALTIME MARKETPLACE CHAT
          </p>

          <h1 className="text-5xl md:text-7xl font-black mt-5 leading-[0.95]">
            Live
            <br />
            Messenger
          </h1>

          <p className="text-zinc-400 text-lg mt-8 max-w-2xl leading-relaxed">
            Talk with collectors, sellers and realtime marketplace traders.
          </p>

        </div>

      </div>

      {/* CHAT */}

      <div className="relative flex-1 overflow-y-auto">

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-6">

          {loading && (

            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-16 text-center">

              <h2 className="text-5xl font-black">
                Loading Chat...
              </h2>

            </div>

          )}

          {messages.map(
            (message, index) => {

              const own =
                message.username ===
                username;

              return (

                <div
                  key={index}
                  className={`flex ${
                    own
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[80%] rounded-[28px] px-6 py-5 border backdrop-blur-xl ${
                      own
                        ? "bg-cyan-400 text-black border-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.35)]"
                        : "bg-white/[0.03] border-white/10 text-white"
                    }`}
                  >

                    <p
                      className={`text-xs uppercase tracking-[0.25em] font-black ${
                        own
                          ? "text-black/60"
                          : "text-cyan-400"
                      }`}
                    >
                      {message.username}
                    </p>

                    <p className="mt-4 text-lg break-words leading-relaxed">
                      {message.text}
                    </p>

                    <p
                      className={`text-xs mt-4 ${
                        own
                          ? "text-black/60"
                          : "text-zinc-500"
                      }`}
                    >

                      {message.created_at
                        ? new Date(
                            message.created_at
                          ).toLocaleTimeString()
                        : "LIVE"}

                    </p>

                  </div>

                </div>

              );

            }
          )}

          <div ref={bottomRef} />

        </div>

      </div>

      {/* INPUT */}

      <div className="relative border-t border-white/10 bg-black/70 backdrop-blur-xl">

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">

          <div className="flex gap-4">

            <input
              value={text}
              onChange={(e) =>
                setText(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {

                  sendMessage();

                }

              }}
              placeholder="Send realtime marketplace message..."
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
            />

            <button
              onClick={sendMessage}
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-10 rounded-3xl transition shadow-[0_0_35px_rgba(34,211,238,0.35)]"
            >
              Send
            </button>

          </div>

        </div>

      </div>

    </main>

  );
}