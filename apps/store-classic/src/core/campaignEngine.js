// D:\WebProjects\Calestra\apps\store-classic\src\core\campaignEngine.js

export const CAMPAIGN_OVERRIDE_COOKIE = "cw_campaign_override";
export const CAMPAIGN_OVERRIDE_LS_KEY = "cw.campaignOverride";
export const CAMPAIGN_OVERRIDE_EVENT = "cw:campaign-override-changed";

const DEFAULT_LANG = "sv";

function sortByPriorityDesc(a, b) {
  return Number(b?.priority || 0) - Number(a?.priority || 0);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function normalizeCampaignLang(lang) {
  const raw = String(lang || DEFAULT_LANG).toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("tr")) return "tr";
  return "sv";
}

export function campaignText(value, lang = DEFAULT_LANG) {
  const normalized = normalizeCampaignLang(lang);

  if (value && typeof value === "object") {
    return String(value[normalized] || value.sv || value.en || value.tr || "");
  }

  return String(value || "");
}

function localizedText(value, fallback = {}) {
  if (value && typeof value === "object") {
    return {
      sv: String(value.sv || fallback.sv || value.en || value.tr || ""),
      en: String(value.en || fallback.en || value.sv || value.tr || ""),
      tr: String(value.tr || fallback.tr || value.sv || value.en || ""),
    };
  }

  const str = String(value || "");
  return {
    sv: String(fallback.sv || str),
    en: String(fallback.en || str),
    tr: String(fallback.tr || str),
  };
}

function withDefaults(c) {
  const key = String(c?.key || c?.id || "standard").trim();

  const label = localizedText(c?.label, {
    sv: "Calestra Campaign",
    en: "Calestra Campaign",
    tr: "Calestra Campaign",
  });

  const shortLabel = localizedText(c?.shortLabel, label);
  const fomo = localizedText(c?.fomo);
  const badge = localizedText(c?.badge);
  const description = localizedText(c?.description);
  const discountHint = localizedText(c?.discountHint);
  const vipHint = localizedText(c?.vipHint);
  const storeBanner = localizedText(c?.storeBanner, label);

  return {
    id: String(c?.id || key),
    key,

    label: label.sv,
    shortLabel: shortLabel.sv,
    fomo: fomo.sv,
    badge: badge.sv,
    description: description.sv,
    discountHint: discountHint.sv,
    vipHint: vipHint.sv,
    storeBanner: storeBanner.sv,

    text: {
      label,
      shortLabel,
      fomo,
      badge,
      description,
      discountHint,
      vipHint,
      storeBanner,
    },

    themeKey: String(c?.themeKey || key),
    seasonGroup: String(c?.seasonGroup || "evergreen"),
    from: c?.from || null,
    to: c?.to || null,
    wrapsYear: !!c?.wrapsYear,
    priority: Number(c?.priority || 0),
    activeByDefault: c?.activeByDefault !== false,
  };
}

export function localizeCampaign(campaign, lang = DEFAULT_LANG) {
  if (!campaign) return campaign;

  const next = clone(campaign);
  const text = next.text || {};

  next.label = campaignText(text.label || next.label, lang);
  next.shortLabel = campaignText(text.shortLabel || next.shortLabel, lang);
  next.fomo = campaignText(text.fomo || next.fomo, lang);
  next.badge = campaignText(text.badge || next.badge, lang);
  next.description = campaignText(text.description || next.description, lang);
  next.discountHint = campaignText(text.discountHint || next.discountHint, lang);
  next.vipHint = campaignText(text.vipHint || next.vipHint, lang);
  next.storeBanner = campaignText(text.storeBanner || next.storeBanner, lang);

  return next;
}

