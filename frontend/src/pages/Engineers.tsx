import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  MapPin,
  Star,
  AlertTriangle,
  Users,
  Edit,
  Settings
} from 'lucide-react';
import { engineerService } from '@/services/engineerService';
import { assignmentService } from '@/services/assignmentService';
import type { EngineerWithAssignments } from '@/types';
import EngineerForm from '@/components/forms/EngineerForm';
import AssignmentForm from '@/components/forms/AssignmentForm';
import { getCapacityInfo, getTeamCapacityStats } from '@/utils/capacityCalculations';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import Modal from '@/components/ui/modal';
import { Label } from '@/components/ui/label';


const Engineers: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState('');
  const [engineers, setEngineers] = useState<EngineerWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEngineerFormOpen, setIsEngineerFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerWithAssignments | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [newProgress, setNewProgress] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      setLoading(true);
      const response = await engineerService.getAllEngineers();
      if (response.success && response.data) {
        setEngineers(response.data.engineers || []);
      } else {
        setError('Failed to load engineers');
      }
    } catch (err) {
      setError('Failed to load engineers');
      console.error('Error fetching engineers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEngineers = engineers.filter(engineer => {
    const matchesSearch = engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         engineer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (engineer.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkill = skillFilter === '' || 
                        (engineer.skills || []).some(skill => 
                          skill.skill.toLowerCase().includes(skillFilter.toLowerCase())
                        );
    
    const matchesSeniority = seniorityFilter === '' || engineer.seniority === seniorityFilter;
    
    return matchesSearch && matchesSkill && matchesSeniority;
  });


  const handleUpdateAssignmentProgress = async () => {
    if (!selectedAssignment) return;
    
    try {
      const response = await assignmentService.updateAssignmentProgress(selectedAssignment._id, newProgress);
      if (response.success) {
        showToast({ type: 'success', title: 'Assignment progress updated successfully' });
        setIsProgressModalOpen(false);
        setSelectedAssignment(null);
        fetchEngineers(); // Refresh the engineers list
      } else {
        showToast({ type: 'error', title: 'Failed to update progress' });
      }
    } catch (err) {
      console.error('Error updating assignment progress:', err);
      showToast({ type: 'error', title: 'Failed to update progress' });
    }
  };

  const getSeniorityIcon = (seniority: string) => {
    switch (seniority) {
      case 'senior': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'mid': return <Star className="h-4 w-4 text-blue-500" />;
      default: return <Star className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'engineer' ? 'My Profile' : 'Engineering Team'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'engineer' 
              ? 'View and manage your profile information' 
              : 'Manage and view your engineering team members'}
          </p>
        </div>
        {user?.role === 'manager' && (
          <Button onClick={() => setIsEngineerFormOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Engineer
          </Button>
        )}
      </div>

      {/* Filters - Only show for managers */}
      {user?.role === 'manager' && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search engineers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                placeholder="Filter by skill..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={seniorityFilter}
                onChange={(e) => setSeniorityFilter(e.target.value)}
              >
                <option value="">All Seniority Levels</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading engineers...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Engineers</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchEngineers}>Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Engineers Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEngineers.map((engineer) => {
          const capacityInfo = getCapacityInfo(engineer);
          
          return (
            <Card key={engineer._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative group">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
                        <span className="text-white font-medium">
                          {engineer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      
                      {/* Engineer tooltip */}
                      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                          <div className="font-medium">{engineer.name}</div>
                          <div className="text-gray-300">{engineer.email}</div>
                          <div className="text-gray-300">{engineer.department} • {engineer.seniority}</div>
                          <div className="text-gray-300">Capacity: {capacityInfo.currentUtilization}% / {capacityInfo.maxCapacity}%</div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{engineer.name}</CardTitle>
                      <div className="flex items-center text-sm text-gray-500">
                        {getSeniorityIcon(engineer.seniority || 'junior')}
                        <span className="ml-1 capitalize">{engineer.seniority || 'junior'}</span>
                      </div>
                    </div>
                  </div>
                  {capacityInfo.status === 'overloaded' && (
                    <div className="relative group">
                      <AlertTriangle className="h-5 w-5 text-red-500 cursor-pointer" />
                      
                      {/* Overload warning tooltip */}
                      <div className="absolute bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="bg-red-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                          <div className="font-medium">⚠️ Overloaded Engineer</div>
                          <div className="text-red-200">Current: {capacityInfo.currentUtilization}%</div>
                          <div className="text-red-200">Maximum: {capacityInfo.maxCapacity}%</div>
                          {/* Arrow */}
                          <div className="absolute top-full right-4 border-4 border-transparent border-t-red-900"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {engineer.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {engineer.department}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {(engineer.skills || []).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill.skill} ({skill.level})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Capacity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Capacity</p>
                    <span className={`text-sm font-medium ${
                      capacityInfo.status === 'overloaded' ? 'text-red-600' :
                      capacityInfo.status === 'busy' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {capacityInfo.currentUtilization}% / {capacityInfo.maxCapacity}%
                    </span>
                  </div>
                  <div className="relative group">
                    <Progress 
                      value={capacityInfo.utilizationPercentage} 
                      className={`h-2 cursor-pointer ${
                        capacityInfo.status === 'overloaded' ? 'progress-red' :
                        capacityInfo.status === 'busy' ? 'progress-yellow' : 'progress-green'
                      }`}
                    />
                    
                    {/* Capacity tooltip */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        <div className="font-medium">Capacity Breakdown</div>
                        <div className="text-gray-300">Current Load: {capacityInfo.currentUtilization}%</div>
                        <div className="text-gray-300">Maximum: {capacityInfo.maxCapacity}%</div>
                        <div className="text-gray-300">Available: {capacityInfo.maxCapacity - capacityInfo.currentUtilization}%</div>
                        <div className={`${
                          capacityInfo.status === 'overloaded' ? 'text-red-300' :
                          capacityInfo.status === 'busy' ? 'text-yellow-300' : 'text-green-300'
                        }`}>
                          Status: {capacityInfo.status}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium inline-block ${
                    capacityInfo.status === 'overloaded' ? 'bg-red-100 text-red-600' :
                    capacityInfo.status === 'busy' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {capacityInfo.status === 'overloaded' && 'Overloaded'}
                    {capacityInfo.status === 'busy' && 'Busy'}
                    {capacityInfo.status === 'available' && 'Available'}
                  </div>
                </div>

                {/* Current Projects */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Current Projects</p>
                    {user?._id === engineer._id && engineer.assignments && engineer.assignments.length > 0 && (
                      <span className="text-xs text-blue-600 font-medium">Click "Update" to change progress</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(!engineer.assignments || engineer.assignments.length === 0) ? (
                      <div className="text-center py-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">No active projects</p>
                        {user?._id === engineer._id ? (
                          <p className="text-xs text-gray-400">Contact your manager to get assigned to projects</p>
                        ) : (
                          <p className="text-xs text-gray-400">Engineer is available for assignment</p>
                        )}
                      </div>
                    ) : (
                      engineer.assignments.slice(0, 3).map((assignment, index) => (
                        <div key={assignment._id || index} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 truncate font-medium">
                              {typeof assignment.projectId === 'object' && assignment.projectId?.name ? assignment.projectId.name : `Project ${index + 1}`}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                {assignment.role}
                              </span>
                              <span className="text-gray-500 text-xs">{assignment.allocationPercentage}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 relative group">
                              <div className="w-full bg-gray-200 rounded-full h-1.5 cursor-pointer">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    (assignment.completionPercentage || 0) >= 80 ? 'bg-green-500' :
                                    (assignment.completionPercentage || 0) >= 50 ? 'bg-blue-500' :
                                    (assignment.completionPercentage || 0) >= 25 ? 'bg-yellow-500' : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${assignment.completionPercentage || 0}%` }}
                                ></div>
                              </div>
                              
                              {/* Progress tooltip */}
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                                  <div className="font-medium">Assignment Progress</div>
                                  <div className="text-gray-300">{assignment.completionPercentage || 0}% completed</div>
                                  <div className="text-gray-300">Role: {assignment.role}</div>
                                  <div className="text-gray-300">Allocation: {assignment.allocationPercentage}%</div>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                            <span className={`text-xs ml-2 font-medium ${
                              (assignment.completionPercentage || 0) >= 80 ? 'text-green-600' :
                              (assignment.completionPercentage || 0) >= 50 ? 'text-blue-600' :
                              (assignment.completionPercentage || 0) >= 25 ? 'text-yellow-600' : 'text-gray-500'
                            }`}>
                              {assignment.completionPercentage || 0}%
                            </span>
                            {user?._id === engineer._id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 h-6 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 font-medium"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setNewProgress(assignment.completionPercentage || 0);
                                  setIsProgressModalOpen(true);
                                }}
                              >
                                ✏️ Update
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  {/* Engineers can only edit their own profile */}
                  {(user?.role === 'manager' || (user?.role === 'engineer' && engineer._id === user._id)) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedEngineer(engineer);
                        setIsEngineerFormOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {user?.role === 'engineer' ? 'Edit Profile' : 'Edit'}
                    </Button>
                  )}
                  {/* Only managers can create assignments */}
                  {user?.role === 'manager' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedEngineer(engineer);
                        setIsAssignmentFormOpen(true);
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      )}

      {/* No results */}
      {!loading && !error && filteredEngineers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No engineers found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats - Only show for managers */}
      {!loading && !error && user?.role === 'manager' && (() => {
        const teamStats = getTeamCapacityStats(filteredEngineers);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {teamStats.availableEngineers}
                </p>
                <p className="text-sm text-gray-600">Available Engineers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {teamStats.busyEngineers}
                </p>
                <p className="text-sm text-gray-600">Busy Engineers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {teamStats.overloadedEngineers}
                </p>
                <p className="text-sm text-gray-600">Overloaded Engineers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(teamStats.teamUtilizationPercentage)}%
                </p>
                <p className="text-sm text-gray-600">Team Utilization</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Forms */}
      <EngineerForm
        isOpen={isEngineerFormOpen}
        onClose={() => {
          setIsEngineerFormOpen(false);
          setSelectedEngineer(null);
        }}
        onSuccess={() => {
          fetchEngineers();
        }}
        engineer={selectedEngineer}
      />

      <AssignmentForm
        isOpen={isAssignmentFormOpen}
        onClose={() => {
          setIsAssignmentFormOpen(false);
          setSelectedEngineer(null);
        }}
        onSuccess={() => {
          fetchEngineers();
          setSelectedEngineer(null);
        }}
        preSelectedEngineerId={selectedEngineer?._id}
      />

      {/* Assignment Progress Update Modal */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false);
          setSelectedAssignment(null);
        }}
        title="Update Assignment Progress"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-blue-800 mb-1">How to Update Progress</h4>
            <p className="text-xs text-blue-600">
              Enter a percentage (0-100) that reflects how much of your work on this assignment is complete.
              This will automatically update the overall project progress.
            </p>
          </div>
          
          <div>
            <Label htmlFor="assignmentProgress" className="text-sm font-medium">
              Assignment Completion Percentage
            </Label>
            <div className="mt-1 relative">
              <Input
                id="assignmentProgress"
                type="number"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value) || 0)}
                className="pr-8"
                placeholder="Enter 0-100"
              />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Project:</span> {typeof selectedAssignment?.projectId === 'object' && selectedAssignment?.projectId?.name ? selectedAssignment.projectId.name : 'Unknown Project'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Your Role:</span> {selectedAssignment?.role || 'Developer'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Current Progress:</span> {selectedAssignment?.completionPercentage || 0}%
              </p>
            </div>
            
            {/* Quick progress buttons */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Quick Options:</p>
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setNewProgress(percent)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors duration-200"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleUpdateAssignmentProgress}
              disabled={newProgress < 0 || newProgress > 100}
            >
              Update Progress
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsProgressModalOpen(false);
                setSelectedAssignment(null);
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

export default Engineers;