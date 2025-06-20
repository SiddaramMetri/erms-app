# Engineering Resource Management System

A full-stack application for managing engineering team assignments across projects.  
Built with React (TypeScript) + Shadcn UI + Tailwind (frontend) and Node.js + Express + Mongoose (backend).

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Core Features](#core-features)  
3. [Tech Stack](#tech-stack) 
4. [Getting Started](#getting-started)  
   - [Prerequisites](#prerequisites)  
   - [Clone & Install](#clone--install)  
   - [Environment Variables](#environment-variables)  
   - [Seeding the Database](#seeding-the-database)  
   - [Run Backend](#run-backend)  
   - [Run Frontend](#run-frontend)  
5. [Usage](#usage)  
   - [Manager Workflow](#manager-workflow)  
   - [Engineer Workflow](#engineer-workflow)  
6. [API Endpoints](#api-endpoints)  
7. [AI Tools & Workflow](#ai-tools--workflow)  
   - [Which AI Tools Were Used](#which-ai-tools-were-used)  
   - [How AI Accelerated Development](#how-ai-accelerated-development)  
   - [Challenges with AI-Generated Code](#challenges-with-ai-generated-code)  
   - [Validating AI Suggestions](#validating-ai-suggestions)  
8. [Deployment](#deployment)  
9. [Troubleshooting](#troubleshooting)  
10. [License](#license)  

---

## Project Overview

This application manages which engineers are assigned to which projects, tracks their capacity usage, and shows when they'll be available next. It supports two user roles:

- **Manager**  
  - Create/Edit/Delete Projects  
  - Assign/Update/Delete Engineer Assignments  
  - See a dashboard of all engineers, their capacities, and availability  
  - View analytics (team utilization chart) and search/filter engineers by skill  

- **Engineer**  
  - Log in and view only their own assignments and capacity  
  - View "My Profile" (edit skills, seniority, etc.)  

All data is persisted in MongoDB via Mongoose. Authentication is JWT-based, with "engineer" vs. "manager" roles enforcing access control.

---

## Core Features

1. **Authentication & User Roles**  
   - JWT login (email + password) with two roles: `manager` and `engineer`.  
   - Engineers see only their own data; managers see everything.

2. **Engineer Management**  
   - CRUD for engineer profiles (name, skills, seniority, capacity, department).  

3. **Project Management**  
   - CRUD for projects (name, description, dates, required skills, status, team size).  

4. **Assignment System**  
   - Assign engineers to projects with an allocation percentage (0–100).  
   - Capacity validation on create/update: cannot exceed `maxCapacity`.  
   - CRUD for assignments.

5. **Dashboard Views**  
   - **Manager Dashboard**:  
     - Team overview with capacity bars  
     - Search/filter engineers by skill  
     - Analytics chart (team-wide utilization)

   - **Engineer Dashboard**:  
     - My current and upcoming assignments  
     - My capacity bar  

6. **Search & Analytics**  
   - Filter engineers by skill substring.  
   - Filter projects by status (`planning`, `active`, `completed`).

7. **AI-Powered Development Approach**  
   - AI tools were used throughout: Cursor IDE, Claude, GitHub Copilot, etc.  
   - All AI-generated code was manually validated.

---

## Tech Stack

- **Frontend**  
  - React + TypeScript  
  - Vite  
  - Tailwind CSS + ShadCN UI components  
  - React Hook Form (forms)  
  - React Context API (state management)  
  - Axios (HTTP client)  
  - Recharts (analytics chart)  
  - React Router v6  

- **Backend**  
  - Node.js + Express  
  - MongoDB with Mongoose  
  - JWT for authentication  
  - Bcrypt.js (password hashing)  
  - dotenv (env vars)  
  - cors, helmet (security middleware)  

- **Testing / Tools**  
  - Postman (API testing)  
  - MongoDB Compass (DB inspection)  
  - Cursor IDE + Claude + GitHub Copilot (AI assistance)

---

---

## Getting Started

### Prerequisites

- **Node.js** v18+ & npm v8+  
- **MongoDB** (local or hosted)  
- **Git** 

### Clone & Install

```bash
# 1. Clone this repo
git clone https://github.com/SiddaramMetri/erms-app.git .

# 2. Install server (backend) dependencies
cd backend
npm install

# 3. Install client (frontend) dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/erms
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
```

### Seeding the Database

```bash
cd backend
npm run seed
```

This creates sample data:
- 4 engineers with different skills/capacities
- 3 projects with various requirements  
- 6 assignments showing different scenarios
- 1 manager account and 4 engineer accounts

### Run Backend

```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Run Frontend

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Usage

### Manager Workflow

1. **Login** with manager credentials
2. **View Dashboard** - See team overview with capacity bars
3. **Create Project** - Add new projects with required skills
4. **Create Assignment** - Assign engineers to projects with allocation %
5. **View Analytics** - Check team utilization chart
6. **Search Engineers** - Filter by skills or availability

### Engineer Workflow

1. **Login** with engineer credentials (any seeded engineer account)
2. **View Dashboard** - See personal assignments and capacity
3. **View Profile** - Update skills and information
4. **Check Assignments** - View current and upcoming projects

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password
- `POST /api/auth/logout` - User logout

### Users/Engineers
- `GET /api/users` - Get all users
- `GET /api/users/search/skill` - Search users by skill
- `POST /api/users/find-suitable` - Find suitable engineers for project (Manager only)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/capacity` - Get engineer capacity info
- `GET /api/users/:id/assignments` - Get engineer assignments
- `PUT /api/users/:id` - Update user (Manager only)
- `DELETE /api/users/:id` - Delete user (Manager only)

**Note:** `/api/engineers/*` routes also work (alias for `/api/users/*`)

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project (Manager only)
- `PUT /api/projects/:id` - Update project (Manager only)
- `DELETE /api/projects/:id` - Delete project (Manager only)

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/active` - Get active assignments
- `GET /api/assignments/current` - Get current assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create new assignment (Manager only)
- `PUT /api/assignments/:id` - Update assignment (Manager only)
- `DELETE /api/assignments/:id` - Delete assignment (Manager only)

### Analytics
- `GET /api/analytics/team-utilization` - Team utilization analytics (Manager only)
- `GET /api/analytics/skill-gaps` - Skill gap analysis (Manager only)
- `GET /api/analytics/project-health` - Project health metrics (Manager only)

### System
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

**Note:** All routes (except register, login, logout, and health) require authentication via JWT token in Authorization header.

---

## AI Tools & Workflow

### Which AI Tools Were Used

#### Primary Development Environment
- **Cursor IDE**: Used as the primary development environment with AI-powered code completion and generation
- **Claude (Anthropic)**: Leveraged for architecture decisions, code review, and complex problem-solving  
- **GitHub Copilot**: Integrated for real-time code suggestions and boilerplate generation

#### Specific AI Applications

1. **Code Generation & Boilerplate**
   - Generated initial React components with TypeScript interfaces
   - Created Express.js route handlers and middleware
   - Auto-generated database schemas and validation rules
   - Built comprehensive form handling with React Hook Form

2. **Architecture & Design Decisions**
   - Consulted AI for optimal database schema design
   - Received guidance on React state management patterns
   - Got recommendations for security middleware implementation
   - Optimized API endpoint structure and naming conventions

3. **Problem-Solving & Debugging**
   - Used AI to troubleshoot authentication flow issues
   - Resolved complex MongoDB aggregation queries
   - Fixed TypeScript type definition conflicts
   - Optimized performance bottlenecks in capacity calculations

### How AI Accelerated Development
**AI Solution**: Generated reusable components with proper interfaces:
```typescript
interface EngineerCardProps {
  engineer: Engineer;
  assignments: Assignment[];
  onAssign: (engineerId: string) => void;
}

const EngineerCard: React.FC<EngineerCardProps> = ({ engineer, assignments, onAssign }) => {
  const currentLoad = assignments.reduce((sum, a) => sum + a.allocationPercentage, 0);
  const availableCapacity = engineer.maxCapacity - currentLoad;
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{engineer.name}</h3>
        <Badge variant={availableCapacity > 0 ? 'default' : 'destructive'}>
          {availableCapacity}% available
        </Badge>
      </div>
      <Progress value={(currentLoad / engineer.maxCapacity) * 100} className="mb-2" />
      <div className="flex flex-wrap gap-1">
        {engineer.skills.map((skill, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {skill.skill}
          </Badge>
        ))}
      </div>
    </Card>
  );
};
```

### Challenges with AI-Generated Code

#### 1. TypeScript Interface Conflicts
**Challenge**: AI generated conflicting type definitions between frontend and backend.

**Resolution**: Created a shared types file and manually aligned interfaces.

#### 2. Security Oversight
**Challenge**: AI-generated CORS configuration was too permissive for production.

**Resolution**: Manually configured environment-specific CORS settings.

### Validating AI Suggestions

#### 1. Code Review Process
- **Manual Review**: Every AI-generated code block was manually reviewed line by line
- **Testing**: Each function was tested independently before integration
- **Security Check**: Verified security implications of generated middleware and authentication logic

#### 2. Understanding Before Implementation
- **Documentation**: Added comprehensive comments to explain AI-generated complex logic
- **Refactoring**: Modified AI suggestions to fit project architecture and coding standards
- **Optimization**: Improved performance of AI-generated database queries

#### 3. Iterative Refinement
- **Multiple Iterations**: Used AI suggestions as starting points, then refined through multiple iterations
- **Context Awareness**: Ensured AI-generated code understood the broader application context
- **Edge Case Handling**: Manually added error handling for edge cases AI might have missed

#### 4. Best Practices Learned
- **Never Copy-Paste Blindly**: Always understand the purpose and implications of AI-generated code
- **Security First**: Manually review all security-related code, especially authentication and authorization
- **Test Thoroughly**: AI-generated code often covers happy paths but may miss edge cases
- **Maintain Consistency**: Ensure AI-generated code follows project conventions and patterns

---


---

## Deployment

### Backend (Vercel)
The backend is configured for Vercel deployment with serverless functions.

```bash
cd backend
vercel deploy
```

### Frontend (Netlify/Vercel)
```bash
cd frontend
npm run build
# Deploy dist folder to your preferred platform
```

### Environment Variables for Production
```bash
# Production .env
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-cluster-url
JWT_SECRET=your-super-secure-jwt-key
JWT_EXPIRE=7d
```

---

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB connection
mongodb://localhost:27017/erms

# Verify seed data
cd backend && npm run seed
```

#### Port Conflicts
```bash
# Backend default: 5000
# Frontend default: 5173
# Change in respective package.json files
```

#### CORS Issues
```bash
# Ensure backend CORS allows frontend origin
# Check network tab in browser dev tools
```

### Debug Mode
```bash
# Backend with debug logs
cd backend
DEBUG=* npm run dev

# Frontend with verbose logging
cd frontend
npm run dev -- --debug
```

---