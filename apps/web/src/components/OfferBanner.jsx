import React, { useEffect, useState } from "react";
const slides = [
  { id: "spring", title: "Vårglöd: upp till 20% på utvalda hotell", cta: "Visa erbjudande", to: "/deals/spring" },
  { id: "wish",  title: "C-WishÂ® Moments: boka ett möte med en karaktär", cta: "Utforska", to: "/experiences/characters" },
  { id: "dine",  title: "Matplan Stories â€“ för dig som vill sitta ner och minnas", cta: "Jämför planer", to: "/dining/plans" },
];

export default function OfferBanner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);

  const s = slides[i];
  return (
    <div style={{
      width:"100%", background:"linear-gradient(90deg,#081018,#152235)", color:"#fff",
      padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,.08)"
    }}>
      <div className="container" style={{display:"flex",alignItems:"center",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
        <span style={{opacity:.9}}>{s.title}</span>
        <a href={s.to} className="btn btn--ghost">{s.cta}</a>
        <div style={{display:"flex",gap:6,marginLeft:12}}>
          {slides.map((_, idx) => (
            <span key={idx} style={{
              width:6,height:6,borderRadius:8, background: idx===i ? "#ffd66b":"#41506b"
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}
