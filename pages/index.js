// pages/index.js

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-pink-100 text-center px-4">
      <header className="pt-10">
        <img src="/Logo.png" alt="Calestra Logo" className="mx-auto w-32 h-auto mb-6" />
        <h1 className="text-4xl font-bold mb-2">Calestra</h1>
        <p className="text-xl font-medium text-gray-700">En magisk butik där känsla, själ och stil möts.</p>
      </header>

      <main className="mt-10">
        <p className="text-md max-w-xl mx-auto text-gray-600 italic mb-8">
          “Se in i dig. Med vad du har på dig. Var skulle det passa in – om det gör?”
        </p>

        <a
          href="/products"
          className="bg-black text-white px-6 py-3 rounded-full shadow hover:opacity-90 transition"
        >
          Upptäck kollektionen
        </a>
      </main>

      <footer className="mt-20 mb-10 text-sm text-gray-500">
        © {new Date().getFullYear()} Calestra World. Alla rättigheter reserverade.
      </footer>
    </div>
  );
            }
