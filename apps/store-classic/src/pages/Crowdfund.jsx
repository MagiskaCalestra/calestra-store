import React from "react";
import ProgressBar from "../components/ProgressBar.jsx";

export default function Crowdfund(){
  // TODO: Hämta live data från Nexus
  const pledged = 43000, goal = 100000;
  const value = Math.min(100, Math.round(pledged/goal*100));
  return (
    <section>
      <h1>Crowdfunding</h1>
      <ProgressBar value={value} milestones={[10,25,50,75,100]} />
      <p style={{color:"var(--muted)"}}>Kampanj för att öppna porten till Calestra World. Delmål triggar specialeffekter och belöningar.</p>
    </section>
  );
}