export const CAMPAIGNS = [
  withDefaults({
    id: "jan-refresh",
    key: "jan-refresh",
    label: {
      sv: "New Year Refresh",
      en: "New Year Refresh",
      tr: "New Year Refresh",
    },
    shortLabel: {
      sv: "Nyårsspecial",
      en: "New Year",
      tr: "Yeni Yıl",
    },
    fomo: {
      sv: "Nytt år, nya stjärnor – upptäck årets första drop.",
      en: "New year, new stars — discover the first drop of the year.",
      tr: "Yeni yıl, yeni yıldızlar — yılın ilk drop’unu keşfet.",
    },
    badge: {
      sv: "Ny start",
      en: "New start",
      tr: "Yeni başlangıç",
    },
    themeKey: "jan",
    seasonGroup: "winter",
    description: {
      sv: "Lugn nystart med lättare förnyelsekänsla i butiken.",
      en: "A calm new beginning with a lighter sense of renewal in the store.",
      tr: "Mağazada daha hafif bir yenilenme hissiyle sakin bir yeni başlangıç.",
    },
    discountHint: {
      sv: "Lätta nyårsbenefits, bundle-känsla och mjuk start.",
      en: "Light New Year benefits, bundle feeling, and a soft start.",
      tr: "Hafif yeni yıl avantajları, bundle hissi ve yumuşak başlangıç.",
    },
    vipHint: {
      sv: "Bra period för att lyfta medlemskap utan tung rabattpress.",
      en: "A good period to highlight membership without heavy discount pressure.",
      tr: "Ağır indirim baskısı olmadan üyeliği öne çıkarmak için iyi dönem.",
    },
    storeBanner: {
      sv: "Ny start, ny känsla, nya stjärnor.",
      en: "New start, new feeling, new stars.",
      tr: "Yeni başlangıç, yeni his, yeni yıldızlar.",
    },
    from: { month: 1, day: 1 },
    to: { month: 1, day: 14 },
    priority: 10,
  }),

  withDefaults({
    id: "valentines",
    key: "valentine",
    label: {
      sv: "Calestra Amoré",
      en: "Calestra Amoré",
      tr: "Calestra Amoré",
    },
    shortLabel: {
      sv: "Alla hjärtans",
      en: "Valentine’s",
      tr: "Sevgililer",
    },
    fomo: {
      sv: "Ge bort en känsla, inte bara en sak – Valentines-kollektionen live.",
      en: "Give a feeling, not just a thing — the Valentine’s collection is live.",
      tr: "Sadece bir eşya değil, bir his hediye et — Sevgililer koleksiyonu yayında.",
    },
    badge: {
      sv: "Kärlek",
      en: "Love",
      tr: "Aşk",
    },
    themeKey: "valentine",
    seasonGroup: "romance",
    description: {
      sv: "Kärlek, gåvor, mjuka budskap och emotionell styling.",
      en: "Love, gifts, soft messages, and emotional styling.",
      tr: "Aşk, hediyeler, yumuşak mesajlar ve duygusal stil.",
    },
    discountHint: {
      sv: "Gåvobundles, parpaket och mjuk premiumrabatt.",
      en: "Gift bundles, couple packs, and soft premium discounts.",
      tr: "Hediye bundle’ları, çift paketleri ve yumuşak premium indirim.",
    },
    vipHint: {
      sv: "Aurora/Celestial kan få early access till utvalda presentpaket.",
      en: "Aurora/Celestial can receive early access to selected gift packs.",
      tr: "Aurora/Celestial seçili hediye paketlerine erken erişim alabilir.",
    },
    storeBanner: {
      sv: "Kärlek, värme och små magiska gåvor.",
      en: "Love, warmth, and small magical gifts.",
      tr: "Aşk, sıcaklık ve küçük büyülü hediyeler.",
    },
    from: { month: 2, day: 7 },
    to: { month: 2, day: 15 },
    priority: 20,
  }),

  withDefaults({
    id: "ramadan",
    key: "ramadan",
    label: {
      sv: "Ramadan Lights",
      en: "Ramadan Lights",
      tr: "Ramadan Lights",
    },
    shortLabel: {
      sv: "Ramadan",
      en: "Ramadan",
      tr: "Ramazan",
    },
    fomo: {
      sv: "Mjuk belysning, stillhet och små gåvor för kvällarna.",
      en: "Soft lights, stillness, and small gifts for the evenings.",
      tr: "Akşamlar için yumuşak ışıklar, dinginlik ve küçük hediyeler.",
    },
    badge: {
      sv: "Ramadan",
      en: "Ramadan",
      tr: "Ramazan",
    },
    themeKey: "ramadan",
    seasonGroup: "calm",
    description: {
      sv: "Respektfull, varm och stillsam kampanjperiod.",
      en: "A respectful, warm, and calm campaign period.",
      tr: "Saygılı, sıcak ve sakin bir kampanya dönemi.",
    },
    discountHint: {
      sv: "Mjuka kvällserbjudanden, gåvospår och stilla premiumkänsla.",
      en: "Soft evening offers, gift paths, and a calm premium feeling.",
      tr: "Yumuşak akşam teklifleri, hediye akışı ve sakin premium hissi.",
    },
    vipHint: {
      sv: "VIP kan få stilla early access eller fri frakt på utvalda gåvor.",
      en: "VIP can receive calm early access or free shipping on selected gifts.",
      tr: "VIP seçili hediyelerde sakin erken erişim veya ücretsiz kargo alabilir.",
    },
    storeBanner: {
      sv: "Mjuk belysning, stillhet och små gåvor för kvällarna.",
      en: "Soft lights, stillness, and small gifts for the evenings.",
      tr: "Akşamlar için yumuşak ışıklar, dinginlik ve küçük hediyeler.",
    },
    from: { month: 3, day: 1 },
    to: { month: 4, day: 15 },
    priority: 30,
  }),

  withDefaults({
    id: "eid",
    key: "eid",
    label: {
      sv: "Eid Celebration",
      en: "Eid Celebration",
      tr: "Eid Celebration",
    },
    shortLabel: {
      sv: "Eid",
      en: "Eid",
      tr: "Bayram",
    },
    fomo: {
      sv: "Fira med något litet men minnesvärt – Eid-special från Calestra.",
      en: "Celebrate with something small but memorable — an Eid special from Calestra.",
      tr: "Küçük ama unutulmaz bir şeyle kutla — Calestra’dan Bayram özel seçkisi.",
    },
    badge: {
      sv: "Eid",
      en: "Eid",
      tr: "Bayram",
    },
    themeKey: "eid",
    seasonGroup: "joy",
    description: {
      sv: "Ljusare, gladare och mer celebratory känsla direkt efter Ramadan.",
      en: "A brighter, happier, and more celebratory feeling right after Ramadan.",
      tr: "Ramazan’dan hemen sonra daha aydınlık, neşeli ve kutlama hissi.",
    },
    discountHint: {
      sv: "Kort, tydlig och varm kampanj med presentfokus.",
      en: "A short, clear, and warm campaign with a gift focus.",
      tr: "Hediye odaklı, kısa, net ve sıcak bir kampanya.",
    },
    vipHint: {
      sv: "Bra tid för VIP-presentförmån eller fri frakt-tröskel.",
      en: "A good time for VIP gift benefits or a free-shipping threshold.",
      tr: "VIP hediye avantajı veya ücretsiz kargo eşiği için iyi dönem.",
    },
    storeBanner: {
      sv: "Eid-ljus över Calestra.",
      en: "Eid lights over Calestra.",
      tr: "Calestra üzerinde Bayram ışıkları.",
    },
    from: { month: 4, day: 16 },
    to: { month: 4, day: 25 },
    priority: 40,
  }),

  withDefaults({
    id: "summer",
    key: "summer",
    label: {
      sv: "Calestra Travel Light",
      en: "Calestra Travel Light",
      tr: "Calestra Travel Light",
    },
    shortLabel: {
      sv: "Sommar",
      en: "Summer",
      tr: "Yaz",
    },
    fomo: {
      sv: "Res lätt, res magiskt – Travel Light-kollektionen är öppen.",
      en: "Travel light, travel magically — the Travel Light collection is open.",
      tr: "Hafif seyahat et, büyülü seyahat et — Travel Light koleksiyonu açık.",
    },
    badge: {
      sv: "Sommar",
      en: "Summer",
      tr: "Yaz",
    },
    themeKey: "summer",
    seasonGroup: "travel",
    description: {
      sv: "Resa, ljushet, enkelhet och lättare sortiment.",
      en: "Travel, lightness, simplicity, and a lighter assortment.",
      tr: "Seyahat, hafiflik, sadelik ve daha hafif bir ürün seçimi.",
    },
    discountHint: {
      sv: "Travel bundles, summer kits, lätt fri-frakt-push.",
      en: "Travel bundles, summer kits, and a light free-shipping push.",
      tr: "Travel bundle’ları, yaz kitleri ve hafif ücretsiz kargo vurgusu.",
    },
    vipHint: {
      sv: "VIP kan få early access till limited travel pieces.",
      en: "VIP can receive early access to limited travel pieces.",
      tr: "VIP sınırlı travel parçalarına erken erişim alabilir.",
    },
    storeBanner: {
      sv: "Res lätt, res magiskt.",
      en: "Travel light, travel magically.",
      tr: "Hafif seyahat et, büyülü seyahat et.",
    },
    from: { month: 6, day: 1 },
    to: { month: 8, day: 15 },
    priority: 5,
  }),

  withDefaults({
    id: "black-week",
    key: "blackweek",
    label: {
      sv: "Black Week",
      en: "Black Week",
      tr: "Black Week",
    },
    shortLabel: {
      sv: "Black Week",
      en: "Black Week",
      tr: "Black Week",
    },
    fomo: {
      sv: "Begränsade stjärnpriser – när de är slut är de slut.",
      en: "Limited star prices — when they are gone, they are gone.",
      tr: "Sınırlı yıldız fiyatları — bittiğinde gerçekten biter.",
    },
    badge: {
      sv: "FOMO",
      en: "FOMO",
      tr: "FOMO",
    },
    themeKey: "blackweek",
    seasonGroup: "peak-sale",
    description: {
      sv: "Butikens mest tydliga FOMO-fönster.",
      en: "The store’s clearest FOMO window.",
      tr: "Mağazanın en net FOMO dönemi.",
    },
    discountHint: {
      sv: "Hårdast kampanjtryck, limitade priser och snabb rörelse.",
      en: "The strongest campaign pressure, limited prices, and fast movement.",
      tr: "En güçlü kampanya baskısı, sınırlı fiyatlar ve hızlı hareket.",
    },
    vipHint: {
      sv: "VIP kan få tidig access innan öppet släpp.",
      en: "VIP can receive early access before the public release.",
      tr: "VIP herkese açık lansmandan önce erken erişim alabilir.",
    },
    storeBanner: {
      sv: "Begränsade stjärnpriser – missa inte nästa.",
      en: "Limited star prices — do not miss the next one.",
      tr: "Sınırlı yıldız fiyatları — sıradakini kaçırma.",
    },
    from: { month: 11, day: 20 },
    to: { month: 11, day: 30 },
    priority: 90,
  }),

  withDefaults({
    id: "xmas",
    key: "xmas",
    label: {
      sv: "Calestra Winter Lights",
      en: "Calestra Winter Lights",
      tr: "Calestra Winter Lights",
    },
    shortLabel: {
      sv: "Jul",
      en: "Christmas",
      tr: "Yılbaşı",
    },
    fomo: {
      sv: "Magiska jul-drop – hitta den där lilla gåvan som faktiskt känns.",
      en: "Magical Christmas drops — find the small gift that truly feels meaningful.",
      tr: "Büyülü yılbaşı drop’ları — gerçekten hissettiren küçük hediyeyi bul.",
    },
    badge: {
      sv: "Jul",
      en: "Christmas",
      tr: "Yılbaşı",
    },
    themeKey: "xmas",
    seasonGroup: "winter-holiday",
    description: {
      sv: "Varm, känslosam och gåvofokuserad julmiljö.",
      en: "A warm, emotional, and gift-focused Christmas environment.",
      tr: "Sıcak, duygusal ve hediye odaklı yılbaşı atmosferi.",
    },
    discountHint: {
      sv: "Gift guides, bundlelogik, presentfokus och öppet-köp-ton.",
      en: "Gift guides, bundle logic, present focus, and open-purchase tone.",
      tr: "Hediye rehberleri, bundle mantığı, hediye odağı ve esnek alışveriş tonu.",
    },
    vipHint: {
      sv: "VIP kan få jul-drop-förhandsvisning eller expressförmån.",
      en: "VIP can receive Christmas drop previews or express benefits.",
      tr: "VIP yılbaşı drop ön izlemesi veya express avantaj alabilir.",
    },
    storeBanner: {
      sv: "Magiska jul-drop med känsla.",
      en: "Magical Christmas drops with feeling.",
      tr: "Duygulu büyülü yılbaşı drop’ları.",
    },
    from: { month: 12, day: 1 },
    to: { month: 12, day: 26 },
    priority: 100,
  }),

  withDefaults({
    id: "newyear",
    key: "newyear",
    label: {
      sv: "New Year Spark",
      en: "New Year Spark",
      tr: "New Year Spark",
    },
    shortLabel: {
      sv: "Nyår",
      en: "New Year",
      tr: "Yeni Yıl",
    },
    fomo: {
      sv: "Avsluta året med ett löfte till dig själv – eller någon du tycker om.",
      en: "End the year with a promise to yourself — or someone you care about.",
      tr: "Yılı kendine — ya da değer verdiğin birine — verilen bir sözle kapat.",
    },
    badge: {
      sv: "Nyår",
      en: "New Year",
      tr: "Yeni Yıl",
    },
    themeKey: "newyear",
    seasonGroup: "year-end",
    description: {
      sv: "Årsskifte, reflektion och kort intensitetskampanj.",
      en: "Year-end, reflection, and a short high-intensity campaign.",
      tr: "Yıl sonu, düşünme ve kısa yoğun kampanya.",
    },
    discountHint: {
      sv: "Årsslut, self-gift, limited linger och efterhögtidssläpp.",
      en: "Year-end, self-gift, limited linger, and post-holiday releases.",
      tr: "Yıl sonu, kendine hediye, sınırlı süre ve bayram sonrası çıkışlar.",
    },
    vipHint: {
      sv: "Bra läge för premiumuppgradering inför nytt år.",
      en: "A good moment for premium upgrades before the new year.",
      tr: "Yeni yıl öncesi premium yükseltme için iyi zaman.",
    },
    storeBanner: {
      sv: "Avsluta året med ett löfte till dig själv.",
      en: "End the year with a promise to yourself.",
      tr: "Yılı kendine verdiğin bir sözle kapat.",
    },
    from: { month: 12, day: 27 },
    to: { month: 1, day: 3 },
    wrapsYear: true,
    priority: 95,
  }),
];

