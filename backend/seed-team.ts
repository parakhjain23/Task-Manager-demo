import 'dotenv/config';
import { prisma } from './config/database';

const teamMembers = [
  {
    name: "John Doe",
    skills: ["frontend", "react", "javascript", "ui/ux"],
    availability: "available",
    currentWorkload: 0
  },
  {
    name: "Jane Smith",
    skills: ["backend", "nodejs", "database", "api"],
    availability: "available",
    currentWorkload: 0
  },
  {
    name: "Mike Johnson",
    skills: ["devops", "docker", "kubernetes", "deployment"],
    availability: "available",
    currentWorkload: 0
  },
  {
    name: "Sarah Williams",
    skills: ["fullstack", "testing", "debugging", "code-review"],
    availability: "available",
    currentWorkload: 0
  }
];

async function seedTeam() {
  try {
    console.log('Connecting to database...');

    // Check if teamMember model exists in prisma
    if (!(prisma as any).teamMember) {
      console.warn('⚠️ teamMember model not found in Prisma schema. Skipping seeding.');
      await prisma.$disconnect();
      return;
    }

    // Clear existing team members
    await (prisma as any).teamMember.deleteMany({});
    console.log('Cleared existing team members');

    // Insert new team members
    for (const member of teamMembers) {
      await (prisma as any).teamMember.create({
        data: member as any
      });
    }
    console.log(`✓ Successfully added ${teamMembers.length} team members`);

    // Display added members
    const members = await (prisma as any).teamMember.findMany();
    console.log('\nTeam Members:');
    members.forEach((member: any) => {
      console.log(`- ${member.name}: ${member.skills.join(', ')}`);
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding team:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedTeam();
