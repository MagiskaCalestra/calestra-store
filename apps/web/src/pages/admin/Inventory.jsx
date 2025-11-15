import React, { useEffect, useMemo, useState } from "react";
import { CCoreSDK } from "../../core/ccore";

function todayYM() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() };
}

export default function AdminInventory() {
  const [{ y, m }, setYM] = useState(todayYM());
  const availability = useMemo(() => CCoreSDK.Booking.getMonthAvailability(y, m), [y, m]);

  const matrix = useMemo(() => {
    const first = new Date(y, m, 1);
    const firstDow = (first.getDay() + 6) % 7; // 0=mån
    const start = new Date(y, m, 1 - firstDow);
    const weeks = [];
    for (let w = 0; w < 6; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w*7 + d);
        const iso = day.toISOString().slice(0,10);
        row.push({ day, iso });
      }
      weeks.push(row);
    }
    return weeks;
  }, [y, m]);

  const monthLabel = useMemo(() => {
    const s = new Date(y, m, 1).toLocaleString("sv-SE", { month: "long", year: "numeric" });
    return s[0].toUpperCase() + s.slice(1);
  }, [y, m]);

  const inMonth = (d) => d.getMonth() === m && d.getFullYear() === y;

  return (
    <section className="page admin inv">
      <div className="wrap">
        <h1>Inventory (mock)</h1>
        <p className="lead">Översikt över kapacitet per dag. Blackout-datum styrs via <strong>Rule Engine</strong>.</p>

        <div className="head">
          <button className="btn" onClick={()=>{
            const d = new Date(y, m - 1, 1);
            setYM({ y: d.getFullYear(), m: d.getMonth() });
          }}>â€¹ Föregående</button>
          <div className="title">{monthLabel}</div>
          <button className="btn" onClick={()=>{
            const d = new Date(y, m + 1, 1);
            setYM({ y: d.getFullYear(), m: d.getMonth() });
          }}>Nästa â€º</button>
        </div>

        <div className="grid">
          <div className="dow">
            <span>Mån</span><span>Tis</span><span>Ons</span><span>Tors</span><span>Fre</span><span>Lör</span><span>Sön</span>
          </div>
          <div className="cells">
            {matrix.map((row, i) => (
              <React.Fragment key={i}>
                {row.map(({ day, iso }) => {
                  const info = availability[iso];
                  const status = info?.status;
                  const cap = info?.capacityLeft ?? 0;
                  const classes = [
                    "cell",
                    !inMonth(day) && "muted",
                    status,
                    status === "blackout" && "blk"
                  ].filter(Boolean).join(" ");
                  return (
                    <div key={iso} className={classes}>
                      <div className="n">{day.getDate()}</div>
                      {status !== "blackout" && <div className="cap">{cap}</div>}
                      {status === "blackout" && <div className="cap">â€”</div>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="legend">
            <span className="dot g" /> Grön (gott om)
            <span className="dot y" /> Gul (medel)
            <span className="dot r" /> Röd (lågt)
            <span className="dot b" /> Blackout
          </div>
        </div>
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.9; margin-bottom:14px; }
        .head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .title { font-weight:600; }

        .btn { padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }

        .grid { border:1px solid #2b315e; border-radius:14px; background:#0f1430; }
        .dow { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; padding:10px; color:#cbd2e6; }
        .cells { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; padding:10px; }
        .cell { position:relative; aspect-ratio:1/1; border:1px solid #2b315e; border-radius:10px; background:#0b0f25; display:flex; flex-direction:column; justify-content:space-between; }
        .cell.muted { opacity:.4; }
        .n { padding:6px 8px; font-size:.95rem; }
        .cap { padding:0 8px 8px; text-align:right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; opacity:.95; }

        .cell.green { box-shadow: inset 0 0 0 2px #64d28f44; }
        .cell.yellow { box-shadow: inset 0 0 0 2px #ffd16655; }
        .cell.red { box-shadow: inset 0 0 0 2px #ff7b7b55; }
        .cell.blk { background:#1a1a1a; color:#888; }

        .legend { display:flex; gap:10px; align-items:center; border-top:1px solid #2b315e; padding:10px; color:#cbd2e6; }
        .dot { width:10px; height:10px; border-radius:50%; display:inline-block; margin:0 4px 0 8px; }
        .dot.g { background:#64d28f; box-shadow:0 0 8px #64d28f; }
        .dot.y { background:#ffd166; box-shadow:0 0 8px #ffd166; }
        .dot.r { background:#ff7b7b; box-shadow:0 0 8px #ff7b7b; }
        .dot.b { background:#555; }
      `}</style>
    </section>
  );
}
