import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

interface MockProject {
  id: number;
  title: string;
  description: string;
  status: string;
  deadline: string;
}

interface MockTask {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
}

interface MockData {
  projects: MockProject[];
  tasks: MockTask[];
}

function resolveMockDataPath(): string {
  const candidates = [
    path.join(__dirname, '../../data/mock-data.json'),
    path.join(process.cwd(), 'data/mock-data.json'),
    path.join(process.cwd(), 'server/data/mock-data.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate mock-data.json. Looked in: ${candidates.join(', ')}`
  );
}

function loadMockData(): MockData {
  const filePath = resolveMockDataPath();
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as MockData;

  if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) {
    throw new Error('mock-data.json must contain projects[] and tasks[] arrays');
  }

  return parsed;
}

async function resetSqliteSequences(projectMaxId: number, taskMaxId: number): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM sqlite_sequence WHERE name IN ('Project', 'Task')`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO sqlite_sequence (name, seq) VALUES ('Project', ${projectMaxId}), ('Task', ${taskMaxId})`
    );
  } catch (error) {
    console.warn('Could not reset SQLite autoincrement sequences:', error);
  }
}

export async function seedDatabase(options: { force?: boolean } = {}): Promise<{
  seeded: boolean;
  projectCount: number;
  taskCount: number;
}> {
  const existingProjects = await prisma.project.count();
  const existingTasks = await prisma.task.count();

  if (!options.force && existingProjects > 0) {
    return {
      seeded: false,
      projectCount: existingProjects,
      taskCount: existingTasks,
    };
  }

  const mock = loadMockData();

  await prisma.$transaction(async (tx) => {
    await tx.task.deleteMany();
    await tx.project.deleteMany();

    for (const project of mock.projects) {
      await tx.project.create({ data: project });
    }

    for (const task of mock.tasks) {
      await tx.task.create({ data: task });
    }
  });

  const projectMaxId = Math.max(...mock.projects.map((p) => p.id), 0);
  const taskMaxId = Math.max(...mock.tasks.map((t) => t.id), 0);
  await resetSqliteSequences(projectMaxId, taskMaxId);

  const projectCount = await prisma.project.count();
  const taskCount = await prisma.task.count();

  return { seeded: true, projectCount, taskCount };
}
