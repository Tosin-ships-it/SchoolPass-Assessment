import { PrismaClient } from './client/index.js';
import path from 'node:path';

const dbPath = path.resolve('task-04-server-security/sandbox/prisma/sandbox.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

try {
  console.log('Attempting to query Parent records with client-expected field ninNumber...');
  const parents = await prisma.parent.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      ninNumber: true // Field present in Prisma Client types, but absent from database
    }
  });
  console.log('Query result:', parents);
} catch (error) {
  console.error('\n================ PRISMA SCHEMA DRIFT ERROR CAPTURED ================');
  console.error('Error Name:', error.name);
  console.error('Error Code:', error.code);
  console.error('Message:\n', error.message);
  console.error('=====================================================================');
} finally {
  await prisma.$disconnect();
}
