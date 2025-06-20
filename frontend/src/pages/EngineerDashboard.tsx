import React from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Mock data for engineer assignments
const mockAssignments = [
  {
    id: '1',
    projectName: 'E-commerce Platform',
    role: 'Frontend Developer',
    allocation: 60,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    status: 'active',
    progress: 65,
    description: 'Building the user interface for the new e-commerce platform'
  },
  {
    id: '2',
    projectName: 'Analytics Dashboard',
    role: 'React Developer',
    allocation: 25,
    startDate: '2024-02-01',
    endDate: '2024-04-01',
    status: 'active',
    progress: 40,
    description: 'Developing data visualization components'
  },
  {
    id: '3',
    projectName: 'Mobile App Backend',
    role: 'Full Stack Developer',
    allocation: 40,
    startDate: '2024-03-01',
    endDate: '2024-05-01',
    status: 'upcoming',
    progress: 0,
    description: 'API development for mobile application'
  }
];

const EngineerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const activeAssignments = mockAssignments.filter(a => a.status === 'active');
  const upcomingAssignments = mockAssignments.filter(a => a.status === 'upcoming');
  const totalAllocation = activeAssignments.reduce((sum, a) => sum + a.allocation, 0);
  const availableCapacity = (user?.maxCapacity || 100) - totalAllocation;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
              activeAssignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{assignment.projectName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {assignment.role}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {assignment.allocation}% allocation
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
                      <span className="font-medium">{assignment.progress}%</span>
                    </div>
                    <Progress value={assignment.progress} className="h-2" />
                  </div>
                </div>
              ))
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
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{assignment.projectName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {assignment.role}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Starts {formatDate(assignment.startDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {assignment.allocation}% allocation
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {assignment.status}
                    </Badge>
                  </div>
                </div>
              ))}
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