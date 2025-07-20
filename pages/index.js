import Head from 'next/head';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#fdf9f6', minHeight: '100vh' }}>
      <Head>
        <title>Calestra Store</title>
        <meta name="description" content="En magisk butik där känsla, själ och stil möts." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <img
        src="/logo.png"
        alt="Calestra Logo"
        style={{ width: '150px', marginBottom: '2rem' }}
      />

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
        En magisk butik där känsla, själ<br />och stil möts.
      </h1>

      <p style={{ marginTop: '2rem', fontSize: '1.1rem', color: '#444' }}>
        “Se in i dig. Med vad du har på dig. <br />
        Var skulle det passa in – om det gör?”
      </p>
    </div>
  );
}
