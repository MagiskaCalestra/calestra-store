import React from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <>
      <Header />
      <main id="content" className="container page" key={location.pathname}>
        {children}
      </main>
      <Footer />
    </>
  );
}
