// D:\WebProjects\Calestra\apps\store-classic\src\hooks\useAffiliate.js
import React from "react";
import { useSearchParams } from "react-router-dom";

const LS = {
  legacyAffiliate: "cw_affiliate",

  affiliateId: "cw.affiliateId",
  affiliateCode: "cw.affiliateCode",

  associateId: "cw.associateId",
  associateCode: "cw.associateCode",

  creatorId: "cw.creatorId",
  creatorCode: "cw.creatorCode",

  ambassadorCode: "cw.ambassadorCode",
  partnerCode: "cw.partnerCode",
  referralCode: "cw.referralCode",
  rewardCode: "cw.rewardCode",

  campaignId: "cw.campaignId",
  sourceChannel: "cw.sourceChannel",
  trafficSource: "cw.trafficSource",
  entryPoint: "cw.entryPoint",

  attributionJson: "cw.checkout.attribution",
};

function cleanStr(v, max = 160) {
  const s = v == null ? "" : String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function cleanCode(v, max = 160) {
  return cleanStr(v, max)
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, max);
}

function readLS(key, fallback = "") {
  try {
    if (typeof window === "undefined") return fallback;
    const v = window.localStorage.getItem(key);
    return v == null ? fallback : String(v).trim();
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    if (typeof window === "undefined") return;
    const v = String(value ?? "").trim();
    if (!v) return;
    window.localStorage.setItem(key, v);
  } catch {
    // ignore
  }
}

