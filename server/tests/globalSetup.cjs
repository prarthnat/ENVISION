const fs = require('node:fs');
const path = require('node:path');

module.exports = async function setupTestDatabase() {
  const serverRoot = path.resolve(__dirname, '..');
  const databasePath = path.join(serverRoot, 'prisma', 'test.db');
  const migrationRoot = path.join(serverRoot, 'prisma', 'migrations');
  const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [serverRoot] }));
  fs.rmSync(databasePath, { force: true });

  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const migrations = fs.readdirSync(migrationRoot).sort();
    for (const migration of migrations) {
      const migrationPath = path.join(migrationRoot, migration, 'migration.sql');
      if (!fs.existsSync(migrationPath)) continue;
      const sql = fs.readFileSync(migrationPath, 'utf8');
      const statements = sql
        .split(';')
        .map((statement) => statement.replace(/^--.*$/gm, '').trim())
        .filter(Boolean);
      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  return async function teardownTestDatabase() {
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-journal`, { force: true });
  };
};
