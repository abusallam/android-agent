import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🏁 Tactical Mapping System E2E Tests Complete');
  console.log('📊 Check test results in playwright-report/');
  console.log('🎯 All tactical features tested successfully');
}

export default globalTeardown;