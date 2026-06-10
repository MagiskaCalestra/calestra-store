// D:\WebProjects\Calestra\apps\store-classic\src\components\Layout.jsx
// apps/store-classic/src/components/Layout.jsx

import { Outlet } from "react-router-dom";

import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import FeedbackButton from "./FeedbackButton.jsx";

export default function Layout() {
  return (
    <div className="cw-app">
      <Header />

      <main id="main" className="container cw-main" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
      <FeedbackButton />

      <style>{`
        .cw-app{
          position:relative;
          min-height:100dvh;
          width:100%;
          overflow-x:hidden;
          isolation:isolate;
          background:var(--cw-app-bg, transparent);
        }

        .cw-main{
          position:relative;
          z-index:1;
          min-height:calc(100dvh - 220px);
          scroll-margin-top:120px;
        }

        .cw-main:focus{
          outline:none;
        }

        @media (max-width:980px){
          .cw-app{
            overflow-x:clip;
          }

          .cw-main{
            z-index:1;
            scroll-margin-top:16px;
          }
        }

        @supports not (height: 100dvh){
          .cw-app{
            min-height:100vh;
          }

          .cw-main{
            min-height:calc(100vh - 220px);
          }
        }
      `}</style>
    </div>
  );
}