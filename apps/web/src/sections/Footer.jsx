import React from "react";

export default function Footer(){
  return (
    <footer className="footer">
      <div className="container stack" style={{gap:8}}>
        <div>“Ljuset du fann här… följ det, var du än går.”</div>
        <div className="row" style={{justifyContent:'center'}}>
          <a className="btn" href="#">Behöver du hjälp?</a>
          <a className="btn" href="#">Planera ditt besök</a>
        </div>
        <div style={{opacity:.75, marginTop:12}}>© 2025 Calestra World</div>
      </div>
    </footer>
  );
}
