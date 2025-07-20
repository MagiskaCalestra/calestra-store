"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/constants";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold text-gray-800 hover:text-black transition">
        Calestra Store
      </Link>
      <nav className="flex gap-6">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium ${
              pathname === item.href
                ? "text-blue-600 underline"
                : "text-gray-700 hover:text-black"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
