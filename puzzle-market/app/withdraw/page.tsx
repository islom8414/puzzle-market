"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

const methods = [
  {
    id: "stripe_instant",
    label: "Instant payout",
    hint: "Fast payout if Stripe says the user's card or bank is eligible.",
  },
  {
    id: "stripe_standard",
    label: "Standard Payout",
    hint: "Stripe sends to the connected payout account on normal timing.",
  },
] as const;

const manualMethods = [
  {
    id: "visa_card",
    label: "Paysend card request",
    hint: "Manual review now. Paysend-ready for Uzcard, Humo, Visa and Mastercard payouts.",
    placeholder:
      "Recipient name + card type + last 4 digits + Telegram/email",
  },
  {
    id: "bank_transfer",
    label: "Bank transfer request",
    hint: "Admin reviews bank details and pays outside Stripe.",
    placeholder:
      "Bank name + account holder + contact",
  },
  {
    id: "usdt",
    label: "USDT request",
    hint: "Admin reviews wallet address and network before sending.",
    placeholder:
      "USDT address + network, for example TRC20",
  },
] as const;

const payoutCountries = [
  {
    code: "JP",
    label: "Japan",
  },
  {
    code: "UZ",
    label: "Uzbekistan",
  },
  {
    code: "US",
    label: "United States",
  },
  {
    code: "GB",
    label: "United Kingdom",
  },
  {
    code: "KZ",
    label: "Kazakhstan",
  },
  {
    code: "KG",
    label: "Kyrgyzstan",
  },
  {
    code: "TJ",
    label: "Tajikistan",
  },
  {
    code: "AE",
    label: "United Arab Emirates",
  },
  {
    code: "TR",
    label: "Turkey",
  },
  {
    code: "DE",
    label: "Germany",
  },
  {
    code: "FR",
    label: "France",
  },
  {
    code: "NL",
    label: "Netherlands",
  },
  {
    code: "SG",
    label: "Singapore",
  },
  {
    code: "KR",
    label: "South Korea",
  },
  {
    code: "CA",
    label: "Canada",
  },
  {
    code: "AU",
    label: "Australia",
  },
  {
    code: "OTHER",
    label: "Other country code",
  },
] as const;

type WithdrawalMethod =
  | (typeof methods)[number]["id"]
  | (typeof manualMethods)[number]["id"];

const unsupportedStripeCountries =
  new Set(["UZ"]);

type ConnectStatus = {
  connected: boolean;
  ready: boolean;
  country?: string;
  defaultCurrency?: string;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirementsDue?: string[];
  error?: string;
};

type WithdrawalRequest = {
  id: string;
  amount_cents: number;
  method: WithdrawalMethod;
  destination_label: string;
  status: string;
  provider_reference?: string | null;
  provider_error?: string | null;
  created_at: string;
};

type PaysendCardType =
  | "Uzcard"
  | "Humo"
  | "Visa"
  | "Mastercard";

function formatMoney(
  cents: number
) {
  return `$${(cents / 100).toFixed(2)}`;
}

function methodLabel(
  method: WithdrawalMethod
) {
  return (
    methods.find(
      (item) => item.id === method
    )?.label ||
    manualMethods.find(
      (item) => item.id === method
    )?.label ||
    method
  );
}

