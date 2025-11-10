import React from "react";
import { useParams } from "react-router-dom";

export default function CareerDetail(){
  const { id } = useParams();
  return (
    <main className="container py-10">
      <h1 className="h1">Tjänst: {id}</h1>
      <p className="muted">Detta är en plats­hållare. Lägg in ATS-länk när den finns.</p>
    </main>
  );
}
