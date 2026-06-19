"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

type SupportMessage = {
  id: string;
  role: "user" | "admin";
  name: string;
  body: string;
  created_at: string;
};

type SupportThread = {
  id: string;
  subject: string;
  status: string;
  ownerName: string;
  updated_at: string;
  messages: SupportMessage[];
};

export default function SupportPage() {
  const [threads, setThreads] =
    useState<SupportThread[]>([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [subject, setSubject] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const selectedThread =
    useMemo(
      () => {
        if (!selectedId) {
          return null;
        }

        return (
          threads.find(
            (thread) =>
              thread.id === selectedId
          ) || null
        );
      },
      [threads, selectedId]
    );

  useEffect(() => {
    loadSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getToken() {
    const {
      data: {
        session,
      },
    } =
      await supabase.auth
        .getSession();

    if (!session) {
      alert("Login required");
      location.href = "/login";
      return null;
    }

    return session.access_token;
  }

  async function loadSupport() {
    const token =
      await getToken();

    if (!token) {
      return;
    }

    const response =
      await apiFetch(
        "/api/support-private",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        data.error ||
        "Support load failed"
      );
      setLoading(false);
      return;
    }

    setIsAdmin(
      Boolean(data.isAdmin)
    );

    setThreads(
      data.threads || []
    );

    setSelectedId(
      data.threads?.[0]?.id || ""
    );

    setLoading(false);
  }

  async function sendSupport() {
    const text =
      message.trim();
    const safeSubject =
      subject.trim();

    if (
      isAdmin &&
      !selectedThread
    ) {
      alert("Select a ticket first");
      return;
    }

    if (text.length < 2) {
      alert("Write a message first");
      return;
    }

    if (
      !selectedThread &&
      safeSubject.length < 3
    ) {
      alert("Write a subject first");
      return;
    }

    const token =
      await getToken();

    if (!token) {
      return;
    }

    const response =
      await apiFetch(
        "/api/support-private",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            threadId:
              selectedThread?.id || "",
            subject:
              safeSubject,
            message: text,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        data.error ||
        "Support send failed"
      );
      return;
    }

    setMessage("");
    setSubject("");
    loadSupport();
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Private Support
        </p>

        <h1 className="mt-5 text-4xl md:text-6xl font-black leading-none">
          {isAdmin
            ? "Support Inbox"
            : "My Support Chat"}
        </h1>

        <p className="mt-5 max-w-3xl text-zinc-400 text-lg">
          {isAdmin
            ? "Only you can see all user tickets here. Replies go back to the exact user thread."
            : "Messages here are private between you and Puzzle Market support."}
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <aside className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">
                Tickets
              </h2>

              {!isAdmin && (
                <button
                  onClick={() => {
                    setSelectedId("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-black"
                >
                  New
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {loading && (
                <p className="text-zinc-500">
                  Loading...
                </p>
              )}

              {!loading &&
                threads.length === 0 && (
                  <p className="rounded-2xl bg-black p-4 text-zinc-500">
                    No tickets yet.
                  </p>
                )}

              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() =>
                    setSelectedId(
                      thread.id
                    )
                  }
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedThread?.id ===
                    thread.id
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-white/10 bg-black hover:border-cyan-400/50"
                  }`}
                >
                  <p className="font-black">
                    {thread.subject}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {isAdmin
                      ? thread.ownerName
                      : thread.status}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-6">
            {!selectedThread &&
              !isAdmin && (
                <input
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value
                    )
                  }
                  placeholder="Subject"
                  className="mb-4 w-full rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400"
                />
              )}

            <div className="min-h-[360px] max-h-[560px] overflow-y-auto rounded-2xl border border-white/10 bg-black p-4">
              {selectedThread ? (
                <div className="space-y-3">
                  {selectedThread.messages.map(
                    (item) => (
                      <div
                        key={item.id}
                        className={`max-w-[85%] rounded-2xl p-4 ${
                          item.role ===
                          "admin"
                            ? "ml-auto bg-cyan-400 text-black"
                            : "bg-white/5 text-white"
                        }`}
                      >
                        <p className="text-xs font-black opacity-70">
                          {item.name}
                        </p>

                        <p className="mt-1">
                          {item.body}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-center text-zinc-500">
                  Start a private support ticket.
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <input
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendSupport();
                  }
                }}
                placeholder={
                  isAdmin &&
                  !selectedThread
                    ? "Select a ticket first..."
                    : isAdmin
                    ? "Reply to this user..."
                    : "Write to support..."
                }
                disabled={
                  isAdmin &&
                  !selectedThread
                }
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400 disabled:opacity-40"
              />

              <button
                onClick={sendSupport}
                disabled={
                  isAdmin &&
                  !selectedThread
                }
                className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
