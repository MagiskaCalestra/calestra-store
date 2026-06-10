// D:\WebProjects\Calestra\apps\store-classic\src\core\member\memberSync.js
import { cleanString, normalizeEmail } from "./memberMeta.js";
import {
  fetchMemberById,
  fetchMemberByEmail,
  fetchCurrentMember,
  fetchMemberPackage,
  fetchMemberPresence,
} from "./memberClient.js";
import {
  ensureIdentityShellState,
  readSavedCustomer,
} from "./memberViewState.js";

export async function syncMemberPageState(options = {}) {
  const emailInput = normalizeEmail(options.email || "");
  const i18n = options.i18n;
  const t = options.t;

  const shell = ensureIdentityShellState();

  const result = {
    identityState: shell,
    authStatus: "idle",
    authMsg: "",
    authSnapshot: null,
    remoteMember: null,
    memberPackage: null,
    memberPresence: null,
    backendStatus: "idle",
    backendMsg: "",
    prefillCustomer: null,
  };

  const authResult = await fetchCurrentMember();

  if (authResult?.ok && authResult?.member) {
    result.identityState = ensureIdentityShellState();
    result.authSnapshot = authResult.raw || authResult;
    result.authStatus = "ok";
    result.authMsg = "";
    result.prefillCustomer = {
      name: cleanString(authResult.member?.name || "", 160),
      email: normalizeEmail(authResult.member?.email || ""),
      phone: cleanString(authResult.member?.phone || "", 80),
    };
  } else if (authResult?.error === "missing_session" || authResult?.status === 401) {
    result.authStatus = "missing_session";
    result.authMsg =
      typeof t === "function"
        ? t("member.auth.missingSession", {
            defaultValue:
              "Ingen aktiv session hittades ännu. I dev behöver cw.sessionToken finnas innan Mitt Calestra kan synka från identity-service.",
          })
        : "Ingen aktiv session hittades ännu. I dev behöver cw.sessionToken finnas innan Mitt Calestra kan synka från identity-service.";
  } else if (authResult?.error) {
    result.authStatus = "error";
    result.authMsg = cleanString(authResult.error, 220);
  }

  try {
    const refreshed = ensureIdentityShellState();
    result.identityState = refreshed;

    if (refreshed.memberId) {
      result.backendStatus = "loading";

      const [member, pkg, presence] = await Promise.all([
        fetchMemberById(refreshed.memberId),
        fetchMemberPackage(refreshed.memberId).catch(() => null),
        fetchMemberPresence(refreshed.memberId).catch(() => null),
      ]);

      result.identityState = ensureIdentityShellState();
      result.remoteMember = member || null;
      result.memberPackage = pkg || null;
      result.memberPresence = presence || null;
      result.backendStatus = "ok";
      result.backendMsg = "";
      return result;
    }

    const savedCustomer = readSavedCustomer();
    const fallbackEmail = normalizeEmail(savedCustomer?.email || emailInput || "");

    if (fallbackEmail) {
      const member = await fetchMemberByEmail(fallbackEmail).catch(() => null);

      if (member?.id) {
        const [pkg, presence] = await Promise.all([
          fetchMemberPackage(member.id).catch(() => null),
          fetchMemberPresence(member.id).catch(() => null),
        ]);

        result.identityState = ensureIdentityShellState();
        result.remoteMember = member || null;
        result.memberPackage = pkg || null;
        result.memberPresence = presence || null;
        result.backendStatus = "ok";
        result.backendMsg = "";
        return result;
      }
    }

    result.remoteMember = null;
    result.memberPackage = null;
    result.memberPresence = null;
    result.backendStatus = "idle";
    result.backendMsg = "";
    return result;
  } catch (err) {
    result.backendStatus = "error";
    result.backendMsg =
      cleanString(err?.message || "member_sync_failed", 220) || "member_sync_failed";
    return result;
  }
}