export default function WithdrawPage() {
  const [balance, setBalance] =
    useState(0);
  const [amount, setAmount] =
    useState("10");
  const [method, setMethod] =
    useState<WithdrawalMethod>(
      "stripe_instant"
    );
  const [
    destinationLabel,
    setDestinationLabel,
  ] = useState("");
  const [
    payoutCountry,
    setPayoutCountry,
  ] = useState("JP");
  const [
    paysendCardType,
    setPaysendCardType,
  ] =
    useState<PaysendCardType>(
      "Uzcard"
    );
  const [
    paysendRecipientName,
    setPaysendRecipientName,
  ] = useState("");
  const [
    paysendCardLast4,
    setPaysendCardLast4,
  ] = useState("");
  const [
    paysendContact,
    setPaysendContact,
  ] = useState("");
  const [
    customPayoutCountry,
    setCustomPayoutCountry,
  ] = useState("");
  const [connectStatus, setConnectStatus] =
    useState<ConnectStatus>({
      connected: false,
      ready: false,
    });
  const [requests, setRequests] =
    useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [connecting, setConnecting] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    loadWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getSessionOrLogin() {
    const {
      data: {
        session,
      },
    } =
      await supabase.auth.getSession();

    if (!session) {
      window.location.href =
        "/login";
      return null;
    }

    return session;
  }

  async function loadWithdrawals() {
    const session =
      await getSessionOrLogin();

    if (!session) {
      return;
    }

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      window.location.href =
        "/login";
      return;
    }

    const [
      accountResult,
      withdrawalResult,
      statusResponse,
    ] =
      await Promise.all([
        supabase
          .from("wallet_accounts")
          .select("balance_cents")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from(
            "wallet_withdrawal_requests"
          )
          .select(
            "id, amount_cents, method, destination_label, status, provider_reference, provider_error, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          }),
        apiFetch(
          "/api/stripe/connect-status",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        ),
      ]);

    setBalance(
      (accountResult.data
        ?.balance_cents || 0) / 100
    );

    setRequests(
      (withdrawalResult.data ||
        []) as WithdrawalRequest[]
    );

    if (statusResponse.ok) {
      setConnectStatus(
        await statusResponse.json()
      );
    }

    setLoading(false);
  }

  async function connectStripe() {
    setConnecting(true);

    const session =
      await getSessionOrLogin();

    if (!session) {
      return;
    }

    const selectedCountry =
      payoutCountry === "OTHER"
        ? customPayoutCountry
            .trim()
            .toUpperCase()
        : payoutCountry;

    if (
      !/^[A-Z]{2}$/.test(
        selectedCountry
      )
    ) {
      alert(
        "Enter a valid 2-letter country code, for example JP or UZ"
      );
      setConnecting(false);
      return;
    }

    const response =
      await apiFetch(
        "/api/stripe/connect-onboarding",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            country:
              selectedCountry,
          }),
        }
      );

    const data =
      await response.json();

    setConnecting(false);

    if (!response.ok) {
      alert(
        data.error ||
          "Stripe connection failed"
      );
      return;
    }

    window.location.href =
      data.url;
  }

  async function submitWithdrawal() {
    const value =
      Number(amount);

    if (
      !Number.isFinite(value) ||
      value < 1
    ) {
      alert(
        "Enter at least $1"
      );
      return;
    }

    if (value > balance) {
      alert(
        "Not enough wallet balance"
      );
      return;
    }

    const isStripeMethod =
      method ===
        "stripe_instant" ||
      method ===
        "stripe_standard";
    const isPaysendManualCard =
      stripeUnsupported &&
      method === "visa_card";
    const paysendDestinationLabel =
      [
        `Paysend manual card payout`,
        `Country: ${selectedCountry}`,
        `Card: ${paysendCardType}`,
        `Recipient: ${paysendRecipientName.trim() || "not provided"}`,
        `Last4: ${paysendCardLast4.trim() || "not provided"}`,
        `Contact: ${paysendContact.trim() || "not provided"}`,
      ].join(" | ");

    if (
      !isStripeMethod &&
      !isPaysendManualCard &&
      destinationLabel.trim().length < 4
    ) {
      alert(
        "Enter payout destination details"
      );
      return;
    }

    if (isPaysendManualCard) {
      if (
        paysendRecipientName.trim()
          .length < 2 ||
        paysendContact.trim().length <
          4 ||
        !/^\d{4}$/.test(
          paysendCardLast4.trim()
        )
      ) {
        alert(
          "Enter recipient name, card last 4 digits, and Telegram/email for manual payout confirmation"
        );
        return;
      }
    }

    if (
      isStripeMethod &&
      !connectStatus.ready
    ) {
      alert(
        "Connect and finish Stripe payout setup first"
      );
      return;
    }

    setSubmitting(true);

    const session =
      await getSessionOrLogin();

    if (!session) {
      return;
    }

    const response =
      await apiFetch(
        "/api/request-withdrawal",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: value,
            method,
            destinationLabel:
              isPaysendManualCard
                ? paysendDestinationLabel
                : destinationLabel,
          }),
        }
      );

    const data =
      await response.json();

    setSubmitting(false);

    if (!response.ok) {
      alert(
        data.error ||
          "Withdrawal failed"
      );
      await loadWithdrawals();
      return;
    }

    alert(
      method ===
        "stripe_instant" ||
        method ===
          "stripe_standard"
        ? "Payout sent through Stripe"
        : "Withdrawal request created. Admin will review it."
    );
    await loadWithdrawals();
  }

  const readyLabel =
    connectStatus.ready
      ? "Ready for automatic payouts"
      : connectStatus.connected
        ? "Finish payout setup"
        : "Stripe payout account required";
  const connectedCountry =
    connectStatus.country;
  const selectedCountry =
    connectedCountry ||
    payoutCountry;
  const stripeUnsupported =
    unsupportedStripeCountries.has(
      selectedCountry
    );
  const activeMethods =
    stripeUnsupported
      ? manualMethods
      : methods;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:py-10">
      <div
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]"
        style={{
          width: "min(100%, 1120px)",
          margin: "0 auto",
        }}
      >
        <section className="rounded-[22px] border border-white/10 bg-zinc-950/80 p-5 shadow-2xl shadow-cyan-950/10 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
                Wallet Payout
              </p>

              <h1 className="mt-3 text-[2.6rem] font-black leading-[0.96] md:text-[3.5rem]">
                Withdraw Funds
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 md:text-base">
                Stripe automatic payouts stay available for supported countries. Uzbekistan and unsupported countries can create a manual card payout request while Paysend approval is pending.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-5 py-4 md:min-w-44">
              <p className="text-sm text-zinc-400">
                Available Balance
              </p>
              <h2 className="mt-1 text-4xl font-black leading-none text-cyan-300">
                ${balance.toFixed(2)}
              </h2>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/60 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  Stripe Connect
                </p>
                <h2 className="mt-2 text-[1.65rem] font-black leading-tight md:text-3xl">
                  {stripeUnsupported
                    ? "Manual payout request"
                    : readyLabel}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                  {stripeUnsupported
                    ? "Stripe does not currently support this payout country. Create a Paysend-ready manual payout request. Admin will process it outside Stripe until Paysend API approval is complete."
                    : "Add your Visa debit card or bank account inside Stripe. Puzzle Market never stores card numbers."}
                </p>

                <label className="mt-4 block max-w-xs">
                  <span className="text-sm font-bold text-zinc-400">
                    Payout country
                  </span>
                  <select
                    value={
                      connectedCountry ||
                      payoutCountry
                    }
                    onChange={(event) =>
                      setPayoutCountry(
                        event.target.value
                      )
                    }
                    disabled={
                      connectStatus.connected
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-base font-black text-white outline-none focus:border-cyan-400 disabled:opacity-60"
                  >
                    {payoutCountries.map(
                      (country) => (
                        <option
                          key={
                            country.code
                          }
                          value={
                            country.code
                          }
                        >
                          {country.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {!connectStatus.connected &&
                  payoutCountry ===
                    "OTHER" && (
                    <label className="mt-3 block max-w-xs">
                      <span className="text-sm font-bold text-zinc-400">
                        ISO country code
                      </span>
                      <input
                        value={
                          customPayoutCountry
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomPayoutCountry(
                            event.target.value
                              .toUpperCase()
                              .slice(
                                0,
                                2
                              )
                          )
                        }
                        placeholder="UZ"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-base font-black text-white outline-none focus:border-cyan-400"
                      />
                    </label>
                  )}

                {stripeUnsupported && (
                  <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                    Uzbekistan is not supported by Stripe Connect right now. Use manual Paysend-ready card payout for Uzcard, Humo, Visa or Mastercard.
                  </p>
                )}

                {connectedCountry &&
                  !stripeUnsupported && (
                  <p className="mt-3 text-sm text-zinc-500">
                    Connected as{" "}
                    <span className="font-bold text-zinc-300">
                      {connectedCountry}
                    </span>
                    {connectStatus.defaultCurrency
                      ? ` / ${connectStatus.defaultCurrency.toUpperCase()}`
                      : ""}
                    . Stripe account country cannot be changed after setup.
                  </p>
                )}
              </div>

              {!stripeUnsupported && (
                <button
                  onClick={
                    connectStripe
                  }
                  disabled={connecting}
                  className="inline-flex min-w-40 shrink-0 items-center justify-center whitespace-nowrap rounded-2xl bg-white px-5 py-3 font-black text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {connecting
                    ? "Opening..."
                    : connectStatus.connected
                      ? "Update Stripe"
                      : "Connect Stripe"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {activeMethods.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  setMethod(item.id)
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  method === item.id
                    ? "border-cyan-400 bg-cyan-400 text-black shadow-lg shadow-cyan-400/10"
                    : "border-white/10 bg-white/[0.04] hover:border-cyan-400"
                }`}
              >
                <span className="block text-lg font-black">
                  {item.label}
                </span>
                <span
                  className={`mt-2 block text-sm leading-5 ${
                    method === item.id
                      ? "text-black/70"
                      : "text-zinc-500"
                  }`}
                >
                  {item.hint}
                </span>
              </button>
            ))}
          </div>

          {stripeUnsupported && (
            <div className="mt-5 rounded-[22px] border border-white/10 bg-black/50 p-4 md:p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Paysend-ready manual payout
              </p>

              {method ===
              "visa_card" ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-zinc-300">
                    Paysend Enterprise is pending approval. We collect only safe confirmation details and admin completes the payout manually. Do not enter a full card number.
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                        Card rail
                      </span>
                      <select
                        value={
                          paysendCardType
                        }
                        onChange={(
                          event
                        ) =>
                          setPaysendCardType(
                            event.target
                              .value as PaysendCardType
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-base font-black text-white outline-none transition focus:border-cyan-400"
                      >
                        <option value="Uzcard">
                          Uzcard
                        </option>
                        <option value="Humo">
                          Humo
                        </option>
                        <option value="Visa">
                          Visa
                        </option>
                        <option value="Mastercard">
                          Mastercard
                        </option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                        Card last 4 digits
                      </span>
                      <input
                        value={
                          paysendCardLast4
                        }
                        onChange={(
                          event
                        ) =>
                          setPaysendCardLast4(
                            event.target
                              .value.replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                4
                              )
                          )
                        }
                        inputMode="numeric"
                        placeholder="1234"
                        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-base font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                        Recipient full name
                      </span>
                      <input
                        value={
                          paysendRecipientName
                        }
                        onChange={(
                          event
                        ) =>
                          setPaysendRecipientName(
                            event.target
                              .value
                          )
                        }
                        placeholder="Name as shown on card"
                        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-base font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                        Telegram or email
                      </span>
                      <input
                        value={
                          paysendContact
                        }
                        onChange={(
                          event
                        ) =>
                          setPaysendContact(
                            event.target
                              .value
                          )
                        }
                        placeholder="@username or email"
                        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-base font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
                      />
                    </label>
                  </div>

                </div>
              ) : (
                <label className="mt-3 block">
                  <span className="text-sm font-bold text-zinc-400">
                    Payout details
                  </span>
                  <input
                    value={
                      destinationLabel
                    }
                    onChange={(
                      event
                    ) =>
                      setDestinationLabel(
                        event.target.value
                      )
                    }
                    placeholder={
                      manualMethods.find(
                        (item) =>
                          item.id ===
                          method
                      )?.placeholder ||
                      "Payout destination"
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-base font-bold outline-none focus:border-cyan-400"
                  />
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Do not enter a full card number here. Use contact details so admin can confirm the secure payout method.
                  </p>
                </label>
              )}
            </div>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-[160px_1fr] md:items-end">
            <label className="block">
              <span className="text-sm font-bold text-zinc-400">
                Amount
              </span>
              <input
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                inputMode="decimal"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-xl font-black outline-none focus:border-cyan-400"
              />
            </label>

            <button
              onClick={submitWithdrawal}
              disabled={
                submitting ||
                loading ||
                (!stripeUnsupported &&
                  !connectStatus.ready)
              }
              className="w-full rounded-2xl bg-cyan-400 py-4 font-black text-black transition hover:bg-cyan-300 disabled:bg-white/10 disabled:text-zinc-500"
            >
              {submitting
                ? "Sending Payout..."
                : stripeUnsupported
                  ? "Create Withdrawal Request"
                  : "Send Automatic Payout"}
            </button>
          </div>
        </section>

        <section className="min-h-[360px] rounded-[22px] border border-white/10 bg-zinc-950/80 p-5 md:p-6">
          <h2 className="text-[1.85rem] font-black leading-tight md:text-[2.35rem]">
            Withdrawal History
          </h2>

          <div className="mt-6 space-y-3">
            {requests.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-400">
                No withdrawal requests yet.
              </div>
            )}

            {requests.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black">
                      {methodLabel(
                        item.method
                      )}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {
                        item.destination_label
                      }
                    </p>
                    {item.provider_error && (
                      <p className="mt-2 text-sm text-red-300">
                        {item.provider_error}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-black text-cyan-300">
                      {formatMoney(
                        item.amount_cents
                      )}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase text-zinc-500">
                      {item.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
