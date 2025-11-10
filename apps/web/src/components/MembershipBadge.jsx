// apps/web/src/components/MembershipBadge.jsx
import React, { useEffect, useState } from "react";
import { CCoreSDK } from "../core/ccore";

export default function MembershipBadge() {
  const [p, setP] = useState(() => CCoreSDK.DreamCircle.getProgress());

  useEffect(() => {
    const off = CCoreSDK.events.on("dreamcircle.updated", () => {
      setP(CCoreSDK.DreamCircle.getProgress());
    });
    return () => off();
  }, []);

  return (
    <span className={"memb "+p.tier.id} title={`C-Pass ${p.cpassId} · ${p.points}p`}>
      {shortTier(p.tier.id)} {p.points}p
      <style>{`
        .memb { padding:4px 8px; border-radius:999px; border:1px solid #2b315e; font-size:.85rem; }
        .memb.free { background:#0b142a; }
        .memb.silver { background:#0e1222; box-shadow: inset 0 0 0 1px #7b7f92; }
        .memb.gold { background:#2a200f; box-shadow: inset 0 0 0 1px #d4a94a55; }
        .memb.luminary { background:#161a30; box-shadow: 0 0 12px #7aa0ff66, inset 0 0 0 1px #7aa0ff55; }
      `}</style>
    </span>
  );
}

function shortTier(id) {
  return { free: "Free", silver: "Silver", gold: "Gold", luminary: "Luminary" }[id] || id;
}