export const STANDARD_CAMPAIGN = withDefaults({
  id: "standard",
  key: "standard",
  label: {
    sv: "Calestra Standard",
    en: "Calestra Standard",
    tr: "Calestra Standard",
  },
  shortLabel: {
    sv: "Standard",
    en: "Standard",
    tr: "Standart",
  },
  fomo: {
    sv: "Founder’s Drop – limited!",
    en: "Founder’s Drop — limited!",
    tr: "Founder’s Drop — sınırlı!",
  },
  badge: {
    sv: "Året runt",
    en: "All Year",
    tr: "Tüm yıl",
  },
  themeKey: "standard",
  seasonGroup: "evergreen",
  description: {
    sv: "Basläge när ingen tidsstyrd kampanj är aktiv.",
    en: "Base mode when no time-based campaign is active.",
    tr: "Zaman kontrollü kampanya aktif olmadığında temel mod.",
  },
  discountHint: {
    sv: "Låt vardagskampanjer vara små och kontrollerade.",
    en: "Keep everyday campaigns small and controlled.",
    tr: "Günlük kampanyaları küçük ve kontrollü tut.",
  },
  vipHint: {
    sv: "Bra läge för att bygga VIP-känsla utan hård reapress.",
    en: "A good mode for building VIP feeling without heavy sale pressure.",
    tr: "Ağır indirim baskısı olmadan VIP hissi oluşturmak için iyi mod.",
  },
  storeBanner: {
    sv: "Magiska upplevelser, byggda med hjärta.",
    en: "Magical experiences, built with heart.",
    tr: "Kalple inşa edilen büyülü deneyimler.",
  },
  priority: 0,
});

