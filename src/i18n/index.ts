import {Translations} from './translations';
import {ja} from './ja';
import {en} from './en';

type TranslationKey = keyof Translations;

function detectLocale(): 'ja' | 'en' {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    if (lang === 'ja' || lang.indexOf('ja-') === 0) {
      return 'ja';
    }
  }
  return 'en';
}

const currentLocale = detectLocale();
const dictionaries: {[locale: string]: Translations} = {ja, en};

// Set lang attribute on <html> so native browser UI (e.g. <input type="file">) matches the locale
if (typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.lang = currentLocale;
}

export function t(key: TranslationKey, params?: {[k: string]: string | number}): string {
  const dict = dictionaries[currentLocale] || dictionaries['en'];
  let value: string = dict[key] || key;
  if (params) {
    Object.keys(params).forEach(function(paramKey) {
      value = value.replace(new RegExp('\\{' + paramKey + '\\}', 'g'), String(params[paramKey]));
    });
  }
  return value;
}
