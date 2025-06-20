import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users2, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  User,
  FolderOpen,
  MoreHorizontal,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { assignmentService } from '@/services/assignmentService';
import { engineerService } from '@/services/engineerService';
import { projectService } from '@/services/projectService';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import AssignmentForm from '@/components/forms/AssignmentForm';
import type { Assignment, EngineerWithAssignments, Project } from '@/types';

interface PopulatedAssignment extends Assignment {
  engineerId: {
    _id: string;
    name: string;
    email: string;
    seniority: string;
    department: string;
  };
  projectId: {
    _id: string;
    name: string;
    status: string;
    priority: string;
  };
}

const Assignments: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [assignments, setAssignments] = useState<PopulatedAssignment[]>([]);
  const [engineers, setEngineers] = useState<EngineerWithAssignments[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await assignmentService.getAllAssignments();
      
      if (response.success && response.data) {
        setAssignments(response.data.assignments || []);
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load assignments'
        });
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: `Failed to load assignments: ${(error as Error).message}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const loadSupportingData = useCallback(async () => {
    try {
      const [engineersResponse, projectsResponse] = await Promise.all([
        engineerService.getAllEngineers(),
        projectService.getAllProjects()
      ]);

      if (engineersResponse.success && engineersResponse.data) {
        setEngineers(engineersResponse.data.engineers || []);
      }
      
      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data.projects || []);
      }
    } catch (error) {
      console.error('Error loading supporting data:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAssignments();
      loadSupportingData();
    }
  }, [loadAssignments, loadSupportingData, user]);

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setIsFormOpen(true);
  };

  const handleEditAssignment = (assignment: PopulatedAssignment) => {
    // Transform populated assignment back to regular assignment format for editing
    const editableAssignment: Assignment = {
      ...assignment,
      engineerId: typeof assignment.engineerId === 'object' ? assignment.engineerId._id : assignment.engineerId,
      projectId: typeof assignment.projectId === 'object' ? assignment.projectId._id : assignment.projectId,
    };
    
    setEditingAssignment(editableAssignment);
    setIsFormOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const response = await assignmentService.deleteAssignment(assignmentId);
      if (response.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Assignment deleted successfully'
        });
        loadAssignments();
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete assignment'
      });
    }
  };

  const handleFormSuccess = () => {
    loadAssignments();
    setIsFormOpen(false);
    setEditingAssignment(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (priority) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'low':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = 
      assignment.engineerId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.projectId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesRole = filterRole === 'all' || assignment.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users2 className="h-8 w-8 text-blue-600" />
            Resource Allocation
          </h1>
          <p className="text-gray-600 mt-1">
            Manage engineer assignments across projects
          </p>
        </div>
        
        {user?.role === 'manager' && (
          <Button
            onClick={handleCreateAssignment}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="developer">Developer</option>
            <option value="lead">Tech Lead</option>
            <option value="architect">Architect</option>
            <option value="tester">QA/Tester</option>
            <option value="devops">DevOps Engineer</option>
            <option value="analyst">Business Analyst</option>
            <option value="designer">Designer</option>
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Assignments ({filteredAssignments.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engineer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {user?.role === 'manager' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {assignment.engineerId?.name?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.engineerId?.name || 'Unknown Engineer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.engineerId?.department} • {assignment.engineerId?.seniority}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FolderOpen className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.projectId?.name || 'Unknown Project'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={getPriorityBadge(assignment.projectId?.priority || 'medium')}>
                              {assignment.projectId?.priority || 'medium'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 capitalize">
                          {assignment.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {assignment.allocationPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          <div>{formatDate(assignment.startDate)}</div>
                          <div className="text-gray-500">to {formatDate(assignment.endDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assignment.status)}
                        <span className={getStatusBadge(assignment.status)}>
                          {assignment.status}
                        </span>
                      </div>
                    </td>
                    {user?.role === 'manager' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAssignment(assignment)}
                            className="flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment._id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user?.role === 'manager' ? 7 : 6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users2 className="h-12 w-12 mb-4 opacity-40" />
                      <h3 className="text-lg font-medium mb-2">No assignments found</h3>
                      <p className="text-sm">
                        {searchTerm || filterStatus !== 'all' || filterRole !== 'all'
                          ? 'Try adjusting your search criteria'
                          : 'Get started by creating your first assignment'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Form Modal */}
      {isFormOpen && (
        <AssignmentForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          assignment={editingAssignment}
        />
      )}
    </div>
  );
};

export default Assignments;