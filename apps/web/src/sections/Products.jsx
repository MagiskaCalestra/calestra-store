import React from "react";
import first from "../assets/first-glimpse.jpg";
import into from "../assets/into-the-light.jpg";
import gate from "../assets/the-gate-of-light.jpg";

const items = [
  {id:1, title:"Calestra Mug", price:"149 SEK", img:first, alt:"Calestra-mugg med stjärnsymbol"},
  {id:2, title:"Glow Hoodie", price:"699 SEK", img:into, alt:"Mörk hoodie som glöder svagt i stjärnljus"},
  {id:3, title:"Lyra Figure", price:"349 SEK", img:gate, alt:"Lyra figur framför porten av ljus"},
];

export default function Products(){
  return (
    <section className="products">
      <div className="container">
        <h3 style={{color:'var(--brand)', margin:'0 0 14px'}}>Ta med känslan hem</h3>
        <p style={{color:'var(--muted)', margin:'0 0 20px'}}>Vissa minnen kan du bära. Andra håller dig varm.</p>

        <div className="grid">
          {items.map(it=>(
            <article key={it.id} className="card">
              <div className="media">
                <img src={it.img} alt={it.alt}/>
              </div>
              <div className="body">
                <div className="row" style={{justifyContent:'space-between'}}>
                  <div className="title">{it.title}</div>
                  <div className="price">{it.price}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="row" style={{justifyContent:'center', marginTop:18}}>
          <a className="btn" href="#">Till Store Office â†—</a>
          <a className="btn" href="#">Konserter & merch</a>
        </div>
      </div>
    </section>
  );
}
