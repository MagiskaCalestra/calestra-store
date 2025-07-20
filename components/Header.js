"use client";
import Link from "next/link";
import { categories } from "@/lib/constants";

export default function Header() {
  return (
    <header className="text-center p-4">
      <h1 className="text-3xl font-bold mb-2">🌟 Välkommen till Calestra Store</h1>
      <p className="text-gray-600 text-lg mb-6">
        Kläder med själ. Bär din zon. Utforska din stil.
      </p>

      <div className="flex flex-col gap-4 items-center">
        {categories.map((cat) => (
          <Link
            key={cat.path}
            href={cat.path}
            className="bg-white border rounded-xl px-6 py-3 shadow hover:scale-105 transition-all"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </header>
  );
}// Headerkomponent
