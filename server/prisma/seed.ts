import { seedDatabase } from '../src/lib/seed';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Starting forced reseed from mock-data.json...');
  const result = await seedDatabase({ force: true });
  console.log(`✅ Seed complete: ${result.projectCount} projects, ${result.taskCount} tasks`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
