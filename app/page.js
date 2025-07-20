export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>🌟 Välkommen till Calestra Store</h1>
        <p style={{ fontSize: '1.2rem', color: '#555' }}>
          Kläder med själ. Bär din zon. Utforska din stil.
        </p>
      </section>

      {/* Zoner */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        {['Magiska Barn', 'Trend & Stil', 'Calestra Moments', 'Atelier DIY', 'Travel Light', 'Crown of Calestra'].map((zone) => (
          <div key={zone} style={{
            border: '1px solid #ccc',
            borderRadius: '12px',
            padding: '1rem 2rem',
            minWidth: '150px',
            backgroundColor: '#f9f9f9',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            {zone}
          </div>
        ))}
      </section>

      {/* Produktpreview */}
      <section style={{ marginTop: '4rem' }}>
        <h2 style={{ textAlign: 'center' }}>✨ Utvalda produkter</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
          {[1, 2, 3].map((item) => (
            <div key={item} style={{
              width: '200px',
              padding: '1rem',
              border: '1px solid #eee',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <img src="/images/placeholder.png" alt="Produkt" style={{ width: '100%', borderRadius: '8px' }} />
              <p style={{ marginTop: '0.5rem' }}>Produktnamn {item}</p>
              <p style={{ color: '#999' }}>299 kr</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '5rem', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
        © {new Date().getFullYear()} Calestra Store – Magiska Calestra Holding AB
      </footer>
    </main>
  );
}
