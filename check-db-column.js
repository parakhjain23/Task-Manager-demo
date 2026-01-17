const { prisma } = require('./backend/config/database');

async function checkDB() {
    try {
        const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Task' AND column_name = 'isDeleted'`;
        console.log('Column check result:', result);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
