'use client';

import { Globe } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLanguage}
      className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-1"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {locale === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}