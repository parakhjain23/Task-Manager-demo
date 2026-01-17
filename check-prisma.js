const { prisma } = require('./backend/config/database');

async function check() {
    try {
        console.log('Task fields:', Object.keys(prisma.task));
        const tasks = await prisma.task.findMany({ take: 1 });
        console.log('Sample task keys:', tasks.length > 0 ? Object.keys(tasks[0]) : 'No tasks found');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
