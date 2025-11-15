import React from "react";

export default function Footer(){
  return (
    <footer className="footer">
      <div className="container stack" style={{gap:8}}>
        <div>â€œLjuset du fann härâ€¦ följ det, var du än går.â€</div>
        <div className="row" style={{justifyContent:'center'}}>
          <a className="btn" href="#">Behöver du hjälp?</a>
          <a className="btn" href="#">Planera ditt besök</a>
        </div>
        <div style={{opacity:.75, marginTop:12}}>Â© 2025 Calestra World</div>
      </div>
    </footer>
  );
}
