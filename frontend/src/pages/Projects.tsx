import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/projectService';
import { useToast } from '@/components/ui/toast';
import Modal from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import type { ProjectWithAssignments } from '@/types';

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithAssignments | null>(null);
  const [projects, setProjects] = useState<ProjectWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressProject, setProgressProject] = useState<ProjectWithAssignments | null>(null);
  const [newProgress, setNewProgress] = useState(0);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewDetailsProject, setViewDetailsProject] = useState<ProjectWithAssignments | null>(null);
  const { showToast } = useToast();

  // Fetch projects based on user role
  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAllProjects();
      
      if (response.success && response.data) {
        setProjects(response.data.projects || []);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressProject) return;
    
    try {
      const response = await projectService.updateProjectProgress(progressProject._id, newProgress);
      if (response.success) {
        showToast({ type: 'success', title: 'Project progress updated successfully' });
        setIsProgressModalOpen(false);
        setProgressProject(null);
        fetchProjects(); // Refresh the projects list
      } else {
        showToast({ type: 'error', title: 'Failed to update progress' });
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      showToast({ type: 'error', title: 'Failed to update progress' });
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.requiredSkills || []).some(skill => {
                           const skillText = typeof skill === 'string' ? skill : skill.skill || '';
                           return skillText.toLowerCase().includes(searchTerm.toLowerCase());
                         });
    
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
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'engineer' ? 'My Projects' : 'Projects'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'engineer' 
              ? 'View projects you are assigned to' 
              : 'Manage and track your engineering projects'}
          </p>
        </div>
        {user?.role === 'manager' && (
          <Button onClick={() => setIsProjectFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
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

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-600 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Projects</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchProjects}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
          <Card key={project._id} className="hover:shadow-lg transition-shadow h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(project.status)}
                    <CardTitle className="text-lg leading-tight">{project.name || 'Unnamed Project'}</CardTitle>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">
                    {project.description || 'No description available'}
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-1 ml-2">
                  <Badge className={`${getPriorityColor(project.priority || 'medium')} text-xs`}>
                    {project.priority || 'medium'}
                  </Badge>
                  <Badge className={`${getStatusColor(project.status || 'planning')} text-xs`}>
                    {project.status || 'planning'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium">Timeline</p>
                    <p className="text-xs text-gray-500 truncate">
                      {project.startDate ? formatDate(project.startDate.toString()) : 'TBD'} - {project.endDate ? formatDate(project.endDate.toString()) : 'TBD'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium">Team</p>
                    <p className="text-xs text-gray-500">
                      {project.currentTeamSize || 0}/{project.teamSize || 0} engineers
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Target className="h-3 w-3 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium">Progress</p>
                    <p className="text-xs text-gray-500">{project.completionPercentage || 0}% complete</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-3 w-3 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium">Budget</p>
                    <p className="text-xs text-gray-500">{formatBudget(project.budget || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Project Progress</span>
                  <span className={`text-xs font-medium ${
                    (project.completionPercentage || 0) >= 80 ? 'text-green-600' :
                    (project.completionPercentage || 0) >= 50 ? 'text-blue-600' :
                    (project.completionPercentage || 0) >= 25 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {project.completionPercentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      (project.completionPercentage || 0) >= 80 ? 'bg-green-500' :
                      (project.completionPercentage || 0) >= 50 ? 'bg-blue-500' :
                      (project.completionPercentage || 0) >= 25 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${project.completionPercentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Required Skills */}
              {project.requiredSkills && project.requiredSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Required Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {project.requiredSkills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs py-0 px-1 h-5">
                        {typeof skill === 'string' ? skill : skill.skill}
                      </Badge>
                    ))}
                    {project.requiredSkills.length > 3 && (
                      <Badge variant="outline" className="text-xs py-0 px-1 h-5">
                        +{project.requiredSkills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Team Assignment */}
              {project.assignments && project.assignments.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Assigned Team</p>
                  <div className="flex items-center space-x-2">
                    {/* Overlapping avatars */}
                    <div className="flex -space-x-1">
                      {project.assignments.slice(0, 3).map((assignment, index) => {
                        const engineer = typeof assignment.engineerId === 'object' ? assignment.engineerId : null;
                        const initials = engineer?.name ? engineer.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'E';
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                        const bgColor = colors[index % colors.length];
                        
                        return (
                          <div
                            key={assignment._id || index}
                            className="relative group"
                          >
                            <div
                              className={`relative w-6 h-6 ${bgColor} rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 hover:shadow-lg`}
                            >
                              <span className="text-white text-xs font-medium">
                                {initials}
                              </span>
                            </div>
                            
                            {/* Custom Tooltip */}
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                                <div className="font-medium">{engineer?.name || 'Engineer'}</div>
                                <div className="text-gray-300">{assignment.role}</div>
                                <div className="text-gray-300">{assignment.allocationPercentage}% allocated</div>
                                {assignment.completionPercentage !== undefined && (
                                  <div className="text-gray-300">{assignment.completionPercentage}% complete</div>
                                )}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {project.assignments.length > 3 && (
                        <div className="relative group">
                          <div className="relative w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 hover:shadow-lg">
                            <span className="text-white text-xs font-medium">
                              +{project.assignments.length - 3}
                            </span>
                          </div>
                          
                          {/* Tooltip for extra members */}
                          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap max-w-48">
                              <div className="font-medium">Additional Team Members</div>
                              {project.assignments.slice(3).map((assignment, idx) => {
                                const engineer = typeof assignment.engineerId === 'object' ? assignment.engineerId : null;
                                return (
                                  <div key={idx} className="text-gray-300 mt-1">
                                    {engineer?.name || 'Engineer'} - {assignment.role}
                                  </div>
                                );
                              })}
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Team member list */}
                    <div className="flex-1">
                      <div className="text-xs text-gray-600">
                        {project.assignments.slice(0, 1).map((assignment, index) => {
                          const engineer = typeof assignment.engineerId === 'object' ? assignment.engineerId : null;
                          return (
                            <div key={assignment._id || index} className="flex items-center justify-between">
                              <span className="truncate">
                                {engineer?.name || 'Engineer'} • {assignment.role}
                              </span>
                              <span className="text-gray-500 ml-1">{assignment.allocationPercentage}%</span>
                            </div>
                          );
                        })}
                        {project.assignments.length > 1 && (
                          <div className="text-gray-500 text-xs">
                            +{project.assignments.length - 1} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => {
                    setViewDetailsProject(project);
                    setIsViewDetailsOpen(true);
                  }}
                >
                  View Details
                </Button>
                {/* Only managers can manage projects and assignments */}
                {user?.role === 'manager' && (
                  <>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Assign
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setSelectedProject(project);
                        setIsProjectFormOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {project.status !== 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setProgressProject(project);
                          setNewProgress(project.completionPercentage || 0);
                          setIsProgressModalOpen(true);
                        }}
                      >
                        Progress
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && !error && filteredProjects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500">
              {user?.role === 'engineer' 
                ? 'You are not currently assigned to any projects' 
                : 'Try adjusting your search criteria or create a new project'}
            </p>
            {user?.role === 'manager' && (
              <Button className="mt-4" onClick={() => setIsProjectFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {projects.filter(p => p.status === 'planning').length}
              </p>
              <p className="text-sm text-gray-600">Planning</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatBudget(projects.reduce((sum, p) => sum + (p.budget || 0), 0))}
              </p>
              <p className="text-sm text-gray-600">Total Budget</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Details Modal */}
      <Modal
        isOpen={isViewDetailsOpen}
        onClose={() => {
          setIsViewDetailsOpen(false);
          setViewDetailsProject(null);
        }}
        title="Project Details"
        size="xl"
      >
        {viewDetailsProject && (
          <div className="space-y-6">
            {/* Project Header */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{viewDetailsProject.name}</h3>
                <div className="flex space-x-2">
                  <Badge className={`${getStatusColor(viewDetailsProject.status || 'planning')}`}>
                    {viewDetailsProject.status || 'planning'}
                  </Badge>
                  <Badge className={`${getPriorityColor(viewDetailsProject.priority || 'medium')}`}>
                    {viewDetailsProject.priority || 'medium'}
                  </Badge>
                </div>
              </div>
              <p className="text-gray-600">{viewDetailsProject.description}</p>
            </div>

            {/* Project Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Start: {viewDetailsProject.startDate ? formatDate(viewDetailsProject.startDate.toString()) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        End: {viewDetailsProject.endDate ? formatDate(viewDetailsProject.endDate.toString()) : 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Resources</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Team Size: {viewDetailsProject.currentTeamSize || 0}/{viewDetailsProject.teamSize || 0} engineers
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Budget: {formatBudget(viewDetailsProject.budget || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Progress</span>
                      <span className="text-sm font-medium">{viewDetailsProject.completionPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (viewDetailsProject.completionPercentage || 0) >= 80 ? 'bg-green-500' :
                          (viewDetailsProject.completionPercentage || 0) >= 50 ? 'bg-blue-500' :
                          (viewDetailsProject.completionPercentage || 0) >= 25 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${viewDetailsProject.completionPercentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {viewDetailsProject.tags && viewDetailsProject.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {viewDetailsProject.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Required Skills */}
            {viewDetailsProject.requiredSkills && viewDetailsProject.requiredSkills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Required Skills</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {viewDetailsProject.requiredSkills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {typeof skill === 'string' ? skill : skill.skill}
                        </div>
                        {typeof skill === 'object' && skill.level && (
                          <div className="text-xs text-gray-500 capitalize">{skill.level}</div>
                        )}
                      </div>
                      {typeof skill === 'object' && skill.priority && (
                        <Badge 
                          variant={skill.priority === 'must-have' ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {skill.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Assignments */}
            {viewDetailsProject.assignments && viewDetailsProject.assignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Team Assignments</h4>
                <div className="space-y-3">
                  {viewDetailsProject.assignments.map((assignment, index) => {
                    const engineer = typeof assignment.engineerId === 'object' ? assignment.engineerId : null;
                    return (
                      <div key={assignment._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {engineer?.name ? engineer.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'E'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{engineer?.name || 'Engineer'}</div>
                            <div className="text-xs text-gray-500">{assignment.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{assignment.allocationPercentage}% allocated</div>
                          {assignment.completionPercentage !== undefined && (
                            <div className="text-xs text-gray-500">{assignment.completionPercentage}% complete</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDetailsOpen(false);
                  setViewDetailsProject(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Project Form */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
          setSelectedProject(null);
        }}
        onSuccess={() => {
          fetchProjects();
        }}
        project={selectedProject || undefined}
      />

      {/* Progress Update Modal */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false);
          setProgressProject(null);
        }}
        title="Update Project Progress"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="progress">Completion Percentage</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={newProgress}
              onChange={(e) => setNewProgress(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Current progress: {progressProject?.completionPercentage || 0}%
            </p>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleUpdateProgress}
              disabled={newProgress < 0 || newProgress > 100}
            >
              Update Progress
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsProgressModalOpen(false);
                setProgressProject(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;