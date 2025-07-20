export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9f5f2',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#333',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <img
        src="https://magiskacalestra.se/img/logo.png"
        alt="Calestra Logo"
        style={{ maxWidth: '180px' }}
      />
      <h1 style={{ fontSize: '2.5rem' }}>
        En magisk butik där känsla, själ och stil möts.
      </h1>
      <p style={{ fontSize: '1.2rem' }}>
        “Se in i dig. Med vad du har på dig. Var skulle det passa in – om det gör?”
      </p>
    </div>
  );
}
