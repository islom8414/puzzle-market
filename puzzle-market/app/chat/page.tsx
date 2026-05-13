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

      {/* TOP */}

      <div className="border-b border-white/10 p-6 shrink-0">

        <p className="text-cyan-400 uppercase text-xs font-black tracking-[0.3em]">
          REALTIME MARKETPLACE CHAT
        </p>

        <h1 className="text-5xl font-black mt-4">
          Live Messenger
        </h1>

        <p className="text-zinc-500 mt-4">
          Talk with collectors and traders.
        </p>

      </div>

      {/* CHAT */}

      <div className="flex-1 overflow-y-auto px-4 py-6">

        <div className="max-w-4xl mx-auto space-y-5">

          {messages.length === 0 && (

            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center">

              <h2 className="text-3xl font-black">
                No Messages Yet
              </h2>

            </div>

          )}

          {messages.map((message, index) => (

            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-3xl p-5"
            >

              <p className="text-cyan-400 font-black text-sm">
                {message.username}
              </p>

              <p className="text-white text-lg mt-3 break-words">
                {message.text}
              </p>

              <p className="text-zinc-500 text-xs mt-3">
                {message.created_at
                  ? new Date(
                      message.created_at
                    ).toLocaleTimeString()
                  : "LIVE"}
              </p>

            </div>

          ))}

          <div ref={bottomRef} />

        </div>

      </div>

      {/* INPUT */}

      <div className="border-t border-white/10 p-4 shrink-0">

        <div className="max-w-4xl mx-auto flex gap-4">

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
            className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 outline-none focus:border-cyan-400"
          />

          <button
            onClick={sendMessage}
            className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-8 rounded-3xl transition"
          >
            Send
          </button>

        </div>

      </div>

    </main>

  );
}