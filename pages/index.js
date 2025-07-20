import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Calestra Store</title>
        <meta name="description" content="En magisk butik där känsla, själ och stil möts." />
      </Head>
      <main style={styles.main}>
        <img src="/logo.png" alt="Calestra Logotyp" style={styles.logo} />
        <h1 style={styles.title}>En magisk butik<br />där känsla, själ<br />och stil möts.</h1>
        <p style={styles.slogan}>
          “Se in i dig. Med vad du har på dig. <br />
          Var skulle det passa in – om det gör?”
        </p>
      </main>
    </>
  )
}

const styles = {
  main: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #fffbe6, #f6eaff)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
    fontFamily: "'Georgia', serif",
  },
  logo: {
    maxWidth: '200px',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '1rem',
  },
  slogan: {
    fontSize: '1.1rem',
    color: '#444',
    maxWidth: '90%',
    lineHeight: '1.6',
  },
}
