import React from "react";

export default function GoRedirect() {
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("u");
    if (!raw) return;

    // Tillåt bara http(s)
    try {
      const u = new URL(raw);
      if (!/^https?:$/i.test(u.protocol)) throw new Error("bad proto");
      // öppna i samma fönster för att undvika popup-block
      window.location.replace(u.toString());
    } catch {
      // fail safe tillbaka hem
      window.location.replace("/");
    }
  }, []);

  return (
    <div className="container section-lg">
      <div className="h2">Öppnar partnerlänk…</div>
      <p className="small">Ett ögonblick.</p>
    </div>
  );
}
