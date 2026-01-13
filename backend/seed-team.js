require('dotenv').config();
const mongoose = require('mongoose');
const TeamMember = require('./models/TeamMember');

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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing team members
    await TeamMember.deleteMany({});
    console.log('Cleared existing team members');

    // Insert new team members
    await TeamMember.insertMany(teamMembers);
    console.log(`✓ Successfully added ${teamMembers.length} team members`);

    // Display added members
    const members = await TeamMember.find();
    console.log('\nTeam Members:');
    members.forEach(member => {
      console.log(`- ${member.name}: ${member.skills.join(', ')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding team:', error);
    process.exit(1);
  }
}

seedTeam();
