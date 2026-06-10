import { useLang } from "@core/lang";
import { useCurrency } from "@core/currency";
import { displayMoneyFromSEK } from "@utils/money";
export function usePrice(){ const {locale}=useLang(); const {currency}=useCurrency();
  return { formatFromSEK:(sek)=>displayMoneyFromSEK(sek, currency, locale) };
}
