// src/pages/StoreEmbed.jsx
export default function StoreEmbed(){
  return (
    <div style={{height:"calc(100vh - 64px)"}}>
      <iframe
        src="/_store/"
        title="Calestra Store"
        style={{border:0, width:"100%", height:"100%"}}
      />
    </div>
  );
}
