import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, FileText, CheckCircle2, XCircle, Clock, Coins, Gift, ArrowUpRight, ArrowDownRight, Verified, Ban, List, Grid3x3, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Helper function to format date with ordinal (e.g., "October 24th", "November 5th")
const formatDateWithOrdinal = (date: Date): string => {
  const day = date.getDate();
  const month = format(date, 'MMMM');
  const year = date.getFullYear();
  
  // Get ordinal suffix
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${month} ${getOrdinal(day)}, ${year}`;
};

interface Bid {
  id: string;
  project_id: string;
  freelancer_id: string;
  amount: number;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user_projects: {
    title: string;
    description: string;
    user_id: string;
    category?: string;
    subcategory?: string;
    budget?: number;
    bidding_deadline?: string;
  };
}

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  notes: string | null;
  created_at: string;
}

export default function BidsPage() {
  const { user } = useAuth();
  const { data: tokenBalances, refetch: refetchBalances } = useTokenBalances();
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const paidBalance = tokenBalances?.paidBalance ?? 0;
  const freeBalance = tokenBalances?.freeBalance ?? 0;
  const totalCreditsForBid = paidBalance + freeBalance;

  useEffect(() => {
    if (user) {
      fetchBids();
      fetchCreditInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCreditInfo = async () => {
    if (!user) return;
    
    try {
      refetchBalances();

      const { data: txData, error: txError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (txError) throw txError;
      setCreditTransactions(txData || []);
    } catch (error) {
      console.error('Error fetching credit info:', error);
    }
  };

  const fetchBids = async () => {
    if (!user) return;

    try {
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('freelancer_id', user.id)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;
      const bids = bidsData || [];

      if (bids.length === 0) {
        setMyBids([]);
        return;
      }

      const projectIds = [...new Set((bids as { project_id: string }[]).map((b) => b.project_id))];
      const { data: projectsData, error: projectsError } = await supabase
        .from('user_projects')
        .select('id, title, description, user_id, category, subcategory, budget, bidding_deadline')
        .in('id', projectIds);

      if (projectsError) throw projectsError;
      const projects = (projectsData || []) as { id: string; title: string; description: string; user_id: string; category?: string; subcategory?: string; budget?: number; bidding_deadline?: string }[];
      const projectMap: Record<string, Bid['user_projects']> = {};
      projects.forEach((p) => {
        projectMap[p.id] = { title: p.title, description: p.description, user_id: p.user_id, category: p.category, subcategory: p.subcategory, budget: p.budget, bidding_deadline: p.bidding_deadline };
      });
      const bidsWithProjects = (bids as Record<string, unknown>[]).map((b) => ({
        ...b,
        user_projects: projectMap[(b as { project_id: string }).project_id] ?? null,
      }));
      const validBids = bidsWithProjects.filter((b) => b.user_projects != null) as unknown as Bid[];
      setMyBids(validBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setMyBids([]);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for design preview (temporary - remove later)
  const mockBids: Bid[] = useMemo(() => [
    {
      id: 'mock-1',
      project_id: 'mock-project-1',
      freelancer_id: user?.id || '',
      amount: 45000,
      proposal: 'I will create a high-end redesign for your SaaS platform with extreme accessibility and complex data visualization systems.',
      status: 'accepted',
      created_at: new Date().toISOString(),
      user_projects: {
        title: 'Enterprise UI Redesign',
        description: 'Modernizing a Fortune 500 SaaS platform with advanced data visualization systems.',
        user_id: 'mock-client-1',
        category: 'UI/UX Design',
        subcategory: 'Design Systems',
        budget: 50000,
        bidding_deadline: new Date('2024-10-24').toISOString(),
      }
    },
    {
      id: 'mock-2',
      project_id: 'mock-project-2',
      freelancer_id: user?.id || '',
      amount: 120000,
      proposal: 'Full-stack development of a luxury fashion marketplace featuring AR try-on and high-fidelity product animations.',
      status: 'pending',
      created_at: new Date().toISOString(),
      user_projects: {
        title: 'Luxury E-commerce Marketplace',
        description: 'Building a high-fidelity mobile experience with AR try-on features.',
        user_id: 'mock-client-2',
        category: 'Mobile App Dev',
        subcategory: 'Flutter',
        budget: 150000,
        bidding_deadline: new Date('2024-11-05').toISOString(),
      }
    },
    {
      id: 'mock-3',
      project_id: 'mock-project-3',
      freelancer_id: user?.id || '',
      amount: 32000,
      proposal: 'Comprehensive brand guidelines and asset creation for an emerging green-tech startup focused on carbon tracking.',
      status: 'rejected',
      created_at: new Date().toISOString(),
      user_projects: {
        title: 'Brand Identity for Green-tech',
        description: 'Comprehensive branding guidelines for a carbon tracking startup.',
        user_id: 'mock-client-3',
        category: 'Branding',
        subcategory: null,
        budget: 35000,
        bidding_deadline: new Date('2024-09-15').toISOString(),
      }
    },
  ], [user?.id]);

  // Use mock data if no real bids, otherwise use real bids
  const displayBids = myBids.length > 0 ? myBids : mockBids;

  // Calculate summary counts
  const summaryCounts = useMemo(() => {
    const accepted = displayBids.filter(b => b.status === 'accepted').length;
    const pending = displayBids.filter(b => b.status === 'pending').length;
    const rejected = displayBids.filter(b => b.status === 'rejected').length;
    return { accepted, pending, rejected };
  }, [displayBids]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-green/20 text-[#1a3d0f] dark:text-[#2d4d1d] text-[10px] font-black uppercase tracking-wider">
            <Verified className="w-3.5 h-3.5" />
            Accepted
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121118]/20 text-[#121118] dark:text-white text-[10px] font-black uppercase tracking-wider opacity-80 cursor-not-allowed">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-yellow/20 text-[#4a3a0f] dark:text-[#614e1a] text-[10px] font-black uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-accent-green';
      case 'pending':
        return 'bg-secondary-yellow';
      case 'rejected':
        return 'bg-[#121118]/30';
      default:
        return 'bg-[#121118]/30';
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'admin_grant':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Admin Grant</Badge>;
      case 'admin_deduct':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200 text-xs">Admin Deduct</Badge>;
      case 'bid_placed':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-xs">Bid Placed</Badge>;
      case 'signup_bonus':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200 text-xs">Signup Bonus</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading bids...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8">
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Page Heading & Credit Balance */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#121118] dark:text-white text-3xl font-black leading-tight tracking-[-0.04em]">My Bids</h1>
            <p className="text-[#68608a] dark:text-white/60 text-sm font-medium">Tracking your active and historical applications</p>
          </div>
          
          {/* Free Tokens Card (left) + Credit Balance / Paid Tokens Card (right) */}
          <div className="flex flex-wrap items-stretch gap-3">
            {/* Free Tokens – secondary container; warning content in primary */}
            <Card className="rounded-xl border bg-secondary min-w-[200px] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-4 relative flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary-foreground/15 backdrop-blur-sm">
                    <Gift className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-foreground/80 font-medium">Free Tokens</p>
                    <p className="text-2xl font-bold text-secondary-foreground">{freeBalance}</p>
                  </div>
                </div>
                {/* Warning container – primary background, medium rounded, white text */}
                <div className="rounded-lg bg-primary p-3 flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-white" />
                  <p className="text-[11px] font-medium leading-tight text-white">
                    Expire after 30 days from date of credit.
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Credit Balance (Paid Tokens) */}
            <Card className="rounded-xl border bg-primary-purple min-w-[200px] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Coins className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/80 font-medium">Credit Balance</p>
                    <p className="text-2xl font-bold text-white">{paidBalance}</p>
                  </div>
                </div>
                <p className="text-[10px] text-white/70 mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green animate-pulse" />
                  10 credits per bid
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="my-bids" className="w-full">
          {/* Tabs & Summary Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-white dark:bg-white/5 p-1.5 gap-1.5 h-auto justify-start border border-[#f1f0f5] dark:border-white/10 w-fit rounded-xl shadow-sm">
              <TabsTrigger 
                value="my-bids"
                className="rounded-lg px-5 py-2 text-xs font-bold text-[#121118] dark:text-white data-[state=active]:bg-primary-purple data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary-purple/20 transition-all duration-200 hover:text-primary-purple hover:bg-primary-purple/10 data-[state=active]:hover:bg-primary-purple data-[state=active]:hover:text-white"
              >
                My Bids ({displayBids.length})
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-lg px-5 py-2 text-xs font-bold text-[#121118] dark:text-white data-[state=active]:bg-primary-purple data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary-purple/20 transition-all duration-200 hover:text-primary-purple hover:bg-primary-purple/10 data-[state=active]:hover:bg-primary-purple data-[state=active]:hover:text-white"
              >
                Credit History
              </TabsTrigger>
            </TabsList>
            
            {/* Summary Strip - Parallel to Tabs */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2 p-1 bg-white dark:bg-white/5 rounded-lg shadow-sm border border-[#121118]/5">
                <div className="flex h-8 items-center gap-x-1 rounded-md bg-accent-green/30 px-2.5">
                  <CheckCircle2 className="w-3 h-3 text-[#121118]" />
                  <p className="text-[#121118] text-[11px] font-bold">{summaryCounts.accepted} Accepted</p>
                </div>
                <div className="flex h-8 items-center gap-x-1 rounded-md bg-secondary-yellow/40 px-2.5">
                  <Clock className="w-3 h-3 text-[#121118]" />
                  <p className="text-[#121118] text-[11px] font-bold">{summaryCounts.pending} Pending</p>
                </div>
                <div className="flex h-8 items-center gap-x-1 rounded-md bg-[#121118]/5 px-2.5 dark:bg-white/10">
                  <XCircle className="w-3 h-3 text-[#121118] dark:text-white/80" />
                  <p className="text-[#121118] dark:text-white/80 text-[11px] font-bold">{summaryCounts.rejected} Rejected</p>
                </div>
              </div>
              
              {/* View Toggle Button */}
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-white/5 rounded-lg shadow-sm border border-[#121118]/5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-7 px-3 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary-purple text-white hover:bg-primary-purple'
                      : 'text-[#68608a] hover:bg-[#121118]/5'
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-7 px-3 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary-purple text-white hover:bg-primary-purple'
                      : 'text-[#68608a] hover:bg-[#121118]/5'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <TabsContent value="my-bids" className="mt-6">
            {displayBids.length === 0 ? (
              <Card className="rounded-2xl border-2 border-dashed border-primary-purple/30 bg-gradient-to-br from-primary-purple/5 to-accent-purple/5">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-primary-purple/10 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-primary-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No bids yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Browse projects and submit proposals to get started.
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'list' ? (
              <div className="flex flex-col gap-4">
                {displayBids.filter((bid) => bid.user_projects !== null).map((bid) => {
                  const isRejected = bid.status === 'rejected';
                  const deadline = bid.user_projects.bidding_deadline 
                    ? formatDateWithOrdinal(new Date(bid.user_projects.bidding_deadline))
                    : 'Not set';
                  
                  // Format budget for display
                  const budget = bid.user_projects.budget;
                  const budgetDisplay = budget 
                    ? budget >= 100000 
                      ? `₹${(budget / 100000).toFixed(1)}L` 
                      : `₹${budget.toLocaleString()}`
                    : 'N/A';
                  
                  return (
                    <div
                      key={bid.id}
                      className={`group bg-white dark:bg-white/5 rounded-xl p-4 shadow-md border border-[#121118]/5 hover:shadow-lg transition-all duration-300 flex flex-col xl:flex-row items-center gap-4 relative overflow-hidden ${
                        isRejected ? 'opacity-80 grayscale-[0.3] hover:grayscale-0 hover:opacity-100' : ''
                      }`}
                    >
                      {/* Status Border */}
                      <div className={`absolute left-0 top-0 h-full w-1 ${getStatusBorderColor(bid.status)}`} />
                      
                      {/* Left Section - Title, Description, Tags */}
                      <div className="flex-1 min-w-0 w-full xl:w-auto">
                        <h3 className="text-base font-extrabold text-[#121118] dark:text-white mb-0.5 group-hover:text-primary-purple transition-colors truncate">
                          {bid.user_projects.title}
                        </h3>
                        <p className="text-xs text-[#68608a] dark:text-white/60 font-medium mb-2 truncate">
                          {bid.user_projects.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {bid.user_projects.category && (
                            <span className="px-2 py-0.5 bg-secondary-yellow/30 text-[#614e1a] text-[9px] font-bold rounded-md uppercase tracking-wider">
                              {bid.user_projects.category}
                            </span>
                          )}
                          {bid.user_projects.subcategory && (
                            <span className="px-2 py-0.5 bg-secondary-yellow/30 text-[#614e1a] text-[9px] font-bold rounded-md uppercase tracking-wider">
                              {bid.user_projects.subcategory}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Section - Bid Amount */}
                      <div className="flex flex-col items-center xl:items-start xl:w-36 shrink-0">
                        <span className="text-[10px] font-bold text-[#68608a] dark:text-white/40 uppercase tracking-widest mb-0.5">Your Bid</span>
                        <span className="text-2xl font-black text-primary-purple">₹{bid.amount.toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-[#68608a] mt-0.5">Budget: {budgetDisplay}</span>
                      </div>

                      {/* Right Section - Status Badge & Date */}
                      <div className="flex flex-col items-center xl:items-start xl:w-32 shrink-0">
                        <div className="mb-3">
                          {getStatusBadge(bid.status)}
                        </div>
                        {!isRejected && (
                          <div className="flex items-center gap-1 text-[#121118] dark:text-white">
                            <Calendar className="w-4 h-4" />
                            <span className="text-[10px] font-black">{deadline}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Section */}
                      <div className="flex flex-row xl:flex-col gap-1.5 w-full xl:w-auto shrink-0 border-t xl:border-t-0 xl:border-l border-[#121118]/5 pt-3 xl:pt-0 xl:pl-4">
                        <Button 
                          variant="outline"
                          disabled={isRejected}
                          className="flex-1 xl:flex-none px-4 h-9 rounded-lg bg-[#121118]/5 dark:bg-white/10 text-[10px] font-bold hover:bg-[#121118]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          View Details
                        </Button>
                        <Button 
                          disabled={isRejected}
                          className="flex-1 xl:flex-none px-4 h-9 rounded-lg bg-primary-purple text-white text-[10px] font-bold shadow-md shadow-primary-purple/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          Open Project
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayBids.filter((bid) => bid.user_projects !== null).map((bid) => {
                  const isRejected = bid.status === 'rejected';
                  const deadline = bid.user_projects.bidding_deadline 
                    ? format(new Date(bid.user_projects.bidding_deadline), 'MMM d, yyyy')
                    : 'Not set';
                  
                  // Format budget for display
                  const budget = bid.user_projects.budget;
                  const budgetDisplay = budget 
                    ? budget >= 100000 
                      ? `₹${(budget / 100000).toFixed(1)}L` 
                      : `₹${budget.toLocaleString()}`
                    : 'N/A';
                  
                  return (
                    <div
                      key={bid.id}
                      className={`group bg-white dark:bg-white/5 rounded-lg p-4 shadow-md border border-[#121118]/5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden min-h-[300px] ${
                        isRejected ? 'opacity-80 grayscale-[0.3] hover:grayscale-0 hover:opacity-100' : ''
                      }`}
                    >
                      {/* Status Border */}
                      <div className={`absolute left-0 top-0 h-full w-1 ${getStatusBorderColor(bid.status)}`} />
                      
                      {/* Header with Status */}
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-extrabold text-[#121118] dark:text-white mb-0.5 group-hover:text-primary-purple transition-colors truncate">
                            {bid.user_projects.title}
                          </h3>
                        </div>
                        <div className="ml-2 shrink-0">
                          {getStatusBadge(bid.status)}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#68608a] dark:text-white/60 font-medium mb-1.5 line-clamp-2">
                        {bid.user_projects.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {bid.user_projects.category && (
                          <span className="px-2 py-0.5 bg-secondary-yellow/30 text-[#614e1a] text-[9px] font-bold rounded-md uppercase tracking-wider">
                            {bid.user_projects.category}
                          </span>
                        )}
                        {bid.user_projects.subcategory && (
                          <span className="px-2 py-0.5 bg-secondary-yellow/30 text-[#614e1a] text-[9px] font-bold rounded-md uppercase tracking-wider">
                            {bid.user_projects.subcategory}
                          </span>
                        )}
                      </div>

                      {/* Bid Information - Horizontal Layout */}
                      <div className="flex flex-row items-center justify-between gap-3 py-1.5 border-y border-[#121118]/5 dark:border-white/5 mb-2">
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-bold text-[#68608a] dark:text-white/40 uppercase tracking-widest mb-0.5">Your Bid</span>
                          <span className="text-xl font-black text-primary-purple">₹{bid.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-[#68608a] dark:text-white/40 uppercase tracking-widest mb-0.5">Client Budget</span>
                          <span className="text-xs font-black text-[#121118] dark:text-white">{budgetDisplay}</span>
                        </div>
                        {!isRejected && (
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-[#68608a] dark:text-white/40 uppercase tracking-widest mb-0.5">Deadline</span>
                            <div className="flex items-center gap-1 text-[#121118] dark:text-white">
                              <Calendar className="w-3 h-3" />
                              <span className="text-[10px] font-black">{deadline}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1.5 mt-2">
                        <Button 
                          variant="outline"
                          disabled={isRejected}
                          className="flex-1 h-8 rounded-lg bg-[#121118]/5 dark:bg-white/10 text-[9px] font-bold hover:bg-[#121118]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          View Details
                        </Button>
                        <Button 
                          disabled={isRejected}
                          className="flex-1 h-8 rounded-lg bg-primary-purple text-white text-[9px] font-bold shadow-md shadow-primary-purple/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          Open Project
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {creditTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Coins className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Your credit transactions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {creditTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {tx.amount > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            {getTransactionBadge(tx.transaction_type)}
                            {tx.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{tx.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {tx.balance_after}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
