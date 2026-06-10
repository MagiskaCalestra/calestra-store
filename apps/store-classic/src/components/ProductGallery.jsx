import { useEffect, useMemo, useState } from "react";

export default function ProductGallery({ product }){
  const thumbs = useMemo(()=>product?.thumbnails||[],[product]);
  const [active, setActive] = useState(product?.cover);

  useEffect(()=>{ setActive(product?.cover); },[product]);

  // pseudo-360: om finns filer som slutar med -360-x.jpg i thumbnails -> loop-knapp
  const has360 = thumbs.some(src=>src.includes("-360-"));

  return (
    <div>
      <img src={active||product.cover} alt={product.name} />
      {!!thumbs.length && (
        <div className="thumbbar" role="listbox" aria-label="Bilder">
          {thumbs.map((src)=>(
            <button key={src} className={`thumb ${src===active?"active":""}`} onClick={()=>setActive(src)} aria-label="Välj bild">
              <img src={src} alt="" />
            </button>
          ))}
          {has360 && (
            <button className="btn ghost" style={{marginLeft:8}} onClick={()=>{
              let i=0; const seq = thumbs.filter(s=>s.includes("-360-"));
              const id = setInterval(()=>{
                setActive(seq[i%seq.length]); i++;
              },120);
              setTimeout(()=>clearInterval(id), 120*seq.length*2);
            }}>360Â°</button>
          )}
        </div>
      )}
    </div>
  );
}
