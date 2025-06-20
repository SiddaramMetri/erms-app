import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderOpen, 
  Calendar, 
  UserPlus,
  Plus,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import AssignmentForm from '@/components/forms/AssignmentForm';
import ProjectForm from '@/components/forms/ProjectForm';

// Mock data for demonstration
const mockEngineers = [
  {
    id: '1',
    name: 'Alice Johnson',
    skills: ['React', 'TypeScript', 'Node.js'],
    capacity: 85,
    maxCapacity: 100,
    seniority: 'senior',
    currentProjects: 2
  },
  {
    id: '2',
    name: 'Bob Smith',
    skills: ['Python', 'Django', 'PostgreSQL'],
    capacity: 60,
    maxCapacity: 100,
    seniority: 'mid',
    currentProjects: 1
  },
  {
    id: '3',
    name: 'Carol Wilson',
    skills: ['React', 'Vue.js', 'CSS'],
    capacity: 40,
    maxCapacity: 50,
    seniority: 'junior',
    currentProjects: 1
  },
  {
    id: '4',
    name: 'David Chen',
    skills: ['Node.js', 'MongoDB', 'AWS'],
    capacity: 95,
    maxCapacity: 100,
    seniority: 'senior',
    currentProjects: 3
  }
];

const mockProjects = [
  {
    id: '1',
    name: 'E-commerce Platform',
    status: 'active',
    requiredSkills: ['React', 'Node.js'],
    assignedEngineers: 3,
    requiredEngineers: 4,
    progress: 65,
    dueDate: '2024-03-15'
  },
  {
    id: '2',
    name: 'Mobile App Backend',
    status: 'planning',
    requiredSkills: ['Python', 'MongoDB'],
    assignedEngineers: 1,
    requiredEngineers: 2,
    progress: 10,
    dueDate: '2024-04-20'
  },
  {
    id: '3',
    name: 'Analytics Dashboard',
    status: 'active',
    requiredSkills: ['React', 'TypeScript'],
    assignedEngineers: 2,
    requiredEngineers: 2,
    progress: 40,
    dueDate: '2024-03-30'
  }
];

const ManagerDashboard: React.FC = () => {
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  
  const overloadedEngineers = mockEngineers.filter(eng => eng.capacity > 80);
  const availableEngineers = mockEngineers.filter(eng => eng.capacity < 70);
  const activeProjects = mockProjects.filter(proj => proj.status === 'active');
  const totalCapacity = mockEngineers.reduce((sum, eng) => sum + eng.capacity, 0);
  const avgCapacity = Math.round(totalCapacity / mockEngineers.length);

  const statsCards = [
    {
      title: 'Total Engineers',
      value: mockEngineers.length,
      change: '+2',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Projects',
      value: activeProjects.length,
      change: '+1',
      changeType: 'positive' as const,
      icon: FolderOpen,
      color: 'bg-green-500'
    },
    {
      title: 'Avg Capacity',
      value: `${avgCapacity}%`,
      change: '+5%',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      title: 'Overloaded',
      value: overloadedEngineers.length,
      change: '-1',
      changeType: 'negative' as const,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg text-slate-600">Quick Actions</h2>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            onClick={() => setIsAssignmentFormOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
          <Button 
            variant="outline" 
            className="border-slate-300 hover:bg-slate-50"
            onClick={() => setIsProjectFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-slate-500 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Capacity Overview */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Team Capacity</CardTitle>
                <CardDescription className="text-slate-600">Current workload distribution</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockEngineers.map((engineer) => (
              <div key={engineer.id} className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {engineer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{engineer.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {engineer.seniority}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {engineer.currentProjects} projects
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {engineer.capacity}% capacity
                    </p>
                    <p className="text-xs text-slate-500">
                      of {engineer.maxCapacity}% max
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={engineer.capacity} 
                    className="h-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {engineer.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {engineer.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{engineer.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Active Projects</CardTitle>
                <CardDescription className="text-slate-600">Project progress overview</CardDescription>
              </div>
              <FolderOpen className="h-5 w-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">{project.name}</h4>
                    <Badge 
                      variant={project.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{project.progress}% complete</span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {project.dueDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-600">
                    <Users className="h-4 w-4 mr-1" />
                    {project.assignedEngineers}/{project.requiredEngineers} engineers
                  </div>
                  {project.assignedEngineers < project.requiredEngineers && (
                    <div className="flex items-center text-amber-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Understaffed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(overloadedEngineers.length > 0 || availableEngineers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overloaded Engineers Alert */}
          {overloadedEngineers.length > 0 && (
            <Card className="border-red-200 bg-red-50/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg text-red-900">Capacity Alerts</CardTitle>
                </div>
                <CardDescription className="text-red-700">
                  Engineers approaching or exceeding capacity limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overloadedEngineers.map((engineer) => (
                    <div key={engineer.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">{engineer.name}</p>
                        <p className="text-sm text-red-700">{engineer.capacity}% capacity</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-100">
                        Rebalance
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Engineers */}
          {availableEngineers.length > 0 && (
            <Card className="border-green-200 bg-green-50/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg text-green-900">Available Resources</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  Engineers with available capacity for new assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableEngineers.map((engineer) => (
                    <div key={engineer.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div>
                        <p className="font-medium text-green-900">{engineer.name}</p>
                        <p className="text-sm text-green-700">{engineer.capacity}% capacity</p>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Forms */}
      <AssignmentForm
        isOpen={isAssignmentFormOpen}
        onClose={() => setIsAssignmentFormOpen(false)}
        onSuccess={() => {
          // In a real app, this would refetch data
          console.log('Assignment created successfully');
        }}
      />

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        onSuccess={() => {
          // In a real app, this would refetch data
          console.log('Project created successfully');
        }}
      />
    </div>
  );
};

export default ManagerDashboard;