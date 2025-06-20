import React from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Building2
} from 'lucide-react';
import { useState } from 'react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Overview & Analytics' },
    { name: 'Engineers', href: '/engineers', icon: Users, description: 'Team Management' },
    { name: 'Projects', href: '/projects', icon: FolderOpen, description: 'Project Portfolio' },
    ...(user?.role === 'manager' ? [
      { name: 'Assignments', href: '/assignments', icon: Settings, description: 'Resource Allocation' }
    ] : [])
  ];

  const getPageTitle = () => {
    const currentPage = navigation.find(item => item.href === location.pathname);
    return currentPage?.name || 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const navItem = navigation.find(item => item.href === path);
      return {
        name: navItem?.name || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: path,
        isLast: index === pathSegments.length - 1
      };
    });
  };

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Mobile sidebar content */}
            <div className="flex flex-col h-full">
              {/* Mobile header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">ERM System</h2>
                    <p className="text-xs text-slate-500">Resource Management</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.href 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <div>
                      <div>{item.name}</div>
                      <div className={`text-xs ${
                        location.pathname === item.href ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </nav>

              {/* Mobile user section */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-slate-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-80 bg-white border-r border-slate-200">
          {/* Desktop sidebar header */}
          <div className="flex items-center px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">ERM System</h2>
                <p className="text-sm text-slate-500">Engineering Resource Management</p>
              </div>
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.href 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${
                  location.pathname === item.href ? 'text-white' : 'text-slate-400'
                }`} />
                <div className="flex-1">
                  <div>{item.name}</div>
                  <div className={`text-xs ${
                    location.pathname === item.href ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
                {location.pathname === item.href && (
                  <ChevronRight className="h-4 w-4 text-white" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop user section */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-slate-600 hover:bg-slate-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            {/* Left side - Mobile menu + Breadcrumbs */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumbs */}
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <Link to="/dashboard" className="text-slate-500 hover:text-slate-700 font-medium">
                  Home
                </Link>
                {getBreadcrumbs().map((crumb) => (
                  <React.Fragment key={crumb.path}>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    {crumb.isLast ? (
                      <span className="text-slate-900 font-medium">{crumb.name}</span>
                    ) : (
                      <Link to={crumb.path} className="text-slate-500 hover:text-slate-700 font-medium">
                        {crumb.name}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right side - Search, Notifications */}
            <div className="flex items-center space-x-3">
              {/* Search - Desktop only */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
                  />
                </div>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>

              {/* Mobile logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="lg:hidden"
              >
                <LogOut className="h-5 w-5 text-slate-600" />
              </Button>
            </div>
          </div>

          {/* Page title section */}
          <div className="px-4 lg:px-6 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">{getPageTitle()}</h1>
            <p className="text-slate-600 mt-1">
              {navigation.find(item => item.href === location.pathname)?.description || 'Welcome to your dashboard'}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;