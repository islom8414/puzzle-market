import Link from "next/link";

import { readOwnershipCode } from "@/lib/ownership-certificate";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function OwnershipPage({
  params,
}: PageProps) {
  const { code } = await params;
  const payload = readOwnershipCode(
    decodeURIComponent(code)
  );

  if (!payload) {
    return (
      <CertificateShell
        status="Invalid certificate"
        tone="red"
        message="This ownership code is not signed by Puzzle Market or was copied incorrectly."
      />
    );
  }

  const admin = createSupabaseAdmin();

  const [
    tradeResult,
    ownershipResult,
  ] = await Promise.all([
    admin
      .from("piece_trades")
      .select(
        "id, price_cents, created_at, buyer_user_id, seller_user_id, puzzle_pieces(piece_index, puzzle_catalog(slug, title))"
      )
      .eq("id", payload.tradeId)
      .eq("piece_id", payload.pieceId)
      .eq("buyer_user_id", payload.ownerId)
      .maybeSingle(),
    admin
      .from("piece_ownership")
      .select("owner_user_id")
      .eq("piece_id", payload.pieceId)
      .maybeSingle(),
  ]);

  const trade = tradeResult.data as
    | {
        id: string;
        price_cents: number;
        created_at: string;
        puzzle_pieces?: {
          piece_index: number;
          puzzle_catalog?: {
            slug: string;
            title: string;
          };
        };
      }
    | null;

  if (!trade) {
    return (
      <CertificateShell
        status="Certificate record not found"
        tone="red"
        message="The trade connected to this certificate could not be found."
      />
    );
  }

  const isCurrentOwner =
    ownershipResult.data
      ?.owner_user_id ===
    payload.ownerId;
  const piece = trade.puzzle_pieces;
  const catalog =
    piece?.puzzle_catalog;

  return (
    <CertificateShell
      status={
        isCurrentOwner
          ? "Current ownership verified"
          : "No longer valid for current ownership"
      }
      tone={
        isCurrentOwner
          ? "cyan"
          : "amber"
      }
      message={
        isCurrentOwner
          ? "This certificate matches the current Puzzle Market owner."
          : "This certificate is authentic as purchase history, but it is no longer valid as current ownership because this piece belongs to a newer owner."
      }
    >
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
          Puzzle Piece
        </p>
        <h2 className="mt-2 text-3xl font-black">
          {catalog?.title ||
            "Puzzle piece"}
        </h2>
        <p className="mt-2 text-zinc-400">
          Piece #
          {(piece?.piece_index ?? 0) +
            1}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoBox
          label="Trade ID"
          value={payload.tradeId}
        />
        <InfoBox
          label="Piece ID"
          value={payload.pieceId}
        />
        <InfoBox
          label="Purchase price"
          value={`$${(
            trade.price_cents / 100
          ).toFixed(2)}`}
        />
        <InfoBox
          label="Purchased"
          value={new Date(
            trade.created_at
          ).toLocaleString()}
        />
      </div>

      {catalog?.slug && (
        <Link
          href={`/puzzle/${encodeURIComponent(catalog.slug)}`}
          className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-black text-black"
        >
          Open puzzle
        </Link>
      )}
    </CertificateShell>
  );
}

function CertificateShell({
  status,
  tone,
  message,
  children,
}: {
  status: string;
  tone: "cyan" | "amber" | "red";
  message: string;
  children?: React.ReactNode;
}) {
  const color =
    tone === "cyan"
      ? "text-cyan-300 border-cyan-400/30 bg-cyan-400/10"
      : tone === "amber"
        ? "text-amber-300 border-amber-400/30 bg-amber-400/10"
        : "text-red-300 border-red-400/30 bg-red-400/10";

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-zinc-950 p-6 shadow-2xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
          Puzzle Market Certificate
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
          Ownership Verification
        </h1>
        <div className={`mt-6 rounded-2xl border p-5 ${color}`}>
          <h2 className="text-2xl font-black">
            {status}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/75">
            {message}
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 break-all font-bold text-zinc-200">
        {value}
      </p>
    </div>
  );
}
