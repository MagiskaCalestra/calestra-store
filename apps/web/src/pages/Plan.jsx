// apps/web/src/pages/Plan.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDefaults, parsePlanParams, stringifyPlanParams } from "../utils/planParams";

export default function Plan() {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const initial = useMemo(() => parsePlanParams(`?${sp.toString()}`), [sp]);
  const [form, setForm] = useState(initial);
  const defaults = useMemo(() => getDefaults(), []);

  // Sync URL -> state när URL ändras via back/forward
  useEffect(() => {
    setForm(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function updateUrl(next) {
    const q = stringifyPlanParams(next);
    // Byt query utan reload
    navigate(`/plan${q}`, { replace: true });
  }

  function onChangeCommit(k, v) {
    const next = { ...form, [k]: v };
    setForm(next);
    updateUrl(next);
  }

  return (
    <main style={{ maxWidth: 1200, margin: "24px auto", padding: "0 16px", color: "#fff" }}>
      <h2 style={{ marginBottom: 12 }}>{t("plan.pageTitle", "Your plan")}</h2>
      <p style={{ marginTop: 0, color: "#ffffffc0" }}>
        {t("plan.pageLead", "Adjust details below — the URL updates automatically.")}
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          background: "rgba(255,255,255,0.05)",
        }}
      >
        <Field
          label={t("plan.date", "Date")}
          type="date"
          value={form.date}
          onChange={(v) => onChangeCommit("date", v)}
        />

        <Field
          label={t("plan.nights", "Nights")}
          type="number"
          min={1}
          max={365}
          value={form.nights}
          onChange={(v) => onChangeCommit("nights", clampInt(v, 1, 365))}
        />

        <Field
          label={t("plan.adults", "Adults")}
          type="number"
          min={1}
          max={12}
          value={form.adults}
          onChange={(v) => onChangeCommit("adults", clampInt(v, 1, 12))}
        />

        <Field
          label={t("plan.kids", "Kids")}
          type="number"
          min={0}
          max={12}
          value={form.kids}
          onChange={(v) => onChangeCommit("kids", clampInt(v, 0, 12))}
        />

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.9 }}>
            {t("plan.packageType", "Package")}
          </span>
          <select
            value={form.packageType}
            onChange={(e) => onChangeCommit("packageType", e.target.value)}
            style={inputStyle}
          >
            <option value="standard">{t("plan.pkg.standard", "Standard")}</option>
            <option value="premium">{t("plan.pkg.premium", "Premium")}</option>
            <option value="lux">{t("plan.pkg.lux", "Lux")}</option>
          </select>
        </label>
      </section>

      <section style={{ marginTop: 18, fontSize: 14, color: "#ffffffcc" }}>
        <div>
          <strong>{t("plan.summary", "Summary")}:</strong>{" "}
          {form.date || t("plan.noDate", "no date")}, {form.nights} {t("plan.nights", "nights")},{" "}
          {form.adults} {t("plan.adults", "adults")}, {form.kids} {t("plan.kids", "kids")},{" "}
          {t("plan.packageType", "package")}: {form.packageType}
        </div>
        <div style={{ marginTop: 6 }}>
          {t("plan.shareTip", "You can copy the URL to share this plan.")}
        </div>
      </section>
    </main>
  );
}

function Field({ label, type, value, onChange, min, max }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.9 }}>{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 8,
  padding: "8px 10px",
};

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
