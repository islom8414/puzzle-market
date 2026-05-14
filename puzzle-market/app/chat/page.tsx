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
    useState("ShadowUser");

  const bottomRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {

    const savedUser =
      localStorage.getItem(
        "puzzle-username"
      );

    if (savedUser) {

      setUsername(savedUser);

    }

    loadMessages();

    const channel =
      supabase
        .channel("live-chat")
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

      const { data } =
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

      {/* HEADER */}

      <div className="border-b border-white/10 p-5">

        <div className="max-w-5xl mx-auto">

          <p className="text-cyan-400 text-xs font-black tracking-[0.3em] uppercase">
            Realtime Marketplace Chat
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3">
            Live Messenger
          </h1>

        </div>

      </div>

      {/* CHAT */}

      <div className="flex-1 overflow-y-auto py-5">

        <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 space-y-4">

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
                  className={`w-fit px-4 py-3 rounded-2xl max-w-[320px] md:max-w-[520px] ${
                    own
                      ? "bg-cyan-400 text-black"
                      : "bg-zinc-900 border border-white/10"
                  }`}
                >

                  <p
                    className={`text-[10px] font-black break-all ${
                      own
                        ? "text-black/60"
                        : "text-cyan-400"
                    }`}
                  >

                    {message.username}

                  </p>

                  <p className="mt-2 text-sm break-words">
                    {message.text}
                  </p>

                  <p
                    className={`text-[10px] mt-2 ${
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

      <div className="border-t border-white/10 p-3">

        <div className="max-w-5xl mx-auto w-full px-2 md:px-6 flex gap-3">

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
            className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400"
          />

          <button
            onClick={sendMessage}
            className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-5 rounded-2xl"
          >
            Send
          </button>

        </div>

      </div>

    </main>

  );
}