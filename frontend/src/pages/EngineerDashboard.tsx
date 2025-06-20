import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  User, 
  Briefcase,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { assignmentService } from '@/services/assignmentService';
import { useToast } from '@/components/ui/toast';
import type { Assignment } from '@/types';

const EngineerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssignments = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await assignmentService.getCurrentAssignments();
        if (response.success && response.data) {
          setAssignments(response.data.assignments || []);
        } else {
          throw new Error('Failed to load assignments');
        }
      } catch (err) {
        console.error('Error loading assignments:', err);
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load your assignments'
        });
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [user, showToast]);

  const activeAssignments = assignments.filter(a => a.status === 'active');
  const upcomingAssignments = assignments.filter(a => a.status !== 'active' && a.status !== 'completed');
  const totalAllocation = activeAssignments.reduce((sum, a) => sum + (a.allocationPercentage || 0), 0);
  const availableCapacity = (user?.maxCapacity || 100) - totalAllocation;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 capitalize">{user?.seniority} {user?.role}</span>
          </div>
        </div>
      </div>

      {/* Capacity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Allocation</p>
                <p className="text-2xl font-bold text-gray-900">{totalAllocation}%</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={totalAllocation} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Capacity</p>
                <p className="text-2xl font-bold text-green-600">{availableCapacity}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{activeAssignments.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>My Skills</CardTitle>
          <CardDescription>Technologies and expertise areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user?.skills?.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {skill.skill} ({skill.level})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>Projects you're currently working on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAssignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active assignments</p>
              </div>
            ) : (
              activeAssignments.map((assignment) => {
                const projectName = typeof assignment.projectId === 'object' ? assignment.projectId.name : 'Project';
                return (
                  <div key={assignment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{projectName}</h4>
                        <p className="text-sm text-gray-600 mt-1">{assignment.notes || 'No description available'}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {assignment.role}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(assignment.startDate.toString())} - {formatDate(assignment.endDate.toString())}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {assignment.allocationPercentage}% allocation
                          </div>
                        </div>
                      </div>
                      <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{assignment.completionPercentage || 0}%</span>
                      </div>
                      <Progress value={assignment.completionPercentage || 0} className="h-2" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assignments */}
      {upcomingAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>Projects starting soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => {
                const projectName = typeof assignment.projectId === 'object' ? assignment.projectId.name : 'Project';
                return (
                  <div key={assignment._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{projectName}</h4>
                        <p className="text-sm text-gray-600 mt-1">{assignment.notes || 'No description available'}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {assignment.role}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Starts {formatDate(assignment.startDate.toString())}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {assignment.allocationPercentage}% allocation
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workload Alert */}
      {totalAllocation > 90 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">High Workload Alert</p>
                <p className="text-sm text-red-700">
                  You're currently allocated at {totalAllocation}%. Consider discussing workload with your manager.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EngineerDashboard;