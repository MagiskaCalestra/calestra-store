import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../core/BookingContext";

/** ---- Mock-data: ersätt med riktig fetch mot ert API när det finns ---- */
const RESTAURANTS = [
  {
    id: "gg",
    name: "Garden Grove",
    area: "Elderwood",
    type: ["Table Service", "Character Dining"],
    cuisines: ["Nordic", "Seasonal"],
    price: 3, // 1â€“4
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200",
    hours: { breakfast: "08:00â€“10:30", lunch: "11:30â€“15:30", dinner: "17:00â€“21:00" }
  },
  {
    id: "rs",
    name: "Riverâ€™s Song",
    area: "Aqua Vale",
    type: ["Table Service"],
    cuisines: ["Seafood"],
    price: 4,
    image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200",
    hours: { lunch: "12:00â€“15:00", dinner: "17:30â€“22:00" }
  },
  {
    id: "sm",
    name: "Star Meadow Market",
    area: "Grand Calestra",
    type: ["Quick Service"],
    cuisines: ["Bistro", "Vegan"],
    price: 2,
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200",
    hours: { allDay: "10:00â€“22:00" }
  }
];

/** enkel slotsimulator â€“ byt till riktig availability i backend */
function fakeCheckAvailability({ restaurantId, date, party }) {
  const seed = (restaurantId + date + party).length;
  const all = ["11:30", "12:00", "12:30", "13:00", "17:00", "17:30", "18:00", "18:30", "19:00"];
  return all.filter((_, i) => (i + seed) % 2 === 0);
}

export default function Dining() {
  const nav = useNavigate();
  const { booking, setBooking } = useBooking();

  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All");
  const [types, setTypes] = useState(new Set(["Table Service", "Quick Service"]));
  const [price, setPrice] = useState(0); // 0 = all
  const [date, setDate] = useState(booking.date || "");
  const [party, setParty] = useState(booking.party || 2);

  const areas = useMemo(
    () => ["All", ...Array.from(new Set(RESTAURANTS.map(r => r.area)))],
    []
  );

  const filtered = useMemo(() => {
    return RESTAURANTS.filter(r => {
      if (area !== "All" && r.area !== area) return false;
      if (![...types].some(t => r.type.includes(t))) return false;
      if (price && r.price !== price) return false;
      if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [area, types, price, query]);

  const toggleType = (t) => {
    const next = new Set(types);
    next.has(t) ? next.delete(t) : next.add(t);
    setTypes(next);
  };

  const onCheck = (r) => {
    if (!date) {
      alert("Välj datum först âœ¨");
      return;
    }
    // spara preliminär sökning i booking context
    setBooking({
      ...booking,
      date,
      party,
      dining: { restaurantId: r.id, restaurantName: r.name },
      tempSlots: fakeCheckAvailability({ restaurantId: r.id, date, party })
    });
    nav(`/dining/reserve/${r.id}`);
  };

  return (
    <div className="container py-10">
      <h1 className="h1">Boka bord</h1>
      <p className="muted">Filtrera, hitta en plats som matchar din känsla â€“ och se lediga tider.</p>

      <div className="grid cols-3 mt-6">
        {/* Filterpanel */}
        <div className="card pad">
          <div className="filter-bar">
            <input
              placeholder="Sök restaurangâ€¦"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Sök"
            />
            <select value={area} onChange={(e)=>setArea(e.target.value)}>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={price} onChange={(e)=>setPrice(Number(e.target.value))}>
              <option value={0}>Pris: alla</option>
              <option value={1}>$</option>
              <option value={2}>$$</option>
              <option value={3}>$$$</option>
              <option value={4}>$$$$</option>
            </select>
          </div>

          <div style={{marginTop:12, display:"grid", gap:8}}>
            <label className="chip" style={{cursor:"pointer"}}>
              <input type="checkbox" checked={types.has("Table Service")} onChange={()=>toggleType("Table Service")} />
              <span>Bordsservering</span>
            </label>
            <label className="chip" style={{cursor:"pointer"}}>
              <input type="checkbox" checked={types.has("Quick Service")} onChange={()=>toggleType("Quick Service")} />
              <span>Snabbservering</span>
            </label>
            <label className="chip" style={{cursor:"pointer"}}>
              <input type="checkbox" checked={types.has("Character Dining")} onChange={()=>toggleType("Character Dining")} />
              <span>Karaktärsmöte</span>
            </label>
          </div>

          <div className="panel" style={{marginTop:16, padding:12}}>
            <div className="grid cols-2">
              <div>
                <label>Datum</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <div>
                <label>Antal gäster</label>
                <input type="number" min={1} max={10} value={party} onChange={e=>setParty(Number(e.target.value))}/>
              </div>
            </div>
            <p className="muted" style={{marginTop:8}}>Tip: du kan ändra detta i nästa steg.</p>
          </div>
        </div>

        {/* Resultatlista */}
        <div className="grid cols-1" style={{gap:16}}>
          {filtered.map(r => (
            <article key={r.id} className="product">
              <div className="row wrap" style={{gap:16}}>
                <img src={r.image} alt="" style={{width:180, height:120, objectFit:"cover", borderRadius:12}} />
                <div style={{flex:1, minWidth:240}}>
                  <h3 className="h3" style={{marginBottom:6}}>{r.name}</h3>
                  <p className="muted">
                    {r.area} â€¢ {r.type.join(" Â· ")} â€¢ {"$".repeat(r.price)}
                  </p>
                  <p style={{marginTop:6}} className="muted">
                    {r.hours.breakfast && <>Frukost {r.hours.breakfast} Â· </>}
                    {r.hours.lunch && <>Lunch {r.hours.lunch} Â· </>}
                    {r.hours.dinner && <>Middag {r.hours.dinner}</>}
                    {r.hours.allDay && <>Öppet {r.hours.allDay}</>}
                  </p>
                </div>
                <div className="row" style={{gap:10}}>
                  <button className="btn" onClick={()=>onCheck(r)}>Kolla lediga tider</button>
                  <button className="btn ghost" onClick={()=>alert("Visa meny â€“ kopplas mot meny-API")}>
                    Visa meny
                  </button>
                </div>
              </div>
            </article>
          ))}
          {filtered.length===0 && <div className="notice">Inga träffar. Justera filter.</div>}
        </div>

        {/* Karta-stub */}
        <div className="card pad">
          <h3 className="h3">Karta</h3>
          <div className="panel" style={{height:320, display:"grid", placeItems:"center"}}>
            <span className="muted">Karta kopplas här (Mapbox/Leaflet). Markörer filtreras i realtid.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
