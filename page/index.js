
import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Calestra Store</title>
        <meta name="description" content="Magiska Calestra – En butik med känsla" />
      </Head>
      <main style={{ textAlign: 'center', padding: '5rem' }}>
        <img src="/Logo.png" alt="Calestra Logo" style={{ maxWidth: '300px' }} />
        <h1>Välkommen till Calestra Store</h1>
        <p>Den officiella butiken för Magiska Calestra</p>
      </main>
    </div>
  );
}
