import { createRequire } from 'module';
import path from 'path';
import url from 'url';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

// Use the explicit file URL for SQLite to guarantee connection
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const dbUrl = `file:${path.join(__dirname, 'prisma', 'dev.db')}`;

const prisma = new PrismaClient({
    datasourceUrl: dbUrl,
});

export default prisma;
