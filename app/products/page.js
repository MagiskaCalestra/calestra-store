export default function ProductsPage() {
  const products = [
    {
      id: 1,
      name: "Lyra Tröja – Marinblå",
      price: "299 kr",
      image: "https://via.placeholder.com/300x300?text=Lyra+Tröja",
    },
    {
      id: 2,
      name: "C-Wish Armband™",
      price: "149 kr",
      image: "https://via.placeholder.com/300x300?text=C-Wish",
    },
    {
      id: 3,
      name: "Magisk Tote Bag",
      price: "179 kr",
      image: "https://via.placeholder.com/300x300?text=Bag",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f0f4ff] to-[#e6ecff] text-gray-800">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#3b4890]">Magiska Calestra</h1>
          <nav className="space-x-4">
            <a href="/" className="text-sm font-medium hover:underline">Hem</a>
            <a href="/products" className="text-sm font-medium hover:underline text-[#3b4890]">Produkter</a>
            <a href="/kontakt" className="text-sm font-medium hover:underline">Kontakt</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Produkter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 p-4 flex flex-col items-center"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-auto rounded-xl mb-4"
              />
              <h3 className="text-lg font-semibold mb-2 text-center">{product.name}</h3>
              <p className="text-[#3b4890] font-bold mb-4">{product.price}</p>
              <button className="bg-[#3b4890] text-white py-2 px-4 rounded-full hover:bg-[#2d396d] transition">Lägg i korgen</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
