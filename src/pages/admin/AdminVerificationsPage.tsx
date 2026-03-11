import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VerificationTable } from '@/components/admin/VerificationTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface Verification {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  institute_email: string | null;
  institute_name: string | null;
  enrollment_id: string | null;
  id_card_url: string | null;
  created_at: string;
  college_id: string | null;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  college?: {
    name: string;
    city: string;
  };
}

const AdminVerificationsPage = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      // Fetch verifications
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('student_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (verificationsError) throw verificationsError;

      // Fetch user profiles for each verification
      const userIds = verificationsData?.map(v => v.user_id) || [];
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Fetch colleges
      const collegeIds = verificationsData?.filter(v => v.college_id).map(v => v.college_id) || [];
      const { data: collegesData } = await supabase
        .from('colleges')
        .select('id, name, city')
        .in('id', collegeIds);

      // Merge data
      const merged = verificationsData?.map(v => ({
        ...v,
        user_profile: profilesData?.find(p => p.user_id === v.user_id),
        college: collegesData?.find(c => c.id === v.college_id),
      })) || [];

      setVerifications(merged as Verification[]);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = searchQuery === '' ||
      v.user_profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.user_profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.user_profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.college?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || v.verification_status === activeTab;

    return matchesSearch && matchesTab;
  });

  const counts = {
    all: verifications.length,
    pending: verifications.filter(v => v.verification_status === 'pending').length,
    approved: verifications.filter(v => v.verification_status === 'approved').length,
    rejected: verifications.filter(v => v.verification_status === 'rejected').length,
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
        <h1 className="text-3xl font-bold text-foreground">Student Verifications</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage student verification requests
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or college..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
              {counts.pending}
            </span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Approved
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {counts.approved}
            </span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejected
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {counts.rejected}
            </span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            All
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {counts.all}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <VerificationTable
            verifications={filteredVerifications}
            onRefresh={fetchVerifications}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVerificationsPage;
