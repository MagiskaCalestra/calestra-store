"use client";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-gradient-to-b from-white via-blue-50 to-white">
      <Image
        src="/images/logo.png"
        alt="Calestra Logo"
        width={160}
        height={160}
        className="mb-6 rounded-full"
      />
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-cyan-700">
        Välkommen till Calestra Store
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-xl mb-8">
        Utforska känslor, världar och magi – som du kan bära. Kollektioner för barn, unga och vuxna.
      </p>
      <Link
        href="/products"
        className="px-6 py-3 bg-cyan-700 hover:bg-cyan-800 text-white rounded-full text-lg font-semibold transition"
      >
        Bläddra i butiken
      </Link>
    </div>
  );
}
