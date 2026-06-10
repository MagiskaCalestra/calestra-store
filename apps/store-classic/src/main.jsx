// D:\WebProjects\Calestra\apps\store-classic\src\main.jsx

// Init i18n först
import "./i18n/index.js";

// Celeste overlay mount
import "./core/ai/mountCelesteOverlay.js";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./styles.css";

import { LangProvider } from "./context/LangContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";
import { CampaignProvider } from "./context/CampaignContext.jsx";

/**
 * ✅ Viktigt:
 * - Endast EN nivå av Lang/Theme/Currency/Campaign providers (här)
 * - App.jsx ska inte dubbla dessa providers
 */

function Root() {
  return (
    <LangProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <CampaignProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </CampaignProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </LangProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
