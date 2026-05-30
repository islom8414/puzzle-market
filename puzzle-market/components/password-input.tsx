"use client";

import { useState } from "react";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  className = "",
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 pr-14 outline-none focus:border-cyan-400"
      />

      <button
        type="button"
        onClick={() =>
          setVisible((current) => !current)
        }
        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-cyan-400"
        aria-label={
          visible
            ? "Hide password"
            : "Show password"
        }
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
