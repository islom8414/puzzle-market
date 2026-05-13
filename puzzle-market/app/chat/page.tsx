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

      loadMessages();

    };

  return (

    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)] pointer-events-none" />

      {/* HEADER */}

      <div className="relative border-b border-white/10 bg-black/70 backdrop-blur-xl shrink-0">

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-5">

          <p className="text-cyan-400 uppercase tracking-[0.3em] text-[10px] md:text-xs font-black">
            REALTIME MARKETPLACE CHAT
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3 leading-none">
            Live Messenger
          </h1>

          <p className="text-zinc-500 mt-3 text-sm md:text-base">
            Talk with collectors and traders realtime.
          </p>

        </div>

      </div>

      {/* CHAT AREA */}

      <div className="flex-1 overflow-y-auto">

        <div className="max-w-5xl mx-auto px-3 md:px-6 py-6 space-y-5">

          {messages.length === 0 && (

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">

              <h2 className="text-2xl md:text-3xl font-black">
                No Messages Yet
              </h2>

            </div>

          )}

          {messages.map((message, index) => {

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
                  className={`rounded-3xl px-5 py-4 max-w-[85%] md:max-w-[65%] break-words shadow-lg ${
                    own
                      ? "bg-cyan-400 text-black"
                      : "bg-white/5 border border-white/10 text-white"
                  }`}
                >

                  <p
                    className={`font-black text-xs uppercase tracking-[0.2em] break-all ${
                      own
                        ? "text-black/60"
                        : "text-cyan-400"
                    }`}
                  >
                    {message.username}
                  </p>

                  <p className="mt-3 text-sm md:text-lg leading-relaxed break-words">
                    {message.text}
                  </p>

                  <p
                    className={`text-[10px] md:text-xs mt-4 ${
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

          })}

          <div ref={bottomRef} />

        </div>

      </div>

      {/* INPUT */}

      <div className="border-t border-white/10 bg-black/80 backdrop-blur-xl shrink-0">

        <div className="max-w-5xl mx-auto px-3 md:px-6 py-4">

          <div className="flex gap-3">

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
              placeholder="Write message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-sm md:text-base outline-none focus:border-cyan-400"
            />

            <button
              onClick={sendMessage}
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-5 md:px-8 rounded-3xl transition whitespace-nowrap"
            >
              Send
            </button>

          </div>

        </div>

      </div>

    </main>

  );
}