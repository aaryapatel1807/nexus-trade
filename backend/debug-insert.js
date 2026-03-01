import prisma from './prisma.js';

async function main() {
    try {
        console.log("Attempting test insertion...");
        const user = await prisma.user.create({
            data: {
                email: 'debug@test.com',
                passwordHash: 'dummy',
                name: 'Debug User'
            }
        });
        console.log("Success! Inserted user:", user);
    } catch (e) {
        console.error("PRISMA ERROR CAUGHT:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
