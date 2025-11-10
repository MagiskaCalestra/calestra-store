import React from "react";
import { Link, useLocation } from "react-router-dom";

const steps = [
  { path: "/booking", label: "Start" },
  { path: "/booking/Tickets", label: "Park" },
  { path: "/booking/Dining", label: "Mat" },
  { path: "/booking/Checkout", label: "Kassa" },
];

export default function BookingProgress(){
  const { pathname } = useLocation();
  return (
    <nav className="booking-progress">
      {steps.map((s, i)=>(
        <Link key={s.path} to={s.path} className={`bp-item ${pathname.startsWith(s.path) ? "active" : ""}`}>
          <span className="bp-index">{i+1}</span>
          <span>{s.label}</span>
        </Link>
      ))}
    </nav>
  );
}
