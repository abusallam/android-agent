import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Import messages statically
import enMessages from '../../messages/en.json';
import arMessages from '../../messages/ar.json';

// Can be imported from a shared config
const locales = ['en', 'ar'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as string)) notFound();

  const validLocale = locale as 'en' | 'ar';
  const messages = {
    en: enMessages,
    ar: arMessages
  }[validLocale];

  return {
    locale: validLocale,
    messages
  };
});