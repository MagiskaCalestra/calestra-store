import Head from "next/head";
import products from "../data/products";
import ProductCard from "../components/ProductCard";

export default function Home() {
  return (
    <>
      <Head>
        <title>Calestra Store</title>
        <meta name="description" content="Välkommen till Magiska Calestra Store!" />
        <link rel="icon" href="/images/logo.png" />
      </Head>

      <main style={{ padding: "2rem" }}>
        <h1 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "2rem" }}>
          Välkommen till Calestra Store
        </h1>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </>
  );
}// Startsida med produktlista
