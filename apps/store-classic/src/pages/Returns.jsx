D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Returns.jsx
// apps/store-classic/src/pages/static/Returns.jsx

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Page, Section, QA } from "./_helpers.jsx";

function getShortLang(i18n) {
  return String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();
}

function pickLang(i18n, values = {}) {
  const lang = getShortLang(i18n);
  return values[lang] || values.sv || values.en || values.tr || "";
}

export default function Returns() {
  const { i18n } = useTranslation();

  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString(i18n.language || "sv", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [i18n.language]
  );

  const pageTitle = pickLang(i18n, {
    sv: "Returer & Reklamationer",
    en: "Returns & Claims",
    tr: "İade ve Reklamasyon",
  });

  const updatedAt = pickLang(i18n, {
    sv: `Senast uppdaterad: ${dateStr}`,
    en: `Last updated: ${dateStr}`,
    tr: `Son güncelleme: ${dateStr}`,
  });

  const intro = pickLang(i18n, {
    sv:
      "Calestra-produkter tillverkas normalt på beställning. Därför fungerar returer annorlunda än i en vanlig lagerbutik. Kunden kontaktar alltid Calestra först, och om något är fel hjälper vi dig på ett tryggt och strukturerat sätt.",
    en:
      "Calestra products are normally made to order. This means returns work differently from a traditional stock-based store. Customers should always contact Calestra first, and if something is wrong, we will help in a safe and structured way.",
    tr:
      "Calestra ürünleri genellikle sipariş üzerine üretilir. Bu nedenle iadeler klasik stoklu mağazalardan farklı işler. Müşteri her zaman önce Calestra ile iletişime geçmelidir; üründe bir sorun varsa güvenli ve düzenli şekilde yardımcı oluruz.",
  });

  const fallbackSections = [
    {
      title: pickLang(i18n, {
        sv: "Tillverkning på beställning",
        en: "Made to order",
        tr: "Sipariş üzerine üretim",
      }),
      body: pickLang(i18n, {
        sv:
          "De flesta produkter från Calestra produceras först efter att en beställning har lagts. Det betyder att varan skapas särskilt för ordern och inte tas från ett färdigt lager. Det gör produktionen mer medveten och minskar onödigt svinn.",
        en:
          "Most Calestra products are produced only after an order has been placed. This means the item is created specifically for the order and is not taken from existing stock. This makes production more intentional and reduces unnecessary waste.",
        tr:
          "Calestra ürünlerinin çoğu, sipariş verildikten sonra üretilir. Bu, ürünün hazır stoktan alınmadığı, siparişe özel üretildiği anlamına gelir. Bu üretimi daha bilinçli hale getirir ve gereksiz israfı azaltır.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Returer vid ångrat köp",
        en: "Returns for changed mind",
        tr: "Fikir değişikliği nedeniyle iade",
      }),
      body: pickLang(i18n, {
        sv:
          "Eftersom produkterna normalt tillverkas på beställning kan vi vanligtvis inte erbjuda retur eller byte vid ångrat köp, fel vald storlek, fel färgval eller liknande när produktionen har påbörjats. Kontrollera därför produkt, storlek, färg och leveransuppgifter noggrant innan du slutför din beställning.",
        en:
          "Because products are normally made to order, we usually cannot offer returns or exchanges for changed mind, incorrect size selection, incorrect color choice, or similar reasons once production has started. Please check the product, size, color, and delivery details carefully before completing your order.",
        tr:
          "Ürünler genellikle sipariş üzerine üretildiği için üretim başladıktan sonra fikir değişikliği, yanlış beden seçimi, yanlış renk seçimi veya benzeri nedenlerle iade ya da değişim genellikle sunamayız. Siparişi tamamlamadan önce ürün, beden, renk ve teslimat bilgilerini dikkatlice kontrol edin.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Kunden kontaktar alltid Calestra först",
        en: "Always contact Calestra first",
        tr: "Her zaman önce Calestra ile iletişime geçin",
      }),
      body: pickLang(i18n, {
        sv:
          "Om du vill rapportera ett problem med din order ska du alltid kontakta Calestra först. Skicka inte tillbaka produkter på egen hand. Returadress, fraktsedel eller annan returhantering ges endast efter skriftlig instruktion från Calestra.",
        en:
          "If you want to report an issue with your order, you should always contact Calestra first. Do not send products back on your own. A return address, shipping label, or any return handling instructions will only be provided after written instructions from Calestra.",
        tr:
          "Siparişinizle ilgili bir sorunu bildirmek istiyorsanız her zaman önce Calestra ile iletişime geçmelisiniz. Ürünleri kendi başınıza geri göndermeyin. İade adresi, kargo etiketi veya başka iade talimatları yalnızca Calestra’nın yazılı yönlendirmesinden sonra verilir.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Reklamationer hanteras via Calestra och vår produktionspartner",
        en: "Claims are handled through Calestra and our production partner",
        tr: "Reklamasyonlar Calestra ve üretim ortağımız üzerinden yönetilir",
      }),
      body: pickLang(i18n, {
        sv:
          "Om en produkt är skadad, feltryckt, defekt eller tydligt inte stämmer med din beställning granskar Calestra ärendet först. Vid behov skickar vi därefter ärendet vidare till vår produktionspartner för bedömning. Kunden ska inte kontakta produktionspartnern direkt, eftersom Calestra ansvarar för kundkontakten.",
        en:
          "If a product is damaged, misprinted, defective, or clearly does not match your order, Calestra will review the case first. If needed, we will then forward the case to our production partner for assessment. Customers should not contact the production partner directly, as Calestra handles the customer relationship.",
        tr:
          "Ürün hasarlı, hatalı baskılı, kusurlu ya da siparişinizle açıkça uyumsuzsa Calestra durumu önce kendisi inceler. Gerekirse dosyayı değerlendirme için üretim ortağımıza iletiriz. Müşteri üretim ortağıyla doğrudan iletişime geçmemelidir; müşteri iletişimini Calestra yürütür.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Bildbevis krävs vid reklamation",
        en: "Photo evidence is required for claims",
        tr: "Reklamasyon için fotoğraf kanıtı gerekir",
      }),
      body: pickLang(i18n, {
        sv:
          "För att kunna bedöma en reklamation behöver vi tydliga bilder som visar problemet. Skicka foto på hela produkten, närbild på felet, eventuell förpackning och orderuppgifter. Utan tillräckligt underlag kan vi inte godkänna omtryck, ersättningsvara, returhantering eller återbetalning.",
        en:
          "To review a claim, we need clear photos showing the issue. Please include a photo of the full product, a close-up of the defect, any packaging, and the order details. Without sufficient evidence, we cannot approve a reprint, replacement item, return handling, or refund.",
        tr:
          "Bir reklamasyonu değerlendirebilmemiz için sorunu gösteren net fotoğraflara ihtiyacımız vardır. Lütfen ürünün tamamının fotoğrafını, hatanın yakın çekimini, varsa ambalajı ve sipariş bilgilerini gönderin. Yeterli kanıt olmadan yeniden üretim, değişim ürünü, iade süreci veya para iadesi onaylanamaz.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Retur eller fraktsedel endast efter instruktion",
        en: "Return or shipping label only after instructions",
        tr: "İade veya kargo etiketi yalnızca talimat sonrası",
      }),
      body: pickLang(i18n, {
        sv:
          "I många reklamationsärenden räcker bildbevis och produkten behöver normalt inte skickas tillbaka. Om fysisk retur ändå krävs får du särskilda instruktioner från Calestra. I vissa fall kan fraktsedel eller returadress avse vår produktionspartner, men detta gäller endast när Calestra uttryckligen har bekräftat det skriftligt.",
        en:
          "In many claim cases, photo evidence is enough and the product normally does not need to be returned. If a physical return is required, you will receive specific instructions from Calestra. In some cases, the shipping label or return address may refer to our production partner, but only when Calestra has explicitly confirmed this in writing.",
        tr:
          "Birçok reklamasyon durumunda fotoğraf kanıtı yeterlidir ve ürünün genellikle geri gönderilmesi gerekmez. Fiziksel iade gerekiyorsa Calestra size özel talimat verir. Bazı durumlarda kargo etiketi veya iade adresi üretim ortağımıza ait olabilir, ancak bu yalnızca Calestra’nın yazılı olarak açıkça onaylaması halinde geçerlidir.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Returkostnad",
        en: "Return shipping cost",
        tr: "İade kargo ücreti",
      }),
      body: pickLang(i18n, {
        sv:
          "Vid godkänd reklamation som beror på skada, feltryck, defekt eller fel produkt hanteras lösningen enligt Calestras instruktioner. Kunden ska inte betala eller boka returfrakt utan instruktion från oss. Om Calestra i ett särskilt undantagsfall godkänner en retur av annan anledning, kan kunden behöva stå för returfrakten.",
        en:
          "For an approved claim caused by damage, misprint, defect, or the wrong product, the solution is handled according to Calestra’s instructions. Customers should not pay for or book return shipping without instructions from us. If Calestra, in a special exception, approves a return for another reason, the customer may need to cover the return shipping cost.",
        tr:
          "Hasar, hatalı baskı, kusur veya yanlış ürün nedeniyle onaylanan bir reklamasyonda çözüm Calestra’nın talimatlarına göre yürütülür. Müşteri bizden talimat almadan iade kargosu ödememeli veya kargo ayarlamamalıdır. Calestra özel bir istisna olarak başka bir nedenle iadeyi kabul ederse, iade kargo ücreti müşteriye ait olabilir.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Så kontaktar du oss",
        en: "How to contact us",
        tr: "Bize nasıl ulaşırsınız",
      }),
      body: pickLang(i18n, {
        sv:
          "Kontakta oss så snart som möjligt via support@calestra.com. Skriv ditt ordernummer, en kort beskrivning av problemet och bifoga tydliga bilder. Ju tydligare underlag vi får, desto snabbare kan vi hjälpa dig.",
        en:
          "Contact us as soon as possible at support@calestra.com. Include your order number, a short description of the issue, and clear photos. The clearer the information, the faster we can help you.",
        tr:
          "Mümkün olan en kısa sürede support@calestra.com üzerinden bizimle iletişime geçin. Sipariş numaranızı, sorunun kısa açıklamasını ve net fotoğrafları ekleyin. Bilgiler ne kadar net olursa size o kadar hızlı yardımcı olabiliriz.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Tidsram för reklamation",
        en: "Claim timeframe",
        tr: "Reklamasyon süresi",
      }),
      body: pickLang(i18n, {
        sv:
          "Kontakta oss så snart som möjligt efter att du upptäckt felet. För att vi ska kunna hantera ärendet effektivt med vår produktionspartner bör reklamation med bildbevis skickas in inom 30 dagar från mottagen leverans.",
        en:
          "Please contact us as soon as possible after discovering the issue. To help us handle the case efficiently with our production partner, claims with photo evidence should be submitted within 30 days of receiving the delivery.",
        tr:
          "Sorunu fark ettikten sonra mümkün olan en kısa sürede bizimle iletişime geçin. Üretim ortağımızla süreci verimli şekilde yürütebilmemiz için fotoğraf kanıtlı reklamasyonlar teslimattan itibaren 30 gün içinde gönderilmelidir.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Möjliga lösningar",
        en: "Possible solutions",
        tr: "Olası çözümler",
      }),
      body: pickLang(i18n, {
        sv:
          "Efter granskning kan Calestra erbjuda omtryck, ersättningsvara, annan rimlig lösning eller återbetalning. Vilken lösning som används beror på felets typ, orderns status, produktionspartnerns bedömning och vilket underlag som finns.",
        en:
          "After review, Calestra may offer a reprint, replacement item, another reasonable solution, or a refund. The solution depends on the type of issue, the order status, the production partner’s assessment, and the evidence provided.",
        tr:
          "İnceleme sonrası Calestra yeniden üretim, değişim ürünü, başka makul bir çözüm veya para iadesi sunabilir. Hangi çözümün uygulanacağı sorunun türüne, sipariş durumuna, üretim ortağının değerlendirmesine ve sunulan kanıtlara bağlıdır.",
      }),
    },
    {
      title: pickLang(i18n, {
        sv: "Avbokning innan produktion",
        en: "Cancellation before production",
        tr: "Üretim başlamadan iptal",
      }),
      body: pickLang(i18n, {
        sv:
          "Om produktionen ännu inte har startat kan vi ibland hjälpa till att stoppa ordern. Kontakta oss direkt om du upptäcker ett fel i din beställning. När produktionen har startat kan ordern normalt inte avbrytas.",
        en:
          "If production has not yet started, we may sometimes be able to stop the order. Contact us immediately if you notice an issue with your order. Once production has started, the order can normally no longer be cancelled.",
        tr:
          "Üretim henüz başlamadıysa bazı durumlarda siparişi durdurabiliriz. Siparişinizde bir hata fark ederseniz hemen bizimle iletişime geçin. Üretim başladıktan sonra sipariş genellikle iptal edilemez.",
      }),
    },
  ];

  const fallbackFaq = [
    {
      q: pickLang(i18n, {
        sv: "Kan jag returnera en produkt om jag ångrar mig?",
        en: "Can I return a product if I change my mind?",
        tr: "Fikrimi değiştirirsem ürünü iade edebilir miyim?",
      }),
      a: pickLang(i18n, {
        sv:
          "Normalt nej, eftersom produkten tillverkas på beställning. Vi rekommenderar att du kontrollerar storlek, färg, produkt och leveransuppgifter noggrant innan du beställer.",
        en:
          "Normally no, because the product is made to order. We recommend checking size, color, product, and delivery details carefully before ordering.",
        tr:
          "Genellikle hayır, çünkü ürün sipariş üzerine üretilir. Sipariş vermeden önce beden, renk, ürün ve teslimat bilgilerini dikkatlice kontrol etmenizi öneririz.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Kan jag byta storlek?",
        en: "Can I exchange for another size?",
        tr: "Başka bedenle değişim yapabilir miyim?",
      }),
      a: pickLang(i18n, {
        sv:
          "Normalt kan vi inte erbjuda storleksbyte efter att produktionen har påbörjats. Använd storleksguiden och jämför gärna med ett plagg du redan äger innan beställning.",
        en:
          "Normally we cannot offer size exchanges after production has started. Please use the size guide and compare it with a garment you already own before ordering.",
        tr:
          "Üretim başladıktan sonra genellikle beden değişimi sunamayız. Sipariş vermeden önce beden rehberini kullanın ve sahip olduğunuz bir ürünle karşılaştırın.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Vad händer om produkten är skadad eller feltryckt?",
        en: "What happens if the product is damaged or misprinted?",
        tr: "Ürün hasarlı veya hatalı baskılıysa ne olur?",
      }),
      a: pickLang(i18n, {
        sv:
          "Kontakta Calestra med ordernummer, beskrivning och tydliga bilder. Vi granskar ärendet och skickar det vid behov vidare till vår produktionspartner. Efter bedömning kan lösningen bli omtryck, ersättningsvara, annan rimlig lösning eller återbetalning.",
        en:
          "Contact Calestra with your order number, a description, and clear photos. We will review the case and, if needed, forward it to our production partner. After assessment, the solution may be a reprint, replacement item, another reasonable solution, or a refund.",
        tr:
          "Sipariş numaranız, açıklama ve net fotoğraflarla Calestra ile iletişime geçin. Durumu inceleriz ve gerekirse üretim ortağımıza iletiriz. Değerlendirme sonrası çözüm yeniden üretim, değişim ürünü, başka makul bir çözüm veya para iadesi olabilir.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Ska jag skicka tillbaka produkten direkt?",
        en: "Should I send the product back immediately?",
        tr: "Ürünü hemen geri göndermeli miyim?",
      }),
      a: pickLang(i18n, {
        sv:
          "Nej. Skicka aldrig tillbaka produkten utan skriftlig instruktion från Calestra. I många reklamationsärenden räcker bilder. Om retur behövs får du tydliga instruktioner och eventuell fraktsedel.",
        en:
          "No. Never send the product back without written instructions from Calestra. In many claim cases, photos are enough. If a return is needed, you will receive clear instructions and, when applicable, a shipping label.",
        tr:
          "Hayır. Calestra’dan yazılı talimat almadan ürünü asla geri göndermeyin. Birçok reklamasyon durumunda fotoğraflar yeterlidir. İade gerekiyorsa size net talimatlar ve gerekli olduğunda kargo etiketi verilir.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Går returen till Calestra eller produktionspartnern?",
        en: "Does the return go to Calestra or the production partner?",
        tr: "İade Calestra’ya mı yoksa üretim ortağına mı gider?",
      }),
      a: pickLang(i18n, {
        sv:
          "Det beror på ärendet. Kunden kontaktar alltid Calestra först. Om fysisk retur krävs får du särskilda instruktioner. I vissa fall kan returadress eller fraktsedel gå till vår produktionspartner.",
        en:
          "It depends on the case. Customers always contact Calestra first. If a physical return is required, you will receive specific instructions. In some cases, the return address or shipping label may refer to our production partner.",
        tr:
          "Bu duruma bağlıdır. Müşteri her zaman önce Calestra ile iletişime geçer. Fiziksel iade gerekiyorsa size özel talimat verilir. Bazı durumlarda iade adresi veya kargo etiketi üretim ortağımıza ait olabilir.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Vem betalar returfrakten?",
        en: "Who pays for return shipping?",
        tr: "İade kargo ücretini kim öder?",
      }),
      a: pickLang(i18n, {
        sv:
          "Vid godkänd reklamation ska kunden inte boka eller betala returfrakt utan instruktion från oss. Om Calestra i ett särskilt undantagsfall godkänner retur av annan anledning än fel på produkten, kan kunden behöva stå för returfrakten.",
        en:
          "For an approved claim, customers should not book or pay for return shipping without instructions from us. If Calestra approves a return as a special exception for a reason other than a product issue, the customer may need to cover the return shipping cost.",
        tr:
          "Onaylanmış bir reklamasyonda müşteri bizden talimat almadan iade kargosu ayarlamamalı veya ödeme yapmamalıdır. Calestra ürün hatası dışında özel bir istisna olarak iadeyi kabul ederse, iade kargo ücreti müşteriye ait olabilir.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Varför behöver ni bilder?",
        en: "Why do you need photos?",
        tr: "Neden fotoğraf gerekiyor?",
      }),
      a: pickLang(i18n, {
        sv:
          "Bilder gör att vi kan bedöma felet rättvist och snabbt. Det skyddar både kunden och Calestra från missförstånd, felaktiga beslut och onödig logistik.",
        en:
          "Photos allow us to review the issue fairly and quickly. This protects both the customer and Calestra from misunderstandings, incorrect decisions, and unnecessary logistics.",
        tr:
          "Fotoğraflar sorunu adil ve hızlı şekilde değerlendirmemizi sağlar. Bu hem müşteriyi hem de Calestra’yı yanlış anlaşılmalardan, hatalı kararlardan ve gereksiz lojistikten korur.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Kan jag avbryta min order?",
        en: "Can I cancel my order?",
        tr: "Siparişimi iptal edebilir miyim?",
      }),
      a: pickLang(i18n, {
        sv:
          "Kontakta oss direkt. Om produktionen inte har startat kan vi ibland hjälpa till. När produktionen har påbörjats kan ordern normalt inte stoppas.",
        en:
          "Contact us immediately. If production has not started, we may sometimes be able to help. Once production has started, the order can normally no longer be stopped.",
        tr:
          "Hemen bizimle iletişime geçin. Üretim başlamadıysa bazı durumlarda yardımcı olabiliriz. Üretim başladıktan sonra sipariş genellikle durdurulamaz.",
      }),
    },
    {
      q: pickLang(i18n, {
        sv: "Varför fungerar inte returer som i andra butiker?",
        en: "Why do returns work differently than in other stores?",
        tr: "İadeler neden diğer mağazalardan farklı işliyor?",
      }),
      a: pickLang(i18n, {
        sv:
          "Calestra bygger på beställningsproduktion istället för stora lager. Det minskar onödigt svinn och gör att varje produkt skapas mer medvetet, men det innebär också att vanliga lagerreturer inte fungerar på samma sätt.",
        en:
          "Calestra is based on made-to-order production rather than large stock inventories. This reduces unnecessary waste and makes each product more intentional, but it also means ordinary stock returns do not work the same way.",
        tr:
          "Calestra büyük stoklar yerine sipariş üzerine üretim mantığıyla çalışır. Bu gereksiz israfı azaltır ve her ürünü daha bilinçli hale getirir, ancak klasik stok iadelerinin aynı şekilde işlemediği anlamına gelir.",
      }),
    },
  ];

  return (
    <Page title={pageTitle} updatedAt={updatedAt} intro={intro}>
      {fallbackSections.map((s, i) => (
        <Section key={i} title={s.title} body={s.body} />
      ))}

      <QA items={fallbackFaq} />
    </Page>
  );
}