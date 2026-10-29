import app from './app';
import { seedDatabase } from './lib/seed';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function start(): Promise<void> {
  try {
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
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

start();
