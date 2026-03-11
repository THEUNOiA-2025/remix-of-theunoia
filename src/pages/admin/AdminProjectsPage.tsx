import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number | null;
  created_at: string;
  category: string | null;
  user_id: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  bids_count?: number;
}

const AdminProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('user_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const userIds = [...new Set(projectsData?.map(p => p.user_id) || [])];

      // Fetch user profiles
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Fetch bids count for each project
      const projectIds = projectsData?.map(p => p.id) || [];
      const { data: bidsData } = await supabase
        .from('bids')
        .select('project_id')
        .in('project_id', projectIds);

      // Count bids per project
      const bidsCounts: Record<string, number> = {};
      bidsData?.forEach(bid => {
        bidsCounts[bid.project_id] = (bidsCounts[bid.project_id] || 0) + 1;
      });

      // Merge data
      const merged = projectsData?.map(project => ({
        ...project,
        user_profile: profilesData?.find(p => p.user_id === project.user_id),
        bids_count: bidsCounts[project.id] || 0,
      })) || [];

      setProjects(merged as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' ||
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.user_profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.user_profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green/30 text-green-foreground">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary/20 text-primary">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-accent-blue/20 text-accent-blue-foreground">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: projects.length,
    open: projects.filter(p => p.status === 'open').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Projects</h1>
        <p className="text-muted-foreground mt-1">
          View all projects on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or owner..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="open">Open ({statusCounts.open})</SelectItem>
            <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
            <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Title</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Bids</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium text-foreground truncate">{project.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.description?.slice(0, 50)}...
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {project.user_profile?.first_name} {project.user_profile?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.user_profile?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.category ? (
                      <Badge variant="secondary">{project.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.budget ? (
                      <span className="font-medium">₹{project.budget.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.bids_count}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status || 'open')}</TableCell>
                  <TableCell>
                    {format(new Date(project.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projects.length} projects
      </p>
    </div>
  );
};

export default AdminProjectsPage;
