import polyglotI18nProvider from "ra-i18n-polyglot";
import zh from "./translations/zh";
import en from "./translations/en";
import chineseMessages from "ra-language-chinese";
import englishMessages from "ra-language-english";

const translations = {
  zh: { ...chineseMessages, ...zh },
  en: { ...englishMessages, ...en },
};

export const i18nProvider = polyglotI18nProvider(
  (locale) =>
    translations[locale as keyof typeof translations] || translations.zh,
  "zh", // 默认语言
  [
    { locale: "zh", name: "中文" },
    { locale: "en", name: "English" },
  ],
);
