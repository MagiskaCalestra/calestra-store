// apps/web/src/pages/dining/Index.jsx
import React from "react";
import { DiningProvider, useDining } from "../../core/DiningContext";
import CalendarRange from "../../components/dining/CalendarRange";
import FilterBar from "../../components/dining/FilterBar";
import ResultsList from "../../components/dining/ResultsList";
import MapStub from "../../components/dining/MapStub";
import { filterRestaurants } from "../../api/dining";

function DiningPageInner(){
  const { range, setRange, filters } = useDining();
  const items = filterRestaurants(filters);

  return (
    <main className="container py-10">
      <h1 className="h1">Boka Restaurang</h1>
      <p className="muted">Filtrera, välj datumintervall (upp till 10 dagar) och kolla lediga tider.</p>

      <div className="grid gap-12">
        <CalendarRange value={range} onChange={setRange} />
        <FilterBar />
        <div className="grid cols-2 gap-12 responsive">
          <ResultsList />
          <MapStub items={items}/>
        </div>
      </div>
    </main>
  );
}

export default function DiningIndex(){
  return <DiningProvider><DiningPageInner/></DiningProvider>;
}
