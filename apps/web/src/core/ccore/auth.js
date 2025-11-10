// Webb-adapter till din AuthContext med scopes.
import { useAuth } from "../AuthContext";

export function useCAuth() {
  const { user, consent, publicMode, logout } = useAuth();
  return {
    user,
    consent,
    publicMode,
    hasConsentPersonalization: !!consent?.personalization && !publicMode,
    hasScope: (/*scope*/) => true, // TODO: koppla när server-scopes finns
    logout,
  };
}
