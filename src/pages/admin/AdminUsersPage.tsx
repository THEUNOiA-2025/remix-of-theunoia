import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserTable } from '@/components/admin/UserTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string | null;
  profile_picture_url: string | null;
  created_at: string;
  city: string | null;
  phone: string | null;
  bio: string | null;
  is_admin?: boolean;
  freelancer_access?: {
    has_access: boolean;
  };
  student_verification?: {
    verification_status: string;
  };
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const userIds = profilesData?.map(p => p.user_id) || [];

      // Fetch freelancer access
      const { data: accessData } = await supabase
        .from('freelancer_access')
        .select('user_id, has_access')
        .in('user_id', userIds);

      // Fetch student verifications
      const { data: verificationsData } = await supabase
        .from('student_verifications')
        .select('user_id, verification_status')
        .in('user_id', userIds);

      // Fetch admin roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds)
        .eq('role', 'admin');

      // Merge data
      const merged = profilesData?.map(profile => ({
        ...profile,
        freelancer_access: accessData?.find(a => a.user_id === profile.user_id),
        student_verification: verificationsData?.find(v => v.user_id === profile.user_id),
        is_admin: rolesData?.some(r => r.user_id === profile.user_id),
      })) || [];

      setUsers(merged as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    switch (filterType) {
      case 'students':
        matchesFilter = user.user_type === 'student';
        break;
      case 'non-students':
        matchesFilter = user.user_type !== 'student';
        break;
      case 'verified':
        matchesFilter = user.student_verification?.verification_status === 'approved';
        break;
      case 'freelancers':
        matchesFilter = user.freelancer_access?.has_access === true;
        break;
      case 'admins':
        matchesFilter = user.is_admin === true;
        break;
    }

    return matchesSearch && matchesFilter;
  });

  const handleExportUsers = () => {
    const normalizePhoneForExport = (rawPhone: string | null) => {
      const value = (rawPhone || '').trim();
      if (!value) return '';
      const digits = value.replace(/\D/g, '');
      if (digits.length === 10) return `+91 ${digits}`;
      if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
      return value;
    };

    const toExcelText = (value: string) => `="${value.replace(/"/g, '""')}"`;

    const csvHeaders = [
      'Full Name',
      'Email',
      'User Type',
      'Verification Status',
      'Freelancer Access',
      'Admin',
      'Joined Date',
      'Joined Time',
      'City',
      'Phone',
    ];

    const csvRows = filteredUsers.map((user) => {
      const joinedDate = format(new Date(user.created_at), 'dd MMM yyyy');
      const joinedTime = format(new Date(user.created_at), 'hh:mm a');
      const verificationStatus = user.student_verification?.verification_status || '-';
      const formattedPhone = normalizePhoneForExport(user.phone);

      return [
        `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        user.email || '',
        user.user_type === 'student' ? 'Student' : 'Non-Student',
        verificationStatus,
        user.freelancer_access?.has_access ? 'Active' : 'No',
        user.is_admin ? 'Yes' : 'No',
        toExcelText(joinedDate),
        toExcelText(joinedTime),
        user.city || '',
        toExcelText(formattedPhone),
      ];
    });

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = [
      csvHeaders.map(escapeCsv).join(','),
      ...csvRows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all registered users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users ({users.length})</SelectItem>
            <SelectItem value="students">
              Students ({users.filter(u => u.user_type === 'student').length})
            </SelectItem>
            <SelectItem value="non-students">
              Non-Students ({users.filter(u => u.user_type !== 'student').length})
            </SelectItem>
            <SelectItem value="verified">
              Verified ({users.filter(u => u.student_verification?.verification_status === 'approved').length})
            </SelectItem>
            <SelectItem value="freelancers">
              Freelancers ({users.filter(u => u.freelancer_access?.has_access).length})
            </SelectItem>
            <SelectItem value="admins">
              Admins ({users.filter(u => u.is_admin).length})
            </SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleExportUsers} variant="outline" className="sm:ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Users Table */}
      <UserTable users={filteredUsers} onRefresh={fetchUsers} />

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
};

export default AdminUsersPage;
