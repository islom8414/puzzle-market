import Link from "next/link";
import type { ReactNode } from "react";

import {
  sweepstakesFirstDrawDate,
  sweepstakesMegaDrawDate,
  sweepstakesPrizePool,
  sweepstakesWaves,
} from "@/lib/sweepstakes";

const rulesVersion = "2026-07-23";

export default function SweepstakesRulesPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-16 pt-28 text-white sm:px-6 md:pt-32">
      <article className="mx-auto max-w-4xl">
        <header className="rounded-3xl border border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(34,211,238,0.06),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
            Official Rules
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Puzzle Market New Year Giveaway
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Rules version {rulesVersion}. These rules govern the New Year
            Giveaway and the related BMW X-7 Mega Draw.
          </p>
        </header>

        <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-300 sm:text-base">
          <RuleSection title="1. Organizer and legal availability">
            <p>
              The organizer is Puzzle Market. Questions may be sent to{" "}
              <a
                href="mailto:support@puzzle-market.com"
                className="font-bold text-cyan-300 hover:underline"
              >
                support@puzzle-market.com
              </a>
              . This promotion is offered only where Puzzle Market has
              confirmed that it is legally permitted. It is void where
              prohibited or where a purchase-linked chance promotion requires
              a registration, bond, free entry route, or approval that has not
              been completed.
            </p>
          </RuleSection>

          <RuleSection title="2. Eligibility">
            <p>
              Participants must be at least 18 years old, hold a valid Puzzle
              Market account, reside in an eligible jurisdiction, and comply
              with these rules. Puzzle Market employees, contractors directly
              involved in the draw, and their immediate household members are
              not eligible. Identity, age, residence, and account ownership
              may be verified before a prize is awarded.
            </p>
          </RuleSection>

          <RuleSection title="3. Entry Pass and recurring billing">
            <p>
              The New Year Entry Pass costs $7 and provides six months of
              marketplace, resale, and auction access. It is charged
              immediately, has no free trial, and renews automatically for $7
              every six months until cancelled. Cancellation stops future
              renewals and does not retroactively cancel an already completed
              purchase or an otherwise valid entry.
            </p>
          </RuleSection>

          <RuleSection title="4. Entry waves and base tickets">
            <ul className="space-y-2">
              {sweepstakesWaves.map((wave) => (
                <li key={wave.name}>
                  <strong className="text-white">{wave.name}:</strong>{" "}
                  qualifying entry by{" "}
                  {new Date(wave.endsAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}{" "}
                  receives {wave.tickets} base{" "}
                  {wave.tickets === 1 ? "ticket" : "tickets"}.
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Deadlines close at 23:59:59 UTC on the date shown. A successful
              payment and active Entry Pass are required before the applicable
              deadline.
            </p>
          </RuleSection>

          <RuleSection title="5. Additional tickets">
            <p>
              One additional ticket is awarded for each referred collector
              who activates an eligible paid subscription. Eligible puzzle
              purchases add one ticket for every cumulative $7 spent. Buying
              seven eligible $1 puzzle pieces adds one further ticket. Returns,
              reversals, chargebacks, fraudulent transactions, and cancelled
              payments do not count and may remove related tickets.
            </p>
          </RuleSection>

          <RuleSection title="6. Draw dates and prizes">
            <p>
              The New Year prize draw is scheduled for{" "}
              <strong className="text-white">{sweepstakesFirstDrawDate}</strong>
              . Its prize pool is:
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {sweepstakesPrizePool.map((prize) => (
                <li
                  key={prize.name}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <strong className="text-amber-200">{prize.quantity} x</strong>{" "}
                  {prize.name}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Participants who qualify during Wave 1 also receive automatic
              entry into the BMW X-7 Mega Draw scheduled for{" "}
              <strong className="text-white">{sweepstakesMegaDrawDate}</strong>
              . Exact model year, specification, color, delivery territory,
              and any cash alternative must be confirmed in the final
              jurisdiction-approved prize schedule before launch.
            </p>
          </RuleSection>

          <RuleSection title="7. Winner selection and odds">
            <p>
              Winners will be selected at random from verified eligible
              tickets using a documented draw procedure. Odds depend on the
              total number of eligible tickets received. A participant may win
              more than once only if the final draw procedure expressly allows
              it. Puzzle Market may require eligibility documents before
              confirming a winner.
            </p>
          </RuleSection>

          <RuleSection title="8. Notification and delivery">
            <p>
              Potential winners will be contacted through the verified email
              associated with their Puzzle Market account. They must respond
              within the period stated in the notification and complete
              verification. Failure to respond, ineligibility, or inability to
              accept a prize may result in selection of an alternate winner.
              Taxes, customs duties, registration, insurance, and other
              recipient costs are the winner&apos;s responsibility unless
              applicable law requires otherwise.
            </p>
          </RuleSection>

          <RuleSection title="9. Fair play, privacy, and publicity">
            <p>
              Multiple accounts, automated referrals, payment abuse, collusion,
              or manipulation may lead to disqualification. Personal data is
              processed under the{" "}
              <Link
                href="/privacy"
                className="font-bold text-cyan-300 hover:underline"
              >
                Privacy Policy
              </Link>
              . A winner&apos;s name, image, or testimonial will be used for
              publicity only with any consent required by applicable law.
            </p>
          </RuleSection>

          <RuleSection title="10. Changes, brands, and disputes">
            <p>
              Puzzle Market may make changes only when reasonably necessary
              for legality, security, fairness, or events outside its control,
              and will publish material updates. Apple, AirPods, iPhone, BMW,
              and their owners do not sponsor or administer this promotion.
              These rules do not waive rights that cannot legally be waived.
              Governing law and dispute provisions must be finalized for every
              approved participant jurisdiction before the promotion opens.
            </p>
          </RuleSection>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sweepstakes"
            className="rounded-2xl border border-white/15 px-5 py-3 text-center font-black hover:border-cyan-300 hover:text-cyan-200"
          >
            Back to Giveaway
          </Link>
          <Link
            href="/subscribe?plan=sweepstakes#sweepstakes-entry-pass"
            className="rounded-2xl bg-amber-300 px-5 py-3 text-center font-black text-black hover:bg-amber-200"
          >
            View $7 Entry Pass
          </Link>
        </div>
      </article>
    </main>
  );
}

function RuleSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <h2 className="text-xl font-black text-white sm:text-2xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
