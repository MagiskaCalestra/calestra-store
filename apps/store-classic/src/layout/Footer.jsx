// apps/store-classic/src/layout/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ marginTop: 30, padding: "20px 20px 40px", background: "#0f172a", color: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        <div>
          <h4>Juridik</h4>
          <ul style={ul}>
            <li><Link style={a} to="/terms">Terms</Link></li>
            <li><Link style={a} to="/privacy">Privacy</Link></li>
            <li><Link style={a} to="/cookies">Cookies</Link></li>
          </ul>
        </div>
        <div>
          <h4>Kontakt</h4>
          <ul style={ul}>
            <li><a style={a} href="mailto:hello@calestra.world">hello@calestra.world</a></li>
            <li><a style={a} href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a></li>
            <li><a style={a} href="https://www.tiktok.com/" target="_blank" rel="noreferrer">TikTok</a></li>
          </ul>
        </div>
        <div>
          <h4>Om</h4>
          <p style={{ opacity: .85 }}>Calestra Holding &amp; Resort â€” Â© {new Date().getFullYear()} â€¢ Org.nr (plats) â€“ placeholder</p>
        </div>
      </div>
    </footer>
  );
}
const ul = { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 };
const a = { color: "white", textDecoration: "none", opacity: .9 };
