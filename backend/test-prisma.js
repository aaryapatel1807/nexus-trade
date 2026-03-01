import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PrismaPkg = require('@prisma/client');

console.log(Object.keys(PrismaPkg));
try {
    const prisma = new PrismaPkg.PrismaClient({
        datasourceUrl: 'file:./dev.db'
    });
    console.log("Success with CommonJS require + datasourceUrl!");
} catch (err) {
    console.error(err.message);
}
