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
        src="https://magiskacalestra.se/logo.png" 
        alt="Calestra Logo" 
        style={{ maxWidth: '180px', marginBottom: '2rem' }}
      />
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌟 Välkommen till Calestra Store 🌟</h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '600px' }}>
        En magisk butik där känsla, stil och drömmar möts. Den officiella lanseringen är på väg!
      </p>
      <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
        “Se in i dig. Med vad du har på dig. Var skulle det passa in – om det gör?”
      </p>
    </div>
  );
}
