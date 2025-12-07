import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectService } from '../services/projectService';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FolderKanban, Clock, CheckCircle, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total_projects: 0,
    active_projects: 0,
    completed_tasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const result = await projectService.getAll({ limit: 5 });
      if (result.success) {
        setProjects(result.data.items || []);
        // Calculate basic stats
        const active = result.data.items.filter(p => p.status === 'active').length;
        setStats({
          total_projects: result.data.total || 0,
          active_projects: active,
          completed_tasks: 0
        });
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.total_projects}
                </p>
              </div>
              <FolderKanban className="text-primary-600" size={40} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.active_projects}
                </p>
              </div>
              <Clock className="text-green-600" size={40} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Members</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {user?.role === 'admin' ? '12' : '5'}
                </p>
              </div>
              <Users className="text-purple-600" size={40} />
            </div>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card 
          title="Recent Projects"
          action={
            <Link to="/projects">
              <Button variant="primary" size="sm">View All</Button>
            </Link>
          }
        >
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="mx-auto text-gray-400" size={48} />
              <p className="mt-4 text-gray-500 dark:text-gray-400">No projects yet</p>
              <Link to="/projects">
                <Button variant="primary" size="md" className="mt-4">
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : project.status === 'completed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={`/projects/${project.id}/kanban`}>
                      <Button variant="primary" size="sm" className="flex items-center gap-2">
                        <FolderKanban size={14} />
                        <span>Kanban</span>
                      </Button>
                    </Link>
                    <Link to={`/projects/${project.id}/sprints`}>
                      <Button variant="secondary" size="sm" className="flex items-center gap-2">
                        <TrendingUp size={14} />
                        <span>Sprints</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
