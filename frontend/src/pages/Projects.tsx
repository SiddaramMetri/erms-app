import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Plus, 
  Calendar, 
  Users, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  FolderOpen,
  Edit,
} from 'lucide-react';
import ProjectForm from '@/components/forms/ProjectForm';

// Mock projects data
const mockProjects = [
  {
    id: '1',
    name: 'E-commerce Platform Redesign',
    description: 'Complete overhaul of the existing e-commerce platform with modern UI/UX and improved performance',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    progress: 65,
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    teamSize: 4,
    assignedEngineers: 3,
    manager: 'John Manager',
    budget: 150000,
    priority: 'high',
    assignedTeam: [
      { name: 'Alice Johnson', role: 'Frontend Lead', allocation: 60 },
      { name: 'Bob Smith', role: 'Backend Developer', allocation: 40 },
      { name: 'Carol Wilson', role: 'UI/UX Developer', allocation: 50 }
    ]
  },
  {
    id: '2',
    name: 'Mobile App Backend API',
    description: 'RESTful API development for the new mobile application with authentication and data management',
    status: 'planning',
    startDate: '2024-03-01',
    endDate: '2024-07-01',
    progress: 15,
    requiredSkills: ['Python', 'FastAPI', 'MongoDB', 'Docker'],
    teamSize: 3,
    assignedEngineers: 1,
    manager: 'John Manager',
    budget: 80000,
    priority: 'medium',
    assignedTeam: [
      { name: 'Emily Davis', role: 'Backend Developer', allocation: 70 }
    ]
  },
  {
    id: '3',
    name: 'Analytics Dashboard',
    description: 'Real-time analytics dashboard for business intelligence and reporting',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-05-01',
    progress: 40,
    requiredSkills: ['React', 'D3.js', 'TypeScript', 'GraphQL'],
    teamSize: 2,
    assignedEngineers: 2,
    manager: 'John Manager',
    budget: 60000,
    priority: 'medium',
    assignedTeam: [
      { name: 'Alice Johnson', role: 'Frontend Developer', allocation: 25 },
      { name: 'David Chen', role: 'Data Engineer', allocation: 30 }
    ]
  },
  {
    id: '4',
    name: 'Infrastructure Migration',
    description: 'Migration of legacy systems to cloud infrastructure with improved scalability',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-08-01',
    progress: 75,
    requiredSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
    teamSize: 3,
    assignedEngineers: 2,
    manager: 'John Manager',
    budget: 200000,
    priority: 'high',
    assignedTeam: [
      { name: 'David Chen', role: 'DevOps Engineer', allocation: 50 },
      { name: 'Bob Smith', role: 'Backend Developer', allocation: 20 }
    ]
  },
  {
    id: '5',
    name: 'Security Audit & Updates',
    description: 'Comprehensive security audit and implementation of security improvements',
    status: 'completed',
    startDate: '2023-11-01',
    endDate: '2024-01-31',
    progress: 100,
    requiredSkills: ['Security', 'Node.js', 'Python', 'Penetration Testing'],
    teamSize: 2,
    assignedEngineers: 2,
    manager: 'John Manager',
    budget: 45000,
    priority: 'high',
    assignedTeam: []
  }
];

const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.requiredSkills.some(skill => 
                           skill.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === '' || project.status === statusFilter;
    const matchesPriority = priorityFilter === '' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'planning': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage and track your engineering projects</p>
        </div>
        <Button onClick={() => setIsProjectFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <div className="text-sm text-gray-600 flex items-center">
              <span>{filteredProjects.length} projects found</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="space-y-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(project.status)}
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {project.description}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority} priority
                  </Badge>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Project Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Team</p>
                    <p className="text-xs text-gray-600">
                      {project.assignedEngineers}/{project.teamSize} engineers
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-xs text-gray-600">{project.progress}% complete</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-xs text-gray-600">{formatBudget(project.budget)}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Project Progress</span>
                  <span className="text-sm text-gray-600">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* Required Skills */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Team Assignment */}
              {project.assignedTeam.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Assigned Team</p>
                  <div className="space-y-2">
                    {project.assignedTeam.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {member.allocation}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Assign Engineers
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProject(project);
                    setIsProjectFormOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {project.status !== 'completed' && (
                  <Button variant="outline" size="sm">
                    Update Progress
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or create a new project</p>
            <Button className="mt-4" onClick={() => setIsProjectFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {mockProjects.filter(p => p.status === 'planning').length}
            </p>
            <p className="text-sm text-gray-600">Planning</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {mockProjects.filter(p => p.status === 'active').length}
            </p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {mockProjects.filter(p => p.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatBudget(mockProjects.reduce((sum, p) => sum + p.budget, 0))}
            </p>
            <p className="text-sm text-gray-600">Total Budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Form */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
          setSelectedProject(null);
        }}
        onSuccess={() => {
          // In a real app, this would refetch projects
          console.log('Project saved successfully');
        }}
        project={selectedProject}
      />
    </div>
  );
};

export default Projects;