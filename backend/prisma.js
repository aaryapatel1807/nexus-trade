import { PrismaClient } from '@prisma/client';

// In production (Render), DATABASE_URL points to PostgreSQL.
// In local dev, fall back to the SQLite file.
const prisma = new PrismaClient();

export default prisma;
