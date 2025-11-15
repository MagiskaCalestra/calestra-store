// apps/web/src/pages/PortalLanding.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ProgressMeter from "../components/ProgressMeter";
import Planner from "../components/Planner";
import SkipLink from "../components/SkipLink";
import { fetchProgressSummary } from "../api/progress";
import { parsePlanParams } from "../utils/planParams";
import { loadPartner } from "../core/partner";
import PartnerSlot from "../components/PartnerSlot";

export default function PortalLanding() {
  const { i18n, t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchProgress(i18n.language || "sv");
        if (alive) {
          setProgress(data);
          setError(data.__fallback ? "fallback" : "");
        }
      } catch {
        if (alive) setError("failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [i18n.language]);

  useEffect(() => {
    setPartner(loadPartner(i18n.language || "sv"));
  }, [i18n.language]);

  const segments = progress?.segments || [];
  const updated = progress?.updatedAt
    ? new Date(progress.updatedAt).toLocaleString()
    : null;

  const initialPlan = parsePlanParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  return (
    <>
      <SkipLink />

      <main id="main" role="main" aria-labelledby="pageTitle">
        {/* HERO */}
        <section
          aria-labelledby="heroTitle"
          style={{
            minHeight: "48vh",
            display: "grid",
            placeItems: "center",
            /* WebP med JPEG fallback via image-set */
            backgroundImage:
              "linear-gradient(180deg, rgba(10,12,24,0.55), rgba(10,12,24,0.85)), image-set(url('/images/world/portal-hero.webp') type('image/webp'), url('/images/world/portal-hero.jpg') type('image/jpeg'))",
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "white",
            textAlign: "center",
            padding: "64px 16px"
          }}
        >
          <div style={{ maxWidth: 900 }}>
            <h2 id="heroTitle" style={{ fontSize: 42, margin: "0 0 12px" }}>
              {t("hero.title", "Welcome to Calestra")}
            </h2>
            <p style={{ fontSize: 18, opacity: 0.9 }}>
              {t(
                "hero.lead",
                "A living portal to a world of emotion, wonder and light."
              )}
            </p>
          </div>
        </section>

        {/* PLANNER */}
        <section className="container" aria-labelledby="plannerTitle" style={{ margin: "24px auto" }}>
          <h3 id="plannerTitle" style={{ color: "#fff", marginBottom: 12 }}>
            {t("plan.title", "Plan your visit")}
          </h3>
          <Planner initial={initialPlan} />
        </section>

        {/* PROGRESS */}
        <section className="container" aria-labelledby="progressTitle" style={{ margin: "24px auto" }}>
          <h3 id="progressTitle" style={{ color: "#fff", marginBottom: 12 }}>
            {t("progress.title", "Together toward 25 Billion Dreams")}
          </h3>

          {loading && (
            <div style={{ color: "#ffffffcc", fontSize: 14 }}>
              {t("progress.loading", "Loading progressâ€¦")}
            </div>
          )}

          {!loading && error === "failed" && (
            <div
              className="card"
              style={{
                color: "#ffb4b4",
                background: "rgba(255,80,80,0.08)",
                border: "1px solid rgba(255,102,102,0.2)"
              }}
            >
              {t(
                "progress.error",
                "We canâ€™t reach the progress service right now. Showing safe fallback."
              )}
            </div>
          )}

          {!loading &&
            segments.slice(0, 3).map((s) => (
              <ProgressMeter
                key={s.id}
                label={s.label}
                current={s.current}
                goal={s.goal}
              />
            ))}

          {!loading && updated && (
            <div style={{ color: "#ffffff90", fontSize: 12, marginTop: 6 }}>
              {t("progress.updated", "Updated")}: {updated}
              {error === "fallback" ? " Â· fallback" : ""}
            </div>
          )}
        </section>

        {/* PARTNER SLOT */}
        <PartnerSlot data={partner} />
      </main>
    </>
  );
}