function isCampaignActive(campaign, date) {
  if (!campaign?.from || !campaign?.to) return false;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  const fromMonth = campaign.from.month;
  const fromDay = campaign.from.day;
  const toMonth = campaign.to.month;
  const toDay = campaign.to.day;

  const wraps =
    campaign.wrapsYear ||
    fromMonth > toMonth ||
    (fromMonth === toMonth && fromDay > toDay);

  if (!wraps) {
    if (month < fromMonth || month > toMonth) return false;
    if (month === fromMonth && day < fromDay) return false;
    if (month === toMonth && day > toDay) return false;
    return true;
  }

  const afterFrom = month > fromMonth || (month === fromMonth && day >= fromDay);
  const beforeTo = month < toMonth || (month === toMonth && day <= toDay);

  return afterFrom || beforeTo;
}

function readCookie(name) {
  if (typeof document === "undefined") return null;

  try {
    const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function writeCookie(name, value, options = {}) {
  if (typeof document === "undefined") return;

  const {
    days = 30,
    path = "/",
    domain = "",
    sameSite = "Lax",
    secure = typeof window !== "undefined" && window.location.protocol === "https:",
  } = options;

  const expires = new Date(Date.now() + days * 86400000).toUTCString();

  let cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=${sameSite}`;
  if (domain) cookie += `; domain=${domain}`;
  if (secure) cookie += "; Secure";

  document.cookie = cookie;
}

function deleteCookie(name, options = {}) {
  if (typeof document === "undefined") return;

  const {
    path = "/",
    domain = "",
    sameSite = "Lax",
    secure = typeof window !== "undefined" && window.location.protocol === "https:",
  } = options;

  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=${sameSite}`;
  if (domain) cookie += `; domain=${domain}`;
  if (secure) cookie += "; Secure";

  document.cookie = cookie;
}

function resolveSharedCookieDomain() {
  if (typeof window === "undefined") return "";

  const host = String(window.location.hostname || "");
  if (!host) return "";

  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "";
  }

  const parts = host.split(".");
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join(".")}`;
  }

  return "";
}

export function getAllCampaigns(lang) {
  const list = CAMPAIGNS.map((c) => clone(c));
  return lang ? list.map((c) => localizeCampaign(c, lang)) : list;
}

export function getCampaignById(id, lang) {
  const key = String(id || "").trim().toLowerCase();
  if (!key) return null;

  const found =
    CAMPAIGNS.find((c) => c.id.toLowerCase() === key || c.key.toLowerCase() === key) || null;

  if (!found) return null;
  return lang ? localizeCampaign(found, lang) : found;
}

export function getCampaignCalendar(lang) {
  return getAllCampaigns(lang).sort(sortByPriorityDesc);
}

export function getOverrideId() {
  const cookieValue = readCookie(CAMPAIGN_OVERRIDE_COOKIE);
  if (cookieValue) return cookieValue;

  if (typeof window === "undefined") return null;

  try {
    const lsValue = window.localStorage.getItem(CAMPAIGN_OVERRIDE_LS_KEY);
    return lsValue || null;
  } catch {
    return null;
  }
}

export function setCampaignOverride(id) {
  if (typeof window === "undefined") return;

  const value = String(id || "").trim();
  const domain = resolveSharedCookieDomain();

  try {
    if (value) {
      window.localStorage.setItem(CAMPAIGN_OVERRIDE_LS_KEY, value);
      writeCookie(CAMPAIGN_OVERRIDE_COOKIE, value, { domain });
    } else {
      window.localStorage.removeItem(CAMPAIGN_OVERRIDE_LS_KEY);
      deleteCookie(CAMPAIGN_OVERRIDE_COOKIE, { domain });
    }
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(
      new CustomEvent(CAMPAIGN_OVERRIDE_EVENT, {
        detail: { value: value || null },
      })
    );
  } catch {
    // ignore
  }
}

export function clearCampaignOverride() {
  setCampaignOverride("");
}

export function getAutoCampaign(now = new Date(), lang) {
  const active = CAMPAIGNS.filter((campaign) => isCampaignActive(campaign, now));
  if (!active.length) return null;

  const found = [...active].sort(sortByPriorityDesc)[0] || null;
  return lang && found ? localizeCampaign(found, lang) : found;
}

export function getActiveCampaign(now = new Date(), lang) {
  const overrideId = getOverrideId();

  if (overrideId === "none") {
    return lang ? localizeCampaign(STANDARD_CAMPAIGN, lang) : STANDARD_CAMPAIGN;
  }

  if (overrideId) {
    const forced = getCampaignById(overrideId, lang);
    if (forced) return forced;
  }

  return getAutoCampaign(now, lang) || (lang ? localizeCampaign(STANDARD_CAMPAIGN, lang) : STANDARD_CAMPAIGN);
}