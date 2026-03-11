import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, GraduationCap, Calendar, IndianRupee, MapPin, Mail, Briefcase, Clock, ImageIcon, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface College {
  id: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
}

interface CommunityMember {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  profile_picture_url: string | null;
}

interface CommunityTask {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  subcategory: string | null;
  bidding_deadline: string | null;
  cover_image_url: string | null;
  user_id: string;
  created_at: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userCollege, setUserCollege] = useState<College | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [tasks, setTasks] = useState<CommunityTask[]>([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCommunityData();
    }
  }, [user]);

  const fetchCommunityData = async () => {
    try {
      // Check verification status and get college
      const { data: verification, error: verError } = await supabase
        .from('student_verifications')
        .select('verification_status, college_id, colleges(id, name, short_name, city, state)')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log("User ID:", user?.id);
      console.log("Data:", verification);
      console.log("Error:", verError);

      if (verError) {
        console.error('Error fetching verification:', verError);
        toast.error("Failed to load verification data");
        setLoading(false);
        return;
      }

      const verificationRow = verification;
      if (!verificationRow || verificationRow.verification_status !== 'approved') {
        setIsVerified(false);
        setLoading(false);
        return;
      }

      setIsVerified(true);
      setUserCollege(verificationRow.colleges as any);

      // Fetch community members (verified students from same college)
      const { data: membersData, error: membersError } = await supabase
        .from('student_verifications')
        .select('user_id, user_profiles(user_id, first_name, last_name, bio, profile_picture_url)')
        .eq('college_id', verificationRow.college_id)
        .eq('verification_status', 'approved')
        .neq('user_id', user?.id);

      if (!membersError && membersData) {
        const formattedMembers = membersData
          .filter(m => m.user_profiles)
          .map(m => m.user_profiles as any);
        setMembers(formattedMembers);
      }

      // Fetch community tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('user_projects')
        .select('*')
        .eq('is_community_task', true)
        .eq('community_college_id', verificationRow.college_id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (!tasksError && tasksData) {
        setTasks(tasksData as any);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent-purple/5">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <GraduationCap className="absolute inset-0 m-auto w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your community...</p>
        </div>
      </div>
    );
  }

  if (!isVerified || !userCollege) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent-purple/5 p-6">
        <Card className="max-w-2xl mx-auto mt-12 overflow-hidden border">
          {/* Gradient Header */}
          <div className="h-32 bg-gradient-to-r from-primary via-accent-purple to-accent-blue relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          </div>
          <div className="px-8 pb-8 -mt-12 text-center">
            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Verification Required</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You need to be a verified student to access the college community features.
              Verify your student status to connect with fellow students from your college.
            </p>
            <Button
              onClick={() => navigate('/profile/verify')}
              className="bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity px-8"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Verify Student Status
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent-purple/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header Card */}
        <Card className="mb-6 overflow-hidden border">
          <div className="relative bg-gradient-to-r from-primary via-accent-purple to-accent-blue p-6 md:p-8">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

            <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                    ✨ Your Campus Community
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{userCollege.name}</h1>
                <p className="flex items-center gap-1 text-white/80">
                  <MapPin className="w-4 h-4" />
                  {userCollege.city}, {userCollege.state}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="p-4 md:p-6 text-center bg-gradient-to-b from-primary/5 to-transparent">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{members.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Active Members</p>
            </div>
            <div className="p-4 md:p-6 text-center bg-gradient-to-b from-accent-purple/5 to-transparent">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-accent-purple" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{tasks.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Open Tasks</p>
            </div>
            <div className="p-4 md:p-6 flex items-center justify-center">
              <Button
                onClick={() => navigate('/projects')}
                className="bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Post Task</span>
                <span className="md:hidden">Post</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 border border-border/60 p-1 h-12 rounded-xl">
            <TabsTrigger
              value="tasks"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent-purple data-[state=active]:text-white font-medium transition-all"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Community Tasks
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent-purple data-[state=active]:text-white font-medium transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            {tasks.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 bg-gradient-to-br from-primary/5 via-card to-accent-purple/5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No community tasks yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Be the first to post a task that requires physical delivery or on-campus collaboration.
                </p>
                <Button
                  onClick={() => navigate('/projects')}
                  className="bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Post Your First Task
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tasks.map((task, index) => (
                  <Card
                    key={task.id}
                    className="group overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer border"
                    onClick={() => navigate(`/projects/${task.id}`)}
                  >
                    <div className="relative h-44 overflow-hidden">
                      {task.cover_image_url ? (
                        <img
                          src={task.cover_image_url}
                          alt={task.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${index % 3 === 0 ? 'bg-gradient-to-br from-primary/20 via-accent-purple/10 to-accent-blue/20' :
                            index % 3 === 1 ? 'bg-gradient-to-br from-accent-purple/20 via-primary/10 to-green/20' :
                              'bg-gradient-to-br from-accent-blue/20 via-accent/10 to-primary/20'
                          }`}>
                          <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent-purple text-white border-0">
                        🏫 Community
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{task.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green/10 text-green font-semibold text-sm">
                          <IndianRupee className="w-3.5 h-3.5" />
                          ₹{task.budget}
                        </div>
                        <Badge variant="outline" className="rounded-full">{task.category}</Badge>
                      </div>
                      {task.bidding_deadline && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                          <Clock className="w-3.5 h-3.5" />
                          Deadline: {new Date(task.bidding_deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            {members.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 bg-gradient-to-br from-primary/5 via-card to-accent-purple/5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No members yet</h3>
                <p className="text-muted-foreground mb-6">Invite your college mates to join the platform!</p>
                <Button
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/5"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Friends
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {members.map((member, index) => (
                  <Card
                    key={member.user_id}
                    className={`group p-5 hover:border-primary/50 transition-all duration-300 border-l-4 ${index % 4 === 0 ? 'border-l-primary' :
                        index % 4 === 1 ? 'border-l-accent-purple' :
                          index % 4 === 2 ? 'border-l-accent-blue' :
                            'border-l-green'
                      }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-14 h-14 border-2 border-border">
                        <AvatarImage src={member.profile_picture_url || undefined} alt={`${member.first_name} ${member.last_name}`} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent-purple text-white font-semibold text-lg">
                          {member.first_name[0]}{member.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {member.first_name} {member.last_name}
                        </h4>
                        <Badge className="bg-gradient-to-r from-primary/10 to-accent-purple/10 text-primary border-0 text-xs mt-1">
                          🎓 Verified Student
                        </Badge>
                      </div>
                    </div>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 italic">"{member.bio}"</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full hover:bg-primary/5 hover:border-primary/50 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${member.user_id}`);
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
