import { buildMonthlyReportHTML } from "@utils/report";

/**
 * Skapar en .eml-fil med rapporten som HTML-bilaga (inline multipart).
 * Kan öppnas i t.ex. Outlook/Apple Mail och skickas vidare manuellt.
 */
export function downloadMonthlyEmail({ to="partner@example.com", subject, snapshot, bankDirectory, myRef }) {
  const boundary = "----=_CalestraBoundary_" + Date.now();
  const html = buildMonthlyReportHTML({ title: subject, snapshot, bankDirectory, myRef });

  const parts = [
    `From: Calestra Reports <no-reply@calestra.local>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="utf-8"`,
    ``,
    `Hej! Se den HTML-formaterade månadsrapporten nedan.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    ``,
    html,
    `--${boundary}--`,
    ``,
  ].join("\r\n");

  const blob = new Blob([parts], { type: "message/rfc822" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `calestra_report_${new Date().toISOString().slice(0,7)}.eml`;
  a.click();
  URL.revokeObjectURL(a.href);
}
