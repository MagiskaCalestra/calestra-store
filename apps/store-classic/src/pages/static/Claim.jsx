// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Claim.jsx
// apps/store-classic/src/pages/static/Claim.jsx

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Page, Section } from "./_helpers.jsx";

const API_URL = import.meta?.env?.VITE_CLAIMS_URL || "/api/claims";

const PROBLEM_OPTIONS = [
  {
    value: "damaged",
    sv: "Skadad produkt",
    en: "Damaged product",
    tr: "Hasarlı ürün",
  },
  {
    value: "misprint",
    sv: "Feltryck",
    en: "Misprint",
    tr: "Baskı hatası",
  },
  {
    value: "wrong_item",
    sv: "Fel produkt",
    en: "Wrong item",
    tr: "Yanlış ürün",
  },
  {
    value: "defect",
    sv: "Defekt / produktionsfel",
    en: "Defect / production issue",
    tr: "Kusur / üretim hatası",
  },
  {
    value: "delivery",
    sv: "Leveransproblem",
    en: "Delivery issue",
    tr: "Teslimat sorunu",
  },
  {
    value: "size",
    sv: "Storlek / passform",
    en: "Size / fit",
    tr: "Beden / kalıp",
  },
  {
    value: "changed_mind",
    sv: "Ångrat köp",
    en: "Changed mind",
    tr: "Fikir değişikliği",
  },
  {
    value: "other",
    sv: "Annat",
    en: "Other",
    tr: "Diğer",
  },
];

function getShortLang(i18n) {
  return String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();
}

function pickLang(i18n, values = {}) {
  const lang = getShortLang(i18n);
  return values[lang] || values.sv || values.en || values.tr || "";
}

function clean(value, max = 4000) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

const DEFAULT_FORM = {
  orderId: "",
  email: "",
  name: "",
  productName: "",
  problemType: "defect",
  discoveredAt: "",
  problemText: "",
  imageUrls: "",
};

