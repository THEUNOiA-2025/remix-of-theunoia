import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ShieldCheck, 
  FolderKanban, 
  UserCheck,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  pendingVerifications: number;
  activeFreelancers: number;
  totalProjects: number;
  openProjects: number;
  completedProjects: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingVerifications: 0,
    activeFreelancers: 0,
    totalProjects: 0,
    openProjects: 0,
    completedProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: usersCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch pending verifications
        const { count: pendingCount } = await supabase
          .from('student_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending');

        // Fetch active freelancers
        const { count: freelancersCount } = await supabase
          .from('freelancer_access')
          .select('*', { count: 'exact', head: true })
          .eq('has_access', true);

        // Fetch projects
        const { data: projects } = await supabase
          .from('user_projects')
          .select('status');

        const totalProjects = projects?.length || 0;
        const openProjects = projects?.filter(p => p.status === 'open').length || 0;
        const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

        setStats({
          totalUsers: usersCount || 0,
          pendingVerifications: pendingCount || 0,
          activeFreelancers: freelancersCount || 0,
          totalProjects,
          openProjects,
          completedProjects,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your platform's key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminStatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          variant="primary"
          description="Registered users on the platform"
        />
        <AdminStatsCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={Clock}
          variant="warning"
          description="Awaiting review"
        />
        <AdminStatsCard
          title="Active Freelancers"
          value={stats.activeFreelancers}
          icon={UserCheck}
          variant="success"
          description="Verified students with access"
        />
        <AdminStatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          variant="info"
          description={`${stats.openProjects} open, ${stats.completedProjects} completed`}
        />
        <AdminStatsCard
          title="Open Projects"
          value={stats.openProjects}
          icon={FolderKanban}
          variant="default"
          description="Available for bidding"
        />
        <AdminStatsCard
          title="Completed Projects"
          value={stats.completedProjects}
          icon={CheckCircle}
          variant="success"
          description="Successfully delivered"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-muted/50"
            onClick={() => navigate('/admin/verifications')}
          >
            <div className="flex items-center justify-between w-full">
              <ShieldCheck className="h-8 w-8 text-primary" />
              {stats.pendingVerifications > 0 && (
                <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2 py-1 rounded-full">
                  {stats.pendingVerifications} pending
                </span>
              )}
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Review Verifications</h3>
              <p className="text-sm text-muted-foreground">
                Approve or reject student verification requests
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-muted/50"
            onClick={() => navigate('/admin/users')}
          >
            <Users className="h-8 w-8 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                View and manage all registered users
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-muted/50"
            onClick={() => navigate('/admin/projects')}
          >
            <FolderKanban className="h-8 w-8 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold">View Projects</h3>
              <p className="text-sm text-muted-foreground">
                Browse all projects on the platform
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
