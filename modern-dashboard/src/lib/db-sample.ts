import { createSampleData } from './db-init';

createSampleData().then(() => {
  console.log('✅ Sample data created successfully');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Failed to create sample data:', error);
  process.exit(1);
});