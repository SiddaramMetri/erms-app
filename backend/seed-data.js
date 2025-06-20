import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Project, Assignment } from './src/models/index.js';

dotenv.config();

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/erms');
    console.log('✅ Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Assignment.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create sample users
    // Note: User model will automatically hash passwords via pre-save hook
    
    const users = await User.create([
      {
        name: 'John Manager',
        email: 'manager@company.com',
        password: 'password123',
        role: 'manager'
      },
      {
        name: 'Alice Johnson',
        email: 'alice@company.com',
        password: 'password123',
        role: 'engineer',
        department: 'Frontend',
        seniority: 'senior',
        maxCapacity: 100,
        skills: [
          { skill: 'React', level: 'advanced' },
          { skill: 'TypeScript', level: 'advanced' },
          { skill: 'Node.js', level: 'intermediate' }
        ]
      },
      {
        name: 'Bob Smith',
        email: 'bob@company.com',
        password: 'password123',
        role: 'engineer',
        department: 'Backend',
        seniority: 'mid',
        maxCapacity: 100,
        skills: [
          { skill: 'Node.js', level: 'advanced' },
          { skill: 'Python', level: 'intermediate' },
          { skill: 'MongoDB', level: 'advanced' }
        ]
      },
      {
        name: 'Carol Wilson',
        email: 'carol@company.com',
        password: 'password123',
        role: 'engineer',
        department: 'Frontend',
        seniority: 'junior',
        maxCapacity: 80,
        skills: [
          { skill: 'React', level: 'intermediate' },
          { skill: 'CSS', level: 'advanced' },
          { skill: 'JavaScript', level: 'intermediate' }
        ]
      },
      {
        name: 'David Chen',
        email: 'david@company.com',
        password: 'password123',
        role: 'engineer',
        department: 'DevOps',
        seniority: 'senior',
        maxCapacity: 100,
        skills: [
          { skill: 'AWS', level: 'expert' },
          { skill: 'Docker', level: 'advanced' },
          { skill: 'Kubernetes', level: 'advanced' }
        ]
      }
    ]);

    console.log('👥 Created users:', users.length);

    // Create sample projects
    const manager = users.find(e => e.role === 'manager');
    
    const projects = await Project.create([
      {
        name: 'E-commerce Platform',
        description: 'Modern e-commerce platform with React frontend and Node.js backend',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        requiredSkills: [
          { skill: 'React', level: 'intermediate', count: 2 },
          { skill: 'Node.js', level: 'intermediate', count: 1 },
          { skill: 'MongoDB', level: 'beginner', count: 1 }
        ],
        teamSize: 4,
        status: 'active',
        managerId: manager._id
      },
      {
        name: 'Mobile App Backend',
        description: 'RESTful API backend for mobile application',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        requiredSkills: [
          { skill: 'Node.js', level: 'advanced', count: 1 },
          { skill: 'Python', level: 'intermediate', count: 1 }
        ],
        teamSize: 2,
        status: 'active',
        managerId: manager._id
      },
      {
        name: 'DevOps Infrastructure',
        description: 'Cloud infrastructure setup and CI/CD pipeline',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-30'),
        requiredSkills: [
          { skill: 'AWS', level: 'advanced', count: 1 },
          { skill: 'Docker', level: 'intermediate', count: 1 }
        ],
        teamSize: 2,
        status: 'planning',
        managerId: manager._id
      }
    ]);

    console.log('📋 Created projects:', projects.length);

    // Create sample assignments
    const assignments = await Assignment.create([
      {
        engineerId: users[1]._id, // Alice
        projectId: projects[0]._id,   // E-commerce Platform
        allocationPercentage: 60,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        role: 'lead',
        createdBy: manager._id
      },
      {
        engineerId: users[2]._id, // Bob
        projectId: projects[1]._id,   // Mobile App Backend
        allocationPercentage: 80,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        role: 'developer',
        createdBy: manager._id
      },
      {
        engineerId: users[3]._id, // Carol
        projectId: projects[0]._id,   // E-commerce Platform
        allocationPercentage: 40,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        role: 'developer',
        createdBy: manager._id
      }
    ]);

    console.log('📝 Created assignments:', assignments.length);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Assignments: ${assignments.length}`);
    console.log('\n🔑 Login credentials:');
    console.log('   Manager: manager@company.com / password123');
    console.log('   Engineers: alice@company.com, bob@company.com, etc. / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();