// D:\WebProjects\Calestra\apps\store-classic\src\components\Comments.jsx

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Comments({ items = [], onPost }) {
  const { t } = useTranslation();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const value = String(text || "").trim();
    if (!value || loading) return;

    try {
      setLoading(true);
      await onPost?.(value);
      setText("");
    } catch (err) {
      console.error("Comment post failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label={t("comments.title", "Kommentarer")}>
      <h2>{t("comments.title", "Kommentarer")}</h2>

      {items.length === 0 && (
        <p>{t("comments.empty", "Inga kommentarer ännu")}</p>
      )}

      <ul className="comments">
        {items.map((c) => (
          <li key={c.id}>
            <b>
              {t("comments.by", {
                name: c.author || "Anon",
                defaultValue: `Av ${c.author || "Anon"}`,
              })}
            </b>

            <p>{String(c.text || "")}</p>

            <small>
              {c.when ||
                t("comments.postedJustNow", "Publicerad nyss")}
            </small>
          </li>
        ))}
      </ul>

      <form onSubmit={submit}>
        <label className="sr-only" htmlFor="comment">
          {t("comments.placeholder", "Skriv en kommentar")}
        </label>

        <textarea
          id="comment"
          placeholder={t("comments.placeholder", "Skriv en kommentar")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="3"
          disabled={loading}
        />

        <button className="btn" disabled={loading || !text.trim()}>
          {loading
            ? t("buttons.posting", "...")
            : t("buttons.postComment", "Skicka")}
        </button>
      </form>
    </section>
  );
}