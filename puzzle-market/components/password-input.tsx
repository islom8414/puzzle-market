"use client";

import { useState } from "react";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
};

export function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  className = "",
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [visible, setVisible] =
    useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        type={
          visible ? "text" : "password"
        }
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-11 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 pr-14 outline-none focus:border-cyan-400 sm:min-h-12 sm:px-5 sm:py-4"
      />

      <button
        type="button"
        onClick={() =>
          setVisible((current) => !current)
        }
        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/5 hover:text-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-400"
        aria-label={
          visible
            ? "Hide password"
            : "Show password"
        }
        title={
          visible
            ? "Hide password"
            : "Show password"
        }
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && (
            <path d="m4 4 16 16" />
          )}
        </svg>
      </button>
    </div>
  );
}
