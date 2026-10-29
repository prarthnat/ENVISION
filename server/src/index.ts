import app from './app';
import { seedDatabase } from './lib/seed';
import { prisma } from './lib/prisma';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function start(): Promise<void> {
  const result = await seedDatabase({ force: false });
  if (result.seeded) {
    console.log(
      `🌱 Empty database seeded with mock data: ${result.projectCount} projects, ${result.taskCount} tasks`
    );
  } else {
    console.log(
      `📦 Database already contains ${result.projectCount} projects and ${result.taskCount} tasks — skipping seed`
    );
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

start().catch((error) => {
  console.error('❌ Server startup failed:', error);
  void prisma.$disconnect();
  process.exitCode = 1;
});
