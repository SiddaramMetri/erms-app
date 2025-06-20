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
import type { EngineerWithAssignments } from '@/types';
import EngineerForm from '@/components/forms/EngineerForm';
import AssignmentForm from '@/components/forms/AssignmentForm';
import { getCapacityInfo, getTeamCapacityStats } from '@/utils/capacityCalculations';


const Engineers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState('');
  const [engineers, setEngineers] = useState<EngineerWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEngineerFormOpen, setIsEngineerFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerWithAssignments | null>(null);

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
          <h1 className="text-2xl font-bold text-gray-900">Engineering Team</h1>
          <p className="text-gray-600">Manage and view your engineering team members</p>
        </div>
        <Button onClick={() => setIsEngineerFormOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Engineer
        </Button>
      </div>

      {/* Filters */}
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
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {engineer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
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
                    <AlertTriangle className="h-5 w-5 text-red-500" />
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
                  <Progress 
                    value={capacityInfo.utilizationPercentage} 
                    className="h-2"
                  />
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
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Projects</p>
                  <div className="space-y-1">
                    {(!engineer.assignments || engineer.assignments.length === 0) ? (
                      <p className="text-sm text-gray-500">No active projects</p>
                    ) : (
                      engineer.assignments.slice(0, 3).map((assignment, index) => (
                        <div key={assignment._id || index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 truncate">Project {index + 1}</span>
                          <span className="text-gray-500 ml-2">{assignment.allocationPercentage}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
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
                    Edit
                  </Button>
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

      {/* Summary Stats */}
      {!loading && !error && (() => {
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
        }}
      />
    </div>
  );
};

export default Engineers;