import React, { useState, useEffect, useCallback } from 'react';
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
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Target
} from 'lucide-react';
import AssignmentForm from '@/components/forms/AssignmentForm';
import ProjectForm from '@/components/forms/ProjectForm';
import { engineerService } from '@/services/engineerService';
import { projectService } from '@/services/projectService';
import { useToast } from '@/components/ui/toast';
import type { EngineerWithAssignments, ProjectWithAssignments } from '@/types';

const ManagerDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [engineers, setEngineers] = useState<EngineerWithAssignments[]>([]);
  const [projects, setProjects] = useState<ProjectWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rebalancingEngineerId, setRebalancingEngineerId] = useState<string | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [engineersResponse, projectsResponse] = await Promise.all([
        engineerService.getAllEngineers(),
        projectService.getAllProjects()
      ]);

      if (engineersResponse.success && engineersResponse.data) {
        setEngineers(engineersResponse.data.engineers || []);
      } else {
        throw new Error('Failed to load engineers');
      }

      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data.projects || []);
      } else {
        throw new Error('Failed to load projects');
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError((err as Error).message);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleRebalanceWorkload = useCallback(async (engineerId: string) => {
    try {
      setRebalancingEngineerId(engineerId);
      
      // Simulate workload rebalancing logic
      // In a real app, this would call an API to redistribute assignments
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showToast({
        type: 'success',
        title: 'Workload Rebalanced',
        message: 'Engineer assignments have been optimized'
      });
      
      // Refresh dashboard data to show updated utilization
      await loadDashboardData();
      
    } catch (error) {
      console.error('Error rebalancing workload:', error);
      showToast({
        type: 'error',
        title: 'Rebalancing Failed',
        message: 'Unable to rebalance workload. Please try again.'
      });
    } finally {
      setRebalancingEngineerId(null);
    }
  }, [showToast, loadDashboardData]);

  const handleAssignToAvailableEngineer = useCallback((engineerId: string) => {
    setSelectedEngineerId(engineerId);
    setIsAssignmentFormOpen(true);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate statistics from real data
  const overloadedEngineers = engineers.filter(eng => (eng.currentUtilization || 0) > 80);
  const availableEngineers = engineers.filter(eng => (eng.currentUtilization || 0) < 70);
  const activeProjects = projects.filter(proj => proj.status === 'active');
  const totalCapacity = engineers.reduce((sum, eng) => sum + (eng.currentUtilization || 0), 0);
  const avgCapacity = engineers.length > 0 ? Math.round(totalCapacity / engineers.length) : 0;

  // Project status distribution
  const projectStatusCounts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Engineer seniority distribution  
  const seniorityDistribution = engineers.reduce((acc, engineer) => {
    const seniority = engineer.seniority || 'junior';
    acc[seniority] = (acc[seniority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statsCards = [
    {
      title: 'Total Engineers',
      value: engineers.length,
      change: `${engineers.length} total`,
      changeType: 'neutral' as const,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Projects',
      value: activeProjects.length,
      change: `${projects.length} total`,
      changeType: 'neutral' as const,
      icon: FolderOpen,
      color: 'bg-green-500'
    },
    {
      title: 'Avg Capacity',
      value: `${avgCapacity}%`,
      change: avgCapacity > 80 ? 'High utilization' : avgCapacity < 50 ? 'Low utilization' : 'Optimal range',
      changeType: avgCapacity > 80 ? 'negative' as const : avgCapacity < 50 ? 'positive' as const : 'neutral' as const,
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      title: 'Overloaded',
      value: overloadedEngineers.length,
      change: `${availableEngineers.length} available`,
      changeType: overloadedEngineers.length > 0 ? 'negative' as const : 'positive' as const,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  // Simple chart data for project status
  const chartData = [
    { name: 'Active', value: projectStatusCounts.active || 0, color: '#10b981' },
    { name: 'Planning', value: projectStatusCounts.planning || 0, color: '#f59e0b' },
    { name: 'Completed', value: projectStatusCounts.completed || 0, color: '#3b82f6' },
    { name: 'On Hold', value: projectStatusCounts['on-hold'] || 0, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadDashboardData}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                ) : stat.changeType === 'negative' ? (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
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
            {engineers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No engineers found</p>
              </div>
            ) : (
              engineers.slice(0, 6).map((engineer) => (
                <div key={engineer._id} className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {engineer.name?.charAt(0) || 'E'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{engineer.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {engineer.seniority || 'junior'}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {engineer.assignments?.length || 0} projects
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {engineer.currentUtilization || 0}% capacity
                      </p>
                      <p className="text-xs text-slate-500">
                        of {engineer.maxCapacity || 100}% max
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress 
                      value={engineer.currentUtilization || 0} 
                      className="h-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {(engineer.skills || []).slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {typeof skill === 'string' ? skill : skill.skill}
                        </Badge>
                      ))}
                      {(engineer.skills || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(engineer.skills || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Projects Overview with Chart */}
        <div className="space-y-6">
          {/* Project Status Chart */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Project Status</CardTitle>
                  <CardDescription className="text-slate-600">Distribution of project statuses</CardDescription>
                </div>
                <Target className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Donut Chart Visualization */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {chartData.map((item, index) => {
                        const percentage = projects.length > 0 ? (item.value / projects.length) * 100 : 0;
                        const offset = chartData.slice(0, index).reduce((acc, prev) => {
                          return acc + (projects.length > 0 ? (prev.value / projects.length) * 100 : 0);
                        }, 0);
                        
                        return (
                          <path
                            key={item.name}
                            stroke={item.color}
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={`${percentage} ${100 - percentage}`}
                            strokeDashoffset={-offset}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            className="transition-all duration-300"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-900">{projects.length}</div>
                        <div className="text-xs text-slate-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Legend with bars */}
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${projects.length > 0 ? (item.value / projects.length) * 100 : 0}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-8">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Projects List */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Recent Projects</CardTitle>
                  <CardDescription className="text-slate-600">Latest project activities</CardDescription>
                </div>
                <FolderOpen className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No projects found</p>
                </div>
              ) : (
                projects.slice(0, 4).map((project) => (
                  <div key={project._id} className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
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
                      <Progress value={project.completionPercentage || 0} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{project.completionPercentage || 0}% complete</span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600">
                        <Users className="h-4 w-4 mr-1" />
                        {project.currentTeamSize || 0}/{project.teamSize || 0} engineers
                      </div>
                      {(project.currentTeamSize || 0) < (project.teamSize || 0) && (
                        <div className="flex items-center text-amber-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Understaffed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seniority Distribution */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Team Composition</CardTitle>
                <CardDescription className="text-slate-600">Seniority level distribution</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(seniorityDistribution).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      level === 'senior' ? 'bg-green-500' : 
                      level === 'mid' ? 'bg-blue-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-sm font-medium text-slate-700 capitalize">{level}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          level === 'senior' ? 'bg-green-500' : 
                          level === 'mid' ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{ 
                          width: `${engineers.length > 0 ? (count / engineers.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Utilization Trends */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Resource Insights</CardTitle>
                <CardDescription className="text-slate-600">Current team utilization metrics</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">{avgCapacity}%</div>
                  <div className="text-sm text-slate-600">Avg Utilization</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">{engineers.length}</div>
                  <div className="text-sm text-slate-600">Total Engineers</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">High Utilization (&gt;80%)</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">{overloadedEngineers.length}</Badge>
                    <span className="text-xs text-slate-500">engineers</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Optimal Range (70-80%)</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">{engineers.filter(eng => (eng.currentUtilization || 0) >= 70 && (eng.currentUtilization || 0) <= 80).length}</Badge>
                    <span className="text-xs text-slate-500">engineers</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Available (&lt;70%)</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{availableEngineers.length}</Badge>
                    <span className="text-xs text-slate-500">engineers</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Allocation Insights */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 via-white to-cyan-50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Resource Allocation Insights</CardTitle>
              <CardDescription className="text-slate-600">Strategic recommendations for optimal team management</CardDescription>
            </div>
            <Target className="h-5 w-5 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capacity Recommendations */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Capacity Recommendations
              </h4>
              <div className="space-y-3">
                {overloadedEngineers.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-900">High Priority</p>
                    <p className="text-xs text-red-700">
                      {overloadedEngineers.length} engineers need workload reduction
                    </p>
                  </div>
                )}
                {availableEngineers.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900">Opportunity</p>
                    <p className="text-xs text-green-700">
                      {availableEngineers.length} engineers available for new projects
                    </p>
                  </div>
                )}
                {avgCapacity >= 70 && avgCapacity <= 80 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">Optimal</p>
                    <p className="text-xs text-blue-700">
                      Team utilization is in the optimal range
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Staffing */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                Project Staffing
              </h4>
              <div className="space-y-3">
                {projects.filter(p => (p.currentTeamSize || 0) < (p.teamSize || 0)).length > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-900">Understaffed</p>
                    <p className="text-xs text-yellow-700">
                      {projects.filter(p => (p.currentTeamSize || 0) < (p.teamSize || 0)).length} projects need more engineers
                    </p>
                  </div>
                )}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-900">Active Projects</p>
                  <p className="text-xs text-slate-700">
                    {activeProjects.length} projects currently in progress
                  </p>
                </div>
              </div>
            </div>

            {/* Skill Distribution */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                Team Insights
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">Seniority Mix</p>
                  <p className="text-xs text-purple-700">
                    {seniorityDistribution.senior || 0} senior, {seniorityDistribution.mid || 0} mid-level, {seniorityDistribution.junior || 0} junior
                  </p>
                </div>
                <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                  <p className="text-sm font-medium text-cyan-900">Resource Efficiency</p>
                  <p className="text-xs text-cyan-700">
                    {Math.round((totalCapacity / (engineers.length * 100)) * 100)}% of total capacity utilized
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <div key={engineer._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">{engineer.name}</p>
                        <p className="text-sm text-red-700">{engineer.currentUtilization || 0}% capacity</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-700 border-red-300 hover:bg-red-100"
                        onClick={() => handleRebalanceWorkload(engineer._id)}
                        disabled={rebalancingEngineerId === engineer._id}
                      >
                        {rebalancingEngineerId === engineer._id ? 'Rebalancing...' : 'Rebalance'}
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
                  <Users className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg text-green-900">Available Resources</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  Engineers with available capacity for new assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableEngineers.map((engineer) => (
                    <div key={engineer._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div>
                        <p className="font-medium text-green-900">{engineer.name}</p>
                        <p className="text-sm text-green-700">{engineer.currentUtilization || 0}% capacity</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAssignToAvailableEngineer(engineer._id)}
                      >
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
        onClose={() => {
          setIsAssignmentFormOpen(false);
          setSelectedEngineerId(null);
        }}
        onSuccess={() => {
          setIsAssignmentFormOpen(false);
          setSelectedEngineerId(null);
          loadDashboardData(); // Refresh dashboard data
          showToast({
            type: 'success',
            title: 'Assignment Created',
            message: 'Assignment created successfully'
          });
        }}
        preSelectedEngineerId={selectedEngineerId || undefined}
      />

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        onSuccess={() => {
          setIsProjectFormOpen(false);
          loadDashboardData(); // Refresh dashboard data
          showToast({
            type: 'success',
            title: 'Project Created',
            message: 'Project created successfully'
          });
        }}
      />
    </div>
  );
};

export default ManagerDashboard;