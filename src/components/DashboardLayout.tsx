import { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAdminRole } from '@/hooks/useAdminRole';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, Bell, MessageSquare, FileText, User, Loader2, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FreelancerDashboardCard, DEFAULT_QUALITY_ROWS } from '@/components/FreelancerDashboardCard';

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  user_type?: string | null;
  avatar_url?: string | null;
}

export const DashboardLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  const { isAdmin } = useAdminRole();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newBidsOnProjects, setNewBidsOnProjects] = useState<Array<{
    id: string;
    amount: number;
    created_at: string;
    user_projects: {
      id: string;
      title: string;
      user_id: string;
    };
  }>>([]);

  // Client-side freelancer search (only for clients)
  // Mock freelancer until backend is connected – remove when backend is ready
  const MOCK_FREELANCERS: Array<{ user_id: string; first_name: string; last_name: string; profile_picture_url: string | null }> = [
    { user_id: 'mock-sai-krishan', first_name: 'Sai', last_name: 'Krishan', profile_picture_url: null },
  ];
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  }>>([]);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);
  const [freelancerPopupOpen, setFreelancerPopupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<{
    user_id: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  } | null>(null);

  // Public routes that don't require authentication
  const publicRoutes = ['/projects'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    // Only redirect to login if not on a public route and user is not authenticated
    if (!loading && !user && !isPublicRoute) {
      navigate('/login');
    }
  }, [user, loading, navigate, isPublicRoute]);

  // Fetch unread message count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (error) {
        console.error('Error fetching unread count:', error);
        if (error.message?.includes('JWT expired') || (error as any).code === 'PGRST303') {
          console.log('JWT expired detected in unreadCount, redirecting to login');
          signOut().then(() => navigate('/login'));
        }
        return 0;
      }

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            if (error.message?.includes('JWT expired') || error.code === 'PGRST303') {
              console.log('JWT expired detected in fetchProfile, redirecting to login');
              await signOut();
              navigate('/login');
              return;
            }
            throw error;
          }
          setProfile(data ?? null);

          // Check verification status
          const { data: verification, error: verificationError } = await supabase
            .from('student_verifications')
            .select('verification_status')
            .eq('user_id', user.id)
            .maybeSingle();

          setIsVerifiedStudent(verification?.verification_status === 'approved');
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user, signOut, navigate]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Get unread messages count
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', user.id);

        setUnreadMessages(msgCount || 0);

        // Get recent bids on user's projects (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentBids } = await supabase
          .from('bids')
          .select(`
            id,
            amount,
            created_at,
            user_projects!inner(id, title, user_id)
          `)
          .eq('user_projects.user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        setNewBidsOnProjects(recentBids || []);
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
        if (error.message?.includes('JWT expired') || error.code === 'PGRST303') {
          signOut().then(() => navigate('/login'));
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refetch every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Client search: by role/skills (from Profile → Role & skills), top 10. See leadership-logic/LOGIC.md.
  const fetchFreelancerSearch = useCallback(async (q: string) => {
    const term = q.trim().replace(/,/g, ' ');
    if (!term) {
      setClientSearchResults([]);
      return;
    }
    setClientSearchLoading(true);
    try {
      const pattern = `%${term}%`;

      // 1) Profiles matching name or bio (freelancers only: user_type != 'non-student')
      const { data: byProfile } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, profile_picture_url')
        .neq('user_type', 'non-student')
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},bio.ilike.${pattern}`)
        .limit(10);

      // 2) Freelancers matching skill_name
      const { data: bySkills } = await supabase
        .from('user_skills')
        .select('user_id')
        .ilike('skill_name', pattern);
      const skillUserIds = [...new Set((bySkills || []).map((r) => r.user_id))];
      let bySkillProfiles: typeof byProfile = [];
      if (skillUserIds.length > 0) {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, profile_picture_url')
          .neq('user_type', 'non-student')
          .in('user_id', skillUserIds.slice(0, 20));
        bySkillProfiles = data || [];
      }

      const seen = new Set<string>();
      const merged: Array<{ user_id: string; first_name: string; last_name: string; profile_picture_url: string | null }> = [];
      for (const p of [...(byProfile || []), ...bySkillProfiles]) {
        if (seen.has(p.user_id)) continue;
        seen.add(p.user_id);
        merged.push({
          user_id: p.user_id,
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? '',
          profile_picture_url: p.profile_picture_url ?? null,
        });
        if (merged.length >= 10) break;
      }
      // Until backend is connected: add mock freelancers when search matches (e.g. "Sai Krishan")
      const lower = term.toLowerCase();
      for (const mock of MOCK_FREELANCERS) {
        if (seen.has(mock.user_id)) continue;
        const fullName = `${mock.first_name} ${mock.last_name}`.toLowerCase();
        if (fullName.includes(lower) || mock.first_name.toLowerCase().includes(lower) || mock.last_name.toLowerCase().includes(lower)) {
          seen.add(mock.user_id);
          merged.push(mock);
          if (merged.length >= 10) break;
        }
      }
      setClientSearchResults(merged);
    } catch (err) {
      console.error('Freelancer search error:', err);
      // Still show mock results when backend fails (e.g. "Sai Krishan")
      const term = q.trim().replace(/,/g, ' ').toLowerCase();
      if (term) {
        const mockResults = MOCK_FREELANCERS.filter(
          (m) =>
            m.first_name.toLowerCase().includes(term) ||
            m.last_name.toLowerCase().includes(term) ||
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(term)
        );
        setClientSearchResults(mockResults);
      } else {
        setClientSearchResults([]);
      }
    } finally {
      setClientSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!clientSearchQuery.trim()) {
      setClientSearchResults([]);
      return;
    }
    const t = setTimeout(() => fetchFreelancerSearch(clientSearchQuery), 300);
    return () => clearTimeout(t);
  }, [clientSearchQuery, fetchFreelancerSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setClientSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Show loading only if not on public route or if checking auth
  if (loading || (user && profileLoading)) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // For public routes without auth, render without sidebar
  if (!user && isPublicRoute) {
    return (
      <div className="min-h-screen w-full bg-background">
        <Outlet />
      </div>
    );
  }

  // For authenticated users or protected routes, show with sidebar
  if (!user) {
    return null;
  }

  // Name above email in dropdown: profile first, then account creation (user_metadata), then email prefix
  const meta = user.user_metadata as { firstName?: string; lastName?: string } | undefined;
  const nameFromProfile = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
  const nameFromMeta = [meta?.firstName, meta?.lastName].filter(Boolean).join(' ').trim();
  const displayName = nameFromProfile || nameFromMeta || user.email?.split('@')[0] || 'User';
  const displayEmail = user.email || 'No email';
  // Use account-creation userType when profile missing/wrong (e.g. after Supabase migration)
  const metaType = (user.user_metadata as { userType?: string } | undefined)?.userType;
  const isClient = profile?.user_type === 'non-student' || metaType === 'non-student';

  const freelancerLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Project', to: '/projects' },
    { label: 'Community', to: '/community' },
    { label: 'Buy Credits', to: '/buy-credits' },
    { label: 'Message', to: '/messages' },
  ];

  const clientLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Project', to: '/projects' },
    { label: 'Message', to: '/messages' },
  ];

  const navLinks = isClient ? clientLinks : freelancerLinks;

  const initials =
    profile?.first_name || profile?.last_name
      ? `${(profile.first_name || '')?.[0] || ''}${(profile.last_name || '')?.[0] || ''}`.toUpperCase()
      : (user.email || 'U')[0]?.toUpperCase();

  const totalNotifications = unreadMessages + newBidsOnProjects.length;

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Top Navbar – transparent glass with primary/secondary gradient like reference */}
      <header
        className="sticky top-0 z-30 w-full border-b border-white/20 backdrop-blur-xl bg-white/80"
      >
        <div className="mx-auto flex h-16 md:h-28 items-center px-3 sm:px-4 md:px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center flex-shrink-0">
            <img
              src="/images/theunoia-logo.png"
              alt="Theunoia logo"
              className="h-7 md:h-8 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center flex-1">
            {/* Navigation Links */}
            <nav className="flex items-center gap-6 ml-8">
              {navLinks.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-semibold text-black relative transition-colors',
                      'hover:text-black',
                      'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300',
                      'hover:after:w-full'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Large Space */}
            <div className="flex-1" />

            {/* Search Bar – client: search freelancers (top 10 dropdown); freelancer: placeholder */}
            <div className="flex items-center relative" ref={isClient ? clientSearchRef : undefined}>
              <div className="flex items-center bg-white border border-gray-300 rounded-l-md px-4 h-10">
                <Input
                  type="text"
                  placeholder={isClient ? "Search by role or skill (e.g. frontend developer, videographer)…" : "What service are you looking for today?"}
                  className="h-full border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 w-80"
                  value={isClient ? clientSearchQuery : ''}
                  onChange={isClient ? (e) => { setClientSearchQuery(e.target.value); setClientSearchOpen(true); } : undefined}
                  onFocus={isClient ? () => setClientSearchOpen(true) : undefined}
                  readOnly={!isClient}
                />
              </div>
              <Button
                type="button"
                className="h-10 px-4 bg-primary hover:bg-primary/90 rounded-r-md rounded-l-none border-0 flex items-center justify-center"
              >
                {isClient && clientSearchLoading ? (
                  <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-primary-foreground" />
                )}
              </Button>
              {isClient && clientSearchOpen && (clientSearchQuery.trim() || clientSearchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50 min-w-[380px] max-h-[320px] overflow-y-auto">
                  {clientSearchLoading ? (
                    <div className="p-5 flex items-center justify-center gap-2 text-muted-foreground text-base">
                      <Loader2 className="w-5 h-5 animate-spin" /> Searching…
                    </div>
                  ) : clientSearchResults.length === 0 ? (
                    <div className="p-5 text-muted-foreground text-base">
                      {clientSearchQuery.trim() ? 'No freelancers found. Try "Sai Krishan" or skill keywords.' : 'Type to search (e.g. Sai Krishan).'}
                    </div>
                  ) : (
                    <ul className="py-2">
                      {clientSearchResults.slice(0, 10).map((f) => (
                        <li key={f.user_id}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-muted/70 transition-colors rounded mx-1"
                            onClick={() => {
                              setSelectedFreelancer(f);
                              setFreelancerPopupOpen(true);
                              setClientSearchOpen(false);
                              setClientSearchQuery('');
                              setClientSearchResults([]);
                            }}
                          >
                            <Avatar className="h-12 w-12 rounded-full flex-shrink-0 border-2 border-primary/20">
                              <AvatarImage src={f.profile_picture_url ?? undefined} alt="" />
                              <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                                {(f.first_name?.[0] ?? '') + (f.last_name?.[0] ?? '') || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-foreground text-base truncate">
                              {f.first_name} {f.last_name}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Notification Button */}
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 ml-4 relative"
                >
                  <Bell className="w-5 h-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                <div className="p-3.5 border-b border-border">
                  <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {totalNotifications === 0 ? (
                    <div className="p-3.5 text-center text-muted-foreground text-xs">
                      No new notifications
                    </div>
                  ) : (
                    <div className="py-2">
                      {unreadMessages > 0 && (
                        <button
                          className="w-full px-3.5 py-2.5 text-left hover:bg-muted/50 flex items-center gap-2.5 border-b border-border/40"
                          onClick={() => {
                            navigate('/messages');
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Unread Messages</p>
                            <p className="text-[11px] text-muted-foreground">{unreadMessages} new message{unreadMessages > 1 ? 's' : ''}</p>
                          </div>
                        </button>
                      )}
                      {newBidsOnProjects.map((bid) => (
                        <button
                          key={bid.id}
                          className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-2 border-b border-border/40 last:border-b-0"
                          onClick={() => {
                            navigate(`/projects/${bid.user_projects.id}`);
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <FileText className="w-3 h-3 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">New bid: ₹{bid.amount}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{bid.user_projects.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-4 flex items-center gap-1.5"
                >
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md hover:bg-gray-50">
                    <User className="w-4 h-4 text-foreground transition-transform duration-300" />
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">
                  {displayName}
                  <div className="text-[10px] text-muted-foreground truncate">
                    {displayEmail}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isClient && (
                  <DropdownMenuItem onClick={() => navigate('/bids')}>
                    My Bids
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/calendar')}>
                  Calendar
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile
                </DropdownMenuItem>
                {!isClient && (
                  <DropdownMenuItem onClick={() => navigate('/leadership')}>
                    Leadership Board
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="ml-auto flex items-center gap-1.5 md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/messages')}>
              <MessageSquare className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                  <Bell className="w-4 h-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate('/messages')}>Open messages</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>Go to dashboard</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen((prev) => !prev)}>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/30 bg-white/90 backdrop-blur px-3 pb-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => (
                <Button
                  key={item.to}
                  variant="outline"
                  className="justify-start h-9"
                  onClick={() => {
                    navigate(item.to);
                    setMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            {isClient && (
              <div className="mt-2 flex items-center gap-2" ref={clientSearchRef}>
                <Input
                  type="text"
                  placeholder="Search freelancers"
                  className="h-9"
                  value={clientSearchQuery}
                  onChange={(e) => { setClientSearchQuery(e.target.value); setClientSearchOpen(true); }}
                  onFocus={() => setClientSearchOpen(true)}
                />
                <Button type="button" size="icon" className="h-9 w-9">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      <main
        className={cn(
          'w-full min-h-screen',
          location.pathname === '/messages' ? '' : location.pathname === '/leadership' ? 'p-0' : 'p-3 sm:p-4 md:p-6 md:pt-4',
          (location.pathname === '/profile' || location.pathname.startsWith('/profile/') || location.pathname === '/leadership' || (location.pathname === '/dashboard' && isClient)) && 'bg-[#faf7f1]'
        )}
      >
        <Outlet />
      </main>

      {/* Popup: exact Leadership Board dashboard when client clicks a freelancer */}
      <Dialog open={freelancerPopupOpen} onOpenChange={setFreelancerPopupOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-md">
          <div className="bg-[#faf7f1] rounded-2xl p-6 pt-14">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black text-black">
                {selectedFreelancer
                  ? `${selectedFreelancer.first_name} ${selectedFreelancer.last_name}`.trim() || 'Freelancer'
                  : 'Freelancer dashboard'}
              </DialogTitle>
            </DialogHeader>
            {selectedFreelancer && (
              <FreelancerDashboardCard
                onTimeDelivery="99.8"
                overallRating="100"
                successful={142}
                inProgress={8}
                pending={3}
                qualityRows={DEFAULT_QUALITY_ROWS}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