export default function Claim() {
  const { i18n } = useTranslation();

  const [form, setForm] = React.useState(DEFAULT_FORM);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(null);

  const pageTitle = pickLang(i18n, {
    sv: "Problem med order",
    en: "Problem with an order",
    tr: "Siparişle ilgili sorun",
  });

  const intro = pickLang(i18n, {
    sv:
      "Här kan du skicka in ett ärende om något inte stämmer med din Calestra-order. Vi granskar underlaget och hjälper dig vidare på ett tryggt och tydligt sätt.",
    en:
      "Here you can submit a case if something is wrong with your Calestra order. We review the information and help you move forward clearly and safely.",
    tr:
      "Calestra siparişinizle ilgili bir sorun varsa buradan başvuru gönderebilirsiniz. Bilgileri inceler ve size güvenli, net bir şekilde yardımcı oluruz.",
  });

  const L = React.useMemo(
    () => ({
      formTitle: pickLang(i18n, {
        sv: "Skicka in ärende",
        en: "Submit a case",
        tr: "Başvuru gönder",
      }),
      formLead: pickLang(i18n, {
        sv:
          "Fyll i ordernummer, e-post och beskriv problemet så tydligt du kan. Om du har bilder kan du lägga in bildlänkar här eller mejla dem till oss efteråt.",
        en:
          "Enter your order number, email, and describe the issue as clearly as possible. If you have photos, you can add image links here or email them to us afterwards.",
        tr:
          "Sipariş numaranızı, e-postanızı girin ve sorunu mümkün olduğunca açık anlatın. Fotoğraflarınız varsa bağlantıları buraya ekleyebilir veya sonra bize e-posta ile gönderebilirsiniz.",
      }),
      orderId: pickLang(i18n, {
        sv: "Ordernummer",
        en: "Order number",
        tr: "Sipariş numarası",
      }),
      email: pickLang(i18n, {
        sv: "E-post som användes vid beställning",
        en: "Email used for the order",
        tr: "Siparişte kullanılan e-posta",
      }),
      name: pickLang(i18n, {
        sv: "Namn",
        en: "Name",
        tr: "Ad",
      }),
      productName: pickLang(i18n, {
        sv: "Produkt",
        en: "Product",
        tr: "Ürün",
      }),
      problemType: pickLang(i18n, {
        sv: "Typ av problem",
        en: "Type of issue",
        tr: "Sorun türü",
      }),
      discoveredAt: pickLang(i18n, {
        sv: "När upptäckte du problemet?",
        en: "When did you notice the issue?",
        tr: "Sorunu ne zaman fark ettiniz?",
      }),
      problemText: pickLang(i18n, {
        sv: "Beskriv problemet",
        en: "Describe the issue",
        tr: "Sorunu açıklayın",
      }),
      imageUrls: pickLang(i18n, {
        sv: "Bildlänkar, valfritt",
        en: "Image links, optional",
        tr: "Görsel bağlantıları, isteğe bağlı",
      }),
      imageHint: pickLang(i18n, {
        sv:
          "Lägg gärna en länk per rad om du redan har bilder uppladdade. Annars kan du mejla bilder efter att ärendet skapats.",
        en:
          "Add one link per line if your photos are already uploaded. Otherwise, you can email photos after the case has been created.",
        tr:
          "Fotoğraflarınız yüklüyse her satıra bir bağlantı ekleyin. Aksi halde başvuru oluşturulduktan sonra fotoğrafları e-posta ile gönderebilirsiniz.",
      }),
      requiredHelp: pickLang(i18n, {
        sv: "Obligatoriskt",
        en: "Required",
        tr: "Zorunlu",
      }),
      submit: pickLang(i18n, {
        sv: "Skicka ärende",
        en: "Submit case",
        tr: "Başvuruyu gönder",
      }),
      sending: pickLang(i18n, {
        sv: "Skickar…",
        en: "Sending…",
        tr: "Gönderiliyor…",
      }),
      successTitle: pickLang(i18n, {
        sv: "Ärendet är mottaget",
        en: "Case received",
        tr: "Başvuru alındı",
      }),
      successText: pickLang(i18n, {
        sv:
          "Tack. Calestra har tagit emot ditt ärende och kommer att granska underlaget. Om vi behöver fler bilder eller uppgifter återkommer vi till dig.",
        en:
          "Thank you. Calestra has received your case and will review the information. If we need more photos or details, we will contact you.",
        tr:
          "Teşekkürler. Calestra başvurunuzu aldı ve bilgileri inceleyecek. Daha fazla fotoğraf veya bilgi gerekirse sizinle iletişime geçeceğiz.",
      }),
      claimId: pickLang(i18n, {
        sv: "Ärendenummer",
        en: "Case number",
        tr: "Başvuru numarası",
      }),
      supportHint: pickLang(i18n, {
        sv:
          "Om du behöver skicka bilder via mejl, skriv gärna ärendenumret i ämnesraden.",
        en:
          "If you need to email photos, please include the case number in the subject line.",
        tr:
          "Fotoğrafları e-posta ile göndermeniz gerekiyorsa konu satırına başvuru numarasını yazın.",
      }),
      returnsLink: pickLang(i18n, {
        sv: "Läs våra retur- och reklamationsvillkor",
        en: "Read our returns and claims policy",
        tr: "İade ve reklamasyon koşullarını okuyun",
      }),
      privacyNote: pickLang(i18n, {
        sv:
          "Vi använder uppgifterna endast för att hantera ditt ärende, följa upp din order och bedöma eventuell reklamation.",
        en:
          "We use this information only to handle your case, follow up your order, and review any possible claim.",
        tr:
          "Bu bilgileri yalnızca başvurunuzu yönetmek, siparişinizi takip etmek ve olası reklamasyonu değerlendirmek için kullanırız.",
      }),
    }),
    [i18n]
  );

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const orderId = clean(form.orderId, 160);
    const email = clean(form.email, 220).toLowerCase();
    const problemText = clean(form.problemText, 3000);

    if (!orderId) {
      return pickLang(i18n, {
        sv: "Skriv ordernummer.",
        en: "Enter your order number.",
        tr: "Sipariş numarasını girin.",
      });
    }

    if (!email || !email.includes("@")) {
      return pickLang(i18n, {
        sv: "Skriv en giltig e-postadress.",
        en: "Enter a valid email address.",
        tr: "Geçerli bir e-posta adresi girin.",
      });
    }

    if (!problemText || problemText.length < 10) {
      return pickLang(i18n, {
        sv: "Beskriv problemet lite tydligare.",
        en: "Describe the issue a little more clearly.",
        tr: "Sorunu biraz daha net açıklayın.",
      });
    }

    return "";
  }

  async function submit(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    setSuccess(null);

    try {
      const imageUrls = clean(form.imageUrls, 4000)
        .split(/\n|,/g)
        .map((x) => x.trim())
        .filter(Boolean);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          orderId: clean(form.orderId, 160),
          email: clean(form.email, 220).toLowerCase(),
          name: clean(form.name, 220),
          productName: clean(form.productName, 300),
          problemType: clean(form.problemType, 80),
          discoveredAt: clean(form.discoveredAt, 160),
          problemText: clean(form.problemText, 3000),
          imageUrls,
          source: "store_claim_page",
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || json?.detail || `HTTP ${res.status}`);
      }

      setSuccess(json);
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(
        pickLang(i18n, {
          sv:
            "Ärendet kunde inte skickas just nu. Kontrollera uppgifterna och försök igen.",
          en:
            "The case could not be submitted right now. Please check the details and try again.",
          tr:
            "Başvuru şu anda gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.",
        }) + ` (${String(err?.message || err)})`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title={pageTitle} intro={intro}>
      <Section
        title={pickLang(i18n, {
          sv: "Innan du skickar",
          en: "Before you submit",
          tr: "Göndermeden önce",
        })}
        body={pickLang(i18n, {
          sv:
            "Vid skada, feltryck eller defekt behöver vi vanligtvis tydliga bilder på hela produkten, närbild på problemet och gärna förpackning eller etikett. Det hjälper oss att bedöma ärendet snabbare.",
          en:
            "For damage, misprints, or defects, we usually need clear photos of the full product, a close-up of the issue, and preferably the packaging or label. This helps us review the case faster.",
          tr:
            "Hasar, baskı hatası veya kusur durumunda genellikle ürünün tamamını, sorunun yakın görüntüsünü ve mümkünse ambalaj ya da etiketi gösteren net fotoğraflara ihtiyaç duyarız. Bu incelemeyi hızlandırır.",
        })}
      />

      {success ? (
        <section className="claim-card claim-success" role="status" aria-live="polite">
          <div className="claim-success-mark">✓</div>
          <div>
            <h2>{L.successTitle}</h2>
            <p>{L.successText}</p>
            <div className="claim-id-box">
              <span>{L.claimId}</span>
              <strong>{success.claimId}</strong>
            </div>
            <p className="claim-muted">{L.supportHint}</p>
          </div>
        </section>
      ) : null}

      <section className="claim-card" aria-labelledby="claim-form-title">
        <div className="claim-head">
          <div>
            <h2 id="claim-form-title">{L.formTitle}</h2>
            <p>{L.formLead}</p>
          </div>
        </div>

        {error ? (
          <div className="claim-alert" role="alert">
            {error}
          </div>
        ) : null}

        <form className="claim-form" onSubmit={submit}>
          <div className="claim-grid claim-grid-2">
            <label>
              <span>
                {L.orderId} <b>{L.requiredHelp}</b>
              </span>
              <input
                value={form.orderId}
                onChange={(e) => update("orderId", e.target.value)}
                placeholder="CW-10024"
                autoComplete="off"
              />
            </label>

            <label>
              <span>
                {L.email} <b>{L.requiredHelp}</b>
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="namn@email.com"
                autoComplete="email"
              />
            </label>
          </div>

          <div className="claim-grid claim-grid-2">
            <label>
              <span>{L.name}</span>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="name"
              />
            </label>

            <label>
              <span>{L.productName}</span>
              <input
                value={form.productName}
                onChange={(e) => update("productName", e.target.value)}
                placeholder="Black Star Tee"
              />
            </label>
          </div>

          <div className="claim-grid claim-grid-2">
            <label>
              <span>{L.problemType}</span>
              <select
                value={form.problemType}
                onChange={(e) => update("problemType", e.target.value)}
              >
                {PROBLEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {pickLang(i18n, option)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{L.discoveredAt}</span>
              <input
                value={form.discoveredAt}
                onChange={(e) => update("discoveredAt", e.target.value)}
                placeholder={pickLang(i18n, {
                  sv: "Ex. vid leverans / efter första tvätt",
                  en: "E.g. on delivery / after first wash",
                  tr: "Örn. teslimatta / ilk yıkamadan sonra",
                })}
              />
            </label>
          </div>

          <label>
            <span>
              {L.problemText} <b>{L.requiredHelp}</b>
            </span>
            <textarea
              rows={6}
              value={form.problemText}
              onChange={(e) => update("problemText", e.target.value)}
              placeholder={pickLang(i18n, {
                sv:
                  "Beskriv vad som är fel, var felet syns och om produkten användes eller tvättades innan problemet upptäcktes.",
                en:
                  "Describe what is wrong, where the issue is visible, and whether the product was used or washed before the issue was noticed.",
                tr:
                  "Sorunun ne olduğunu, nerede göründüğünü ve sorun fark edilmeden önce ürünün kullanılıp kullanılmadığını veya yıkanıp yıkanmadığını açıklayın.",
              })}
            />
          </label>

          <label>
            <span>{L.imageUrls}</span>
            <textarea
              rows={4}
              value={form.imageUrls}
              onChange={(e) => update("imageUrls", e.target.value)}
              placeholder="https://..."
            />
            <em>{L.imageHint}</em>
          </label>

          <div className="claim-footer-row">
            <p>{L.privacyNote}</p>
            <button type="submit" disabled={busy}>
              {busy ? L.sending : L.submit}
            </button>
          </div>
        </form>
      </section>

      <section className="claim-card claim-soft">
        <h2>
          {pickLang(i18n, {
            sv: "Villkor och trygghet",
            en: "Policy and protection",
            tr: "Koşullar ve güvence",
          })}
        </h2>
        <p>
          {pickLang(i18n, {
            sv:
              "Calestra-produkter tillverkas normalt på beställning. Därför fungerar returer annorlunda, men om något är fel granskar vi ärendet seriöst och rättvist.",
            en:
              "Calestra products are normally made to order. This means returns work differently, but if something is wrong, we review the case seriously and fairly.",
            tr:
              "Calestra ürünleri genellikle sipariş üzerine üretilir. Bu nedenle iadeler farklı işler, ancak bir sorun varsa başvuruyu ciddi ve adil şekilde inceleriz.",
          })}
        </p>
        <Link to="/returns">{L.returnsLink}</Link>
      </section>

      <style>{`
        .claim-card{
          margin:18px 0;
          padding:20px;
          border-radius:24px;
          border:1px solid rgba(15,23,42,.08);
          background:
            radial-gradient(circle at top right, rgba(250,204,21,.10), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.99));
          box-shadow:0 18px 42px rgba(15,23,42,.06);
          color:#0f172a;
        }

        .theme-dark .claim-card{
          border-color:rgba(148,163,184,.14);
          background:
            radial-gradient(circle at top right, rgba(250,204,21,.08), transparent 34%),
            linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
          color:#f8fafc;
        }

        .claim-head{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:14px;
          margin-bottom:16px;
        }

        .claim-head h2,
        .claim-card h2{
          margin:0 0 6px;
          font-size:24px;
          letter-spacing:-.03em;
        }

        .claim-head p,
        .claim-card p{
          margin:0;
          color:#64748b;
          font-size:14px;
          line-height:1.6;
          font-weight:750;
        }

        .theme-dark .claim-head p,
        .theme-dark .claim-card p{
          color:#cbd5e1;
        }

        .claim-alert{
          margin:0 0 14px;
          padding:12px 14px;
          border-radius:16px;
          background:#fef2f2;
          border:1px solid #fecaca;
          color:#991b1b;
          font-weight:900;
        }

        .claim-form{
          display:grid;
          gap:14px;
        }

        .claim-grid{
          display:grid;
          gap:14px;
        }

        .claim-grid-2{
          grid-template-columns:1fr 1fr;
        }

        .claim-form label{
          display:grid;
          gap:7px;
          min-width:0;
        }

        .claim-form label span{
          font-size:13px;
          font-weight:950;
          color:#0f172a;
        }

        .theme-dark .claim-form label span{
          color:#e5e7eb;
        }

        .claim-form label span b{
          margin-left:6px;
          font-size:10px;
          text-transform:uppercase;
          letter-spacing:.06em;
          color:#b45309;
        }

        .claim-form input,
        .claim-form select,
        .claim-form textarea{
          width:100%;
          min-height:46px;
          border:1px solid rgba(148,163,184,.55);
          border-radius:14px;
          padding:0 12px;
          background:#fff;
          color:#0f172a;
          font:inherit;
          font-weight:750;
        }

        .claim-form textarea{
          padding:12px;
          resize:vertical;
          line-height:1.5;
        }

        .theme-dark .claim-form input,
        .theme-dark .claim-form select,
        .theme-dark .claim-form textarea{
          background:#0f172a;
          color:#e5e7eb;
          border-color:rgba(148,163,184,.22);
        }

        .claim-form input:focus,
        .claim-form select:focus,
        .claim-form textarea:focus{
          outline:2px solid rgba(75,107,250,.18);
          border-color:#4B6BFA;
          box-shadow:0 0 0 4px rgba(75,107,250,.08);
        }

        .claim-form em{
          color:#64748b;
          font-size:12px;
          line-height:1.45;
          font-style:normal;
          font-weight:750;
        }

        .theme-dark .claim-form em{
          color:#94a3b8;
        }

        .claim-footer-row{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:16px;
          padding-top:4px;
        }

        .claim-footer-row p{
          max-width:72ch;
          font-size:12px;
        }

        .claim-footer-row button{
          border:0;
          border-radius:999px;
          min-height:48px;
          padding:0 18px;
          background:linear-gradient(135deg, #4B6BFA, #3558ff);
          color:white;
          font-weight:1000;
          cursor:pointer;
          box-shadow:0 14px 28px rgba(75,107,250,.18);
          white-space:nowrap;
        }

        .claim-footer-row button:disabled{
          opacity:.6;
          cursor:not-allowed;
          box-shadow:none;
        }

        .claim-success{
          display:flex;
          gap:14px;
          align-items:flex-start;
          border-color:rgba(16,185,129,.24);
          background:
            radial-gradient(circle at top right, rgba(16,185,129,.12), transparent 34%),
            linear-gradient(180deg, rgba(240,253,244,.96), rgba(255,255,255,.99));
        }

        .theme-dark .claim-success{
          background:
            radial-gradient(circle at top right, rgba(16,185,129,.12), transparent 34%),
            linear-gradient(180deg, rgba(6,78,59,.22), rgba(15,23,42,.96));
        }

        .claim-success-mark{
          width:42px;
          height:42px;
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#10b981;
          color:white;
          font-weight:1000;
          flex:0 0 auto;
        }

        .claim-id-box{
          margin-top:12px;
          display:inline-grid;
          gap:3px;
          padding:10px 12px;
          border-radius:16px;
          background:rgba(15,23,42,.05);
          border:1px solid rgba(15,23,42,.08);
        }

        .theme-dark .claim-id-box{
          background:rgba(255,255,255,.06);
          border-color:rgba(148,163,184,.16);
        }

        .claim-id-box span{
          font-size:11px;
          color:#64748b;
          text-transform:uppercase;
          letter-spacing:.06em;
          font-weight:1000;
        }

        .theme-dark .claim-id-box span{
          color:#cbd5e1;
        }

        .claim-id-box strong{
          font-size:17px;
          letter-spacing:-.02em;
        }

        .claim-muted{
          margin-top:10px !important;
          font-size:12px !important;
        }

        .claim-soft a{
          margin-top:12px;
          display:inline-flex;
          align-items:center;
          min-height:38px;
          padding:0 14px;
          border-radius:999px;
          background:rgba(75,107,250,.10);
          color:#1d4ed8;
          text-decoration:none;
          font-weight:950;
        }

        .theme-dark .claim-soft a{
          color:#dbeafe;
          background:rgba(75,107,250,.18);
        }

        @media (max-width:760px){
          .claim-card{
            padding:16px;
            border-radius:20px;
          }

          .claim-grid-2{
            grid-template-columns:1fr;
          }

          .claim-footer-row{
            align-items:stretch;
            flex-direction:column;
          }

          .claim-footer-row button{
            width:100%;
          }

          .claim-success{
            flex-direction:column;
          }
        }
      `}</style>
    </Page>
  );
}