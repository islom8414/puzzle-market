"use client";

export default function AddFundsPage() {

  async function topup(
    amount: number
  ) {

    try {

      const response =
        await fetch(
          "/api/create-checkout-session",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              amount,
            }),
          }
        );

      const data =
        await response.json();

      if (data.url) {

        window.location.href =
          data.url;

      }

    } catch (error) {

      console.log(error);

    }

  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="border border-cyan-500 rounded-3xl p-10 w-[900px]">

        <h1 className="text-7xl font-black mb-4">
          Add Funds
        </h1>

        <p className="text-gray-400 mb-10">
          Securely top up your Puzzle Market wallet.
        </p>

        <div className="grid grid-cols-3 gap-4">

          <button
            onClick={() => topup(10)}
            className="bg-zinc-900 hover:bg-cyan-500 transition rounded-3xl p-8 text-5xl font-black"
          >
            $10
          </button>

          <button
            onClick={() => topup(50)}
            className="bg-cyan-500 hover:bg-cyan-400 transition rounded-3xl p-8 text-5xl font-black text-black"
          >
            $50
          </button>

          <button
            onClick={() => topup(100)}
            className="bg-zinc-900 hover:bg-cyan-500 transition rounded-3xl p-8 text-5xl font-black"
          >
            $100
          </button>

        </div>

      </div>

    </main>
  );

}