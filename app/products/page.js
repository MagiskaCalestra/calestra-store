"use client";
import Link from "next/link";

export default function ProductsPage() {
  const fakeProducts = [
    {
      id: 1,
      name: "Magisk T-shirt",
      description: "Känn magin i vardagen.",
      price: "299 kr",
      image: "/images/tshirt1.png",
    },
    {
      id: 2,
      name: "Harmoni Hoodie",
      description: "Värme för själen.",
      price: "499 kr",
      image: "/images/hoodie1.png",
    },
  ];

  return (
    <div className="px-6 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center text-cyan-700">
        Våra produkter
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {fakeProducts.map((product) => (
          <div key={product.id} className="border rounded-xl p-4 shadow-md bg-white">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-56 object-cover rounded-md mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{product.name}</h2>
            <p className="text-gray-600 mb-2">{product.description}</p>
            <p className="text-cyan-700 font-bold mb-4">{product.price}</p>
            <Link
              href="#"
              className="block text-center bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 transition"
            >
              Läs mer
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
                }
