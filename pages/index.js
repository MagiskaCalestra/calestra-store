// pages/index.js

import Head from 'next/head';
import { fetchData } from '../lib/api';
import useWindowSize from '../hooks/useWindowSize';
import { formatCurrency } from '../utils/format';
import { useEffect, useState } from 'react';

export default function Home() {
  const size = useWindowSize(); // Hook: visar fönsterstorlek
  const [price, setPrice] = useState(199);
  const [data, setData] = useState(null);

  // Test: hämta data från en publik API som exempel
  useEffect(() => {
    const url = 'https://jsonplaceholder.typicode.com/posts/1';
    fetchData(url)
      .then(setData)
      .catch(err => console.error('Fel vid hämtning:', err));
  }, []);

  return (
    <>
      <Head>
        <title>Calestra Store</title>
        <meta name="description" content="Testbutik för lansering" />
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Välkommen till Calestra Store 🌟</h1>

        <section style={{ marginTop: '2rem' }}>
          <h2>🪙 Prisformattering</h2>
          <p>Pris: <strong>{formatCurrency(price)}</strong></p>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>📏 Fönsterstorlek</h2>
          <p>Bredd: {size[0]} px | Höjd: {size[1]} px</p>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>🔍 Testhämtning från API</h2>
          {data ? (
            <>
              <p><strong>Titel:</strong> {data.title}</p>
              <p><strong>Text:</strong> {data.body}</p>
            </>
          ) : (
            <p>Laddar data...</p>
          )}
        </section>
      </main>
    </>
  );
}
