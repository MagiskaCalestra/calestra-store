// apps/web/src/components/Planner.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getDefaults, stringifyPlanParams } from "../utils/planParams";

export default function Planner({ initial = {} }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const defaults = useMemo(() => getDefaults(), []);
  const [form, setForm] = useState({ ...defaults, ...(initial || {}) });

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function onSubmit(e) {
    e.preventDefault();
    const q = stringifyPlanParams(form);
    navigate(`/plan${q}`, { replace: false });
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-label={t("planner.cta", "Plan your visit")}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 12,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.05)",
        color: "#fff"
      }}
    >
      <Field
        label={t("planner.date", "Date")}
        type="date"
        value={form.date}
        onChange={(v) => setField("date", v)}
      />
      <Field
        label={t("planner.nights", "Nights")}
        type="number"
        min={1}
        max={365}
        value={form.nights}
        onChange={(v) => setField("nights", clampInt(v, 1, 365))}
      />
      <Field
        label={t("planner.adults", "Adults")}
        type="number"
        min={1}
        max={12}
        value={form.adults}
        onChange={(v) => setField("adults", clampInt(v, 1, 12))}
      />
      <Field
        label={t("planner.kids", "Kids")}
        type="number"
        min={0}
        max={12}
        value={form.kids}
        onChange={(v) => setField("kids", clampInt(v, 0, 12))}
      />
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.9 }}>{t("planner.package", "Package")}</span>
        <select
          value={form.packageType}
          onChange={(e) => setField("packageType", e.target.value)}
          style={inputStyle}
        >
          <option value="tickets">{t("planner.packages.tickets", "Tickets only")}</option>
          <option value="hotelTickets">{t("planner.packages.hotelTickets", "Hotel + tickets")}</option>
          <option value="dining">{t("planner.packages.dining", "Dining package")}</option>
        </select>
      </label>

      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#ffffffcc" }}>{t("planner.tip")}</span>
        <button
          type="submit"
          style={{
            background: "linear-gradient(90deg, #a8b8ff 0%, #6f8bff 60%, #4c6fff 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer"
          }}
          aria-label={t("planner.cta", "Plan your visit")}
        >
          {t("planner.cta", "Plan your visit")}
        </button>
      </div>
    </form>
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
  padding: "8px 10px"
};

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
