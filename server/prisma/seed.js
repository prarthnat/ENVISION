const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
if (process.env.DATABASE_URL?.startsWith('file:./')) {
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, process.env.DATABASE_URL.slice('file:'.length))}`;
}

const prisma = new PrismaClient();

function resolveMockDataPath() {
  const candidates = [
    path.join(__dirname, '../data/mock-data.json'),
    path.join(__dirname, '../../server/data/mock-data.json'),
    path.join(process.cwd(), 'data/mock-data.json'),
    path.join(process.cwd(), 'server/data/mock-data.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Could not locate mock-data.json in: ${candidates.join(', ')}`);
}

async function seed() {
  console.log('🌱 Starting seed from mock-data.json...');
  const mockPath = resolveMockDataPath();
  const raw = fs.readFileSync(mockPath, 'utf8');
  const mockData = JSON.parse(raw);

  if (!Array.isArray(mockData.projects) || !Array.isArray(mockData.tasks)) {
    throw new Error('mock-data.json must contain projects[] and tasks[] arrays');
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.deleteMany();
    await tx.project.deleteMany();

    for (const project of mockData.projects) {
      await tx.project.create({ data: project });
    }

    for (const task of mockData.tasks) {
      await tx.task.create({ data: task });
    }
  });

  try {
    const projectMaxId = Math.max(...mockData.projects.map((p) => p.id), 0);
    const taskMaxId = Math.max(...mockData.tasks.map((t) => t.id), 0);
    await prisma.$executeRawUnsafe(
      `DELETE FROM sqlite_sequence WHERE name IN ('Project', 'Task')`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO sqlite_sequence (name, seq) VALUES ('Project', ${projectMaxId}), ('Task', ${taskMaxId})`
    );
  } catch (err) {
    // sqlite_sequence might not exist if autoincrement sequence is not yet set
  }

  const projectCount = await prisma.project.count();
  const taskCount = await prisma.task.count();
  console.log(`✅ Seed complete: ${projectCount} projects, ${taskCount} tasks`);
  return { projectCount, taskCount };
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
