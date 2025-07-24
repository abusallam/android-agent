import { Users, MapPin, Activity, Shield, Download, Bell, MapIcon } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PWAInstaller } from '@/components/pwa-installer';

export default async function Dashboard() {
  const t = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Android Agent Logo" 
                width={32} 
                height={32}
                className="h-8 w-8"
              />
              <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LanguageSwitcher />
              <span className="text-sm text-gray-500 dark:text-gray-400">{tCommon('welcome')}, {tCommon('admin')}</span>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('onlineDevices')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('offlineDevices')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('gpsLocations')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('activeSessions')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Device Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Online Devices */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                {t('onlineDevices')}
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('noDevicesOnline')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('devicesWillAppear')}
                </p>
              </div>
            </div>
          </div>

          {/* Offline Devices */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                {t('offlineDevices')}
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('noDevicesOffline')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('previousDevices')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('quickActions')}</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{t('apkBuilder')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('apkBuilderDesc')}</p>
                </div>
              </button>

              <button className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{t('locationMap')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('locationMapDesc')}</p>
                </div>
              </button>

              <button className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{t('systemLogs')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('systemLogsDesc')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* PWA Installation */}
        <div className="mt-8">
          <PWAInstaller />
        </div>

        {/* Status Banner */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {t('modernDashboard')}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                {t('modernDashboardDesc')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}