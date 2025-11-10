import React from "react";
import { Link } from "react-router-dom";

export default function Confirmation() {
  return (
    <main className="container py-10">
      <h1 className="h1">Tack! Din resa är bokad.</h1>
      <p>Du får ett bekräftelsemail inom kort. Vill du boka bord nu?</p>
      <div className="row gap-2">
        <Link className="btn" to="/dining/reserve">Öppna bordbokningen</Link>
        <Link className="btn btn--ghost" to="/">Tillbaka till startsidan</Link>
      </div>
    </main>
  );
}
