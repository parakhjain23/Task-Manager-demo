require('dotenv').config();
const { prisma } = require('./config/database');

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

    // Clear existing team members
    await prisma.teamMember.deleteMany({});
    console.log('Cleared existing team members');

    // Insert new team members
    for (const member of teamMembers) {
      await prisma.teamMember.create({
        data: member
      });
    }
    console.log(`✓ Successfully added ${teamMembers.length} team members`);

    // Display added members
    const members = await prisma.teamMember.findMany();
    console.log('\nTeam Members:');
    members.forEach(member => {
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
