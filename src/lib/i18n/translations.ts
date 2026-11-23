export type SupportedLanguage = "en" | "hi" | "es" | "fr";

export interface LanguageOption {
  readonly code: SupportedLanguage;
  readonly label: string;
  readonly nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "fr", label: "French", nativeLabel: "Français" },
];

export interface CurrencyOption {
  readonly code: string;
  readonly symbol: string;
  readonly label: string;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyOption[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
];

export const TRANSLATIONS: Record<
  SupportedLanguage,
  {
    regionalTitle: string;
    regionalAccent: string;
    regionalDescription: string;
    languageHeading: string;
    languageSaved: string;
    currencyHeading: string;
    currencyAdminHint: string;
    currencyCustomerHint: string;
    currencySaved: string;
  }
> = {
  en: {
    regionalTitle: "Language &",
    regionalAccent: "currency",
    regionalDescription:
      "Choose your preferred display language and view or manage the cafe currency.",
    languageHeading: "Display Language",
    languageSaved: "Language preference updated.",
    currencyHeading: "Store Currency",
    currencyAdminHint:
      "Updates the active currency across the storefront, checkout, and analytics.",
    currencyCustomerHint:
      "Checkout and menu prices use the cafe's active currency (managed by admins).",
    currencySaved: "Store currency updated.",
  },
  hi: {
    regionalTitle: "भाषा और",
    regionalAccent: "मुद्रा",
    regionalDescription:
      "अपनी पसंदीदा भाषा चुनें और कैफे की मुद्रा देखें या प्रबंधित करें।",
    languageHeading: "प्रदर्शन भाषा",
    languageSaved: "भाषा प्राथमिकता अपडेट हो गई।",
    currencyHeading: "स्टोर मुद्रा",
    currencyAdminHint:
      "स्टोरफ्रंट, चेकआउट और एनालिटिक्स में सक्रिय मुद्रा अपडेट करता है।",
    currencyCustomerHint:
      "चेकआउट और मेनू की कीमतें कैफे की सक्रिय मुद्रा का उपयोग करती हैं।",
    currencySaved: "स्टोर मुद्रा अपडेट हो गई।",
  },
  es: {
    regionalTitle: "Idioma y",
    regionalAccent: "moneda",
    regionalDescription:
      "Elige tu idioma preferido y consulta o administra la moneda de la cafetería.",
    languageHeading: "Idioma de visualización",
    languageSaved: "Preferencia de idioma actualizada.",
    currencyHeading: "Moneda de la tienda",
    currencyAdminHint:
      "Actualiza la moneda activa en la tienda, el pago y las analíticas.",
    currencyCustomerHint:
      "Los precios del menú y del pago usan la moneda activa de la cafetería.",
    currencySaved: "Moneda de la tienda actualizada.",
  },
  fr: {
    regionalTitle: "Langue et",
    regionalAccent: "devise",
    regionalDescription:
      "Choisissez votre langue préférée et consultez ou gérez la devise du café.",
    languageHeading: "Langue d'affichage",
    languageSaved: "Préférence de langue mise à jour.",
    currencyHeading: "Devise du magasin",
    currencyAdminHint:
      "Met à jour la devise active sur la boutique, le paiement et les analyses.",
    currencyCustomerHint:
      "Les prix du menu et du paiement utilisent la devise active du café.",
    currencySaved: "Devise du magasin mise à jour.",
  },
};