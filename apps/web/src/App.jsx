// apps/web/src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SkipLink from "./components/SkipLink";
import LanguageFX from "./components/LanguageFX";
import DevToneBanner from "./components/DevToneBanner";
import DevA11yToolbar from "./components/DevA11yToolbar";

import PortalLanding from "./pages/PortalLanding";
import Plan from "./pages/Plan";
import Tickets from "./pages/Tickets";
import Hotels from "./pages/Hotels";
import Dining from "./pages/Dining";
import StoreEmbed from "./pages/StoreEmbed";
import EventsIndex from "./pages/EventsIndex";
import NotFound from "./pages/NotFound";

import "./styles/globals.css";

export default function App() {
  return (
    <>
      <LanguageFX />
      <SkipLink />
      <Header />
      <Routes>
        <Route path="/" element={<PortalLanding />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/dining" element={<Dining />} />
        <Route path="/store" element={<StoreEmbed />} />
        <Route path="/events" element={<EventsIndex />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <DevToneBanner />
      <DevA11yToolbar />
    </>
  );
}