function writeLSJson(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function pickParam(sp, names) {
  const list = Array.isArray(names) ? names : [names];

  for (const name of list) {
    const v = cleanStr(sp.get(name) || "", 240);
    if (v) return v;
  }

  return "";
}

function pickFirst(...values) {
  for (const value of values) {
    const v = cleanStr(value || "", 300);
    if (v) return v;
  }

  return "";
}

function inferOwnerFromCodes({
  associateCode,
  ambassadorCode,
  partnerCode,
  referralCode,
  creatorCode,
  affiliateCode,
  sourceChannel,
}) {
  const channel = cleanStr(sourceChannel, 120).toLowerCase();

  if (channel.includes("creator") || creatorCode) return "creator";
  if (channel.includes("affiliate") || affiliateCode) return "affiliate";
  if (
    channel.includes("associate") ||
    channel.includes("ambassador") ||
    associateCode ||
    ambassadorCode ||
    partnerCode ||
    referralCode
  ) {
    return "associate";
  }

  return "";
}

function inferThirdPartyType({ attributionOwner, sourceChannel }) {
  const owner = cleanStr(attributionOwner, 80).toLowerCase();
  const channel = cleanStr(sourceChannel, 120).toLowerCase();

  if (owner === "creator" || channel.includes("creator")) return "creator";
  if (owner === "affiliate" || channel.includes("affiliate")) return "affiliate";
  if (owner === "associate" || channel.includes("associate")) return "associate";
  if (channel.includes("ambassador")) return "ambassador";
  if (channel.includes("partner")) return "partner";

  return owner || "";
}

/**
 * Robust attribution bootstrap för Calestra Store.
 *
 * Stödjer bland annat:
 * - ?ref=
 * - ?reward=
 * - ?rewardCode=
 * - ?affiliate=
 * - ?affiliate_code=
 * - ?affiliate_id=
 * - ?aff=
 * - ?creator=
 * - ?creator_code=
 * - ?creator_id=
 * - ?associate=
 * - ?associate_code=
 * - ?associate_id=
 * - ?ambassador=
 * - ?ambassador_code=
 * - ?partner=
 * - ?partner_code=
 * - ?referral=
 * - ?referral_code=
 * - ?campaign=
 * - ?campaign_id=
 *
 * Viktigt:
 * - ?ref= sparas alltid som rewardCode.
 * - Om ref används ensam kan checkout ändå bära den vidare som rewardCode.
 * - Explicit associate/affiliate/creator/partner/referral-code sparas separat.
 * - localStorage fylls så attribution inte tappas när kunden klickar runt före checkout.
 *
 * Returnerar fortfarande affiliateId/affiliateCode-liknande string för bakåtkompatibilitet,
 * men den viktiga sanningen ligger i cw.checkout.attribution + individuella cw.* keys.
 */
export default function useAffiliate() {
  const [sp] = useSearchParams();

  const [affiliateValue, setAffiliateValue] = React.useState(() => {
    return (
      readLS(LS.affiliateCode, "") ||
      readLS(LS.affiliateId, "") ||
      readLS(LS.legacyAffiliate, "") ||
      ""
    );
  });

  React.useEffect(() => {
    const refCode = cleanCode(
      pickParam(sp, ["ref", "reward", "rewardCode", "reward_code"]),
      160
    );

    const directAffiliateId = cleanStr(
      pickParam(sp, ["affiliate_id", "affiliateId", "affid"]),
      160
    );

    const directAffiliateCode = cleanCode(
      pickParam(sp, [
        "affiliate_code",
        "affiliateCode",
        "aff_code",
        "affcode",
        "affiliate",
        "aff",
      ]),
      160
    );

    const directCreatorId = cleanStr(
      pickParam(sp, ["creator_id", "creatorId"]),
      160
    );

    const directCreatorCode = cleanCode(
      pickParam(sp, ["creator_code", "creatorCode", "creator", "creator_ref"]),
      160
    );

    const directAssociateId = cleanStr(
      pickParam(sp, ["associate_id", "associateId", "assoc_id", "assocId"]),
      160
    );

    const directAssociateCode = cleanCode(
      pickParam(sp, [
        "associate_code",
        "associateCode",
        "associate",
        "assoc",
        "assoc_code",
        "assocCode",
      ]),
      160
    );

    const directAmbassadorCode = cleanCode(
      pickParam(sp, [
        "ambassador_code",
        "ambassadorCode",
        "ambassador",
        "amb",
        "amb_code",
        "ambCode",
      ]),
      160
    );

    const directPartnerCode = cleanCode(
      pickParam(sp, ["partner_code", "partnerCode", "partner", "p"]),
      160
    );

    const directReferralCode = cleanCode(
      pickParam(sp, ["referral_code", "referralCode", "referral"]),
      160
    );

    const directCampaignId = cleanStr(
      pickParam(sp, ["campaign_id", "campaignId", "campaign", "cid"]),
      160
    );

    const directSourceChannel = cleanStr(
      pickParam(sp, ["source_channel", "sourceChannel", "source", "channel"]),
      120
    );

    const directTrafficSource = cleanStr(
      pickParam(sp, ["traffic_source", "trafficSource", "utm_source"]),
      120
    );

    const directEntryPoint = cleanStr(
      pickParam(sp, ["entry_point", "entryPoint", "entry", "ep"]),
      120
    );

    const affiliateId = cleanStr(
      pickFirst(directAffiliateId, readLS(LS.affiliateId, "")),
      160
    );

    const affiliateCode = cleanCode(
      pickFirst(directAffiliateCode, readLS(LS.affiliateCode, "")),
      160
    );

    const creatorId = cleanStr(
      pickFirst(directCreatorId, readLS(LS.creatorId, "")),
      160
    );

    const creatorCode = cleanCode(
      pickFirst(directCreatorCode, readLS(LS.creatorCode, "")),
      160
    );

    const associateId = cleanStr(
      pickFirst(directAssociateId, readLS(LS.associateId, "")),
      160
    );

    const associateCode = cleanCode(
      pickFirst(directAssociateCode, readLS(LS.associateCode, "")),
      160
    );

    const ambassadorCode = cleanCode(
      pickFirst(directAmbassadorCode, readLS(LS.ambassadorCode, ""), associateCode),
      160
    );

    const partnerCode = cleanCode(
      pickFirst(
        directPartnerCode,
        readLS(LS.partnerCode, ""),
        associateCode,
        creatorCode,
        affiliateCode
      ),
      160
    );

    const referralCode = cleanCode(
      pickFirst(directReferralCode, readLS(LS.referralCode, ""), partnerCode),
      160
    );

    const rewardCode = cleanCode(
      pickFirst(
        refCode,
        readLS(LS.rewardCode, ""),
        partnerCode,
        referralCode,
        associateCode,
        ambassadorCode,
        creatorCode,
        affiliateCode
      ),
      160
    );

    const campaignId = cleanStr(
      pickFirst(directCampaignId, readLS(LS.campaignId, "")),
      160
    );

    const sourceChannel = cleanStr(
      pickFirst(
        directSourceChannel,
        readLS(LS.sourceChannel, ""),
        associateCode || ambassadorCode || partnerCode || referralCode
          ? "associate"
          : creatorCode
            ? "creator"
            : affiliateCode || affiliateId
              ? "affiliate"
              : ""
      ),
      120
    );

    const trafficSource = cleanStr(
      pickFirst(directTrafficSource, readLS(LS.trafficSource, ""), sourceChannel),
      120
    );

    const entryPoint = cleanStr(
      pickFirst(directEntryPoint, readLS(LS.entryPoint, ""), "store"),
      120
    );

    const attributionOwner = inferOwnerFromCodes({
      associateCode,
      ambassadorCode,
      partnerCode,
      referralCode,
      creatorCode,
      affiliateCode,
      sourceChannel,
    });

    const thirdPartyType = inferThirdPartyType({
      attributionOwner,
      sourceChannel,
    });

    if (affiliateId) writeLS(LS.affiliateId, affiliateId);
    if (affiliateCode) {
      writeLS(LS.affiliateCode, affiliateCode);
      writeLS(LS.legacyAffiliate, affiliateCode);
    } else if (affiliateId) {
      writeLS(LS.legacyAffiliate, affiliateId);
    }

    if (associateId) writeLS(LS.associateId, associateId);
    if (associateCode) writeLS(LS.associateCode, associateCode);

    if (creatorId) writeLS(LS.creatorId, creatorId);
    if (creatorCode) writeLS(LS.creatorCode, creatorCode);

    if (ambassadorCode) writeLS(LS.ambassadorCode, ambassadorCode);
    if (partnerCode) writeLS(LS.partnerCode, partnerCode);
    if (referralCode) writeLS(LS.referralCode, referralCode);
    if (rewardCode) writeLS(LS.rewardCode, rewardCode);

    if (campaignId) writeLS(LS.campaignId, campaignId);
    if (sourceChannel) writeLS(LS.sourceChannel, sourceChannel);
    if (trafficSource) writeLS(LS.trafficSource, trafficSource);
    if (entryPoint) writeLS(LS.entryPoint, entryPoint);

    const hasAttribution = Boolean(
      affiliateId ||
        affiliateCode ||
        creatorId ||
        creatorCode ||
        associateId ||
        associateCode ||
        ambassadorCode ||
        partnerCode ||
        referralCode ||
        rewardCode ||
        campaignId ||
        sourceChannel ||
        trafficSource
    );

    if (hasAttribution) {
      writeLSJson(LS.attributionJson, {
        affiliateId,
        affiliateCode,
        creatorId,
        creatorCode,
        associateId,
        associateCode,
        ambassadorCode,
        partnerCode,
        referralCode,
        rewardCode,
        rewardReady: !!rewardCode,
        campaignId,
        sourceChannel,
        trafficSource,
        entryPoint,
        attributionOwner,
        thirdPartyType,
        updatedAt: new Date().toISOString(),
      });
    }

    setAffiliateValue(affiliateCode || affiliateId || rewardCode || "");
  }, [sp]);

  return affiliateValue || "";
}