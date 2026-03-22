import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, RotateCw, Hourglass, User } from "lucide-react";

interface FreelancerProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  bio: string | null;
}

// Mock freelancer until backend is connected – remove when backend is ready
const MOCK_SAI_KRISHAN: FreelancerProfile & { skills: string[]; stats: { successful: number; ongoing: number; pending: number } } = {
  user_id: "mock-sai-krishan",
  first_name: "Sai",
  last_name: "Krishan",
  profile_picture_url: null,
  bio: "Full-stack developer and creative problem solver. Experienced in React, Node.js, and on-time delivery.",
  skills: ["React", "Node.js", "Full Stack", "Frontend", "Backend"],
  stats: { successful: 12, ongoing: 2, pending: 1 },
};

const FreelancerViewPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [stats, setStats] = useState({ successful: 0, ongoing: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Show mock Sai Krishan dashboard when backend is not connected
    if (userId === MOCK_SAI_KRISHAN.user_id) {
      setProfile({
        user_id: MOCK_SAI_KRISHAN.user_id,
        first_name: MOCK_SAI_KRISHAN.first_name,
        last_name: MOCK_SAI_KRISHAN.last_name,
        profile_picture_url: MOCK_SAI_KRISHAN.profile_picture_url,
        bio: MOCK_SAI_KRISHAN.bio,
      });
      setSkills(MOCK_SAI_KRISHAN.skills);
      setStats(MOCK_SAI_KRISHAN.stats);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name, profile_picture_url, bio, user_type")
          .eq("user_id", userId)
          .single();

        console.log("User ID:", userId);
        console.log("Data:", profileData);
        console.log("Error:", profileError);

        const profileRow = profileData;
        if (profileError || !profileRow) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if ((profileRow as { user_type?: string }).user_type === "non-student") {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const { user_type: _, ...rest } = profileRow as FreelancerProfile & { user_type?: string };
        setProfile(rest as FreelancerProfile);

        const { data: skillsData } = await supabase
          .from("user_skills")
          .select("skill_name")
          .eq("user_id", userId);
        setSkills((skillsData || []).map((s) => s.skill_name));

        // Freelancer stats: from bids (accepted + project status) and pending bids
        const { data: acceptedBids } = await supabase
          .from("bids")
          .select("id, project_id, user_projects!inner(status)")
          .eq("freelancer_id", userId)
          .eq("status", "accepted");

        const { count: pendingCount } = await supabase
          .from("bids")
          .select("*", { count: "exact", head: true })
          .eq("freelancer_id", userId)
          .eq("status", "pending");

        const successful =
          acceptedBids?.filter((b) => (b.user_projects as { status: string })?.status === "completed").length ?? 0;
        const ongoing =
          acceptedBids?.filter((b) => (b.user_projects as { status: string })?.status === "in_progress").length ?? 0;

        setStats({
          successful,
          ongoing,
          pending: pendingCount ?? 0,
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Freelancer not found.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const displayName = `${profile.first_name} ${profile.last_name}`.trim() || "Freelancer";
  const initials =
    (profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "") || "?";

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Header – same style as freelancer dashboard */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Avatar className="h-20 w-20 rounded-full border-2 border-primary/20">
            <AvatarImage src={profile.profile_picture_url ?? undefined} alt="" />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {displayName}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Freelancer dashboard
            </p>
          </div>
        </div>

        {/* Project Progress – exact same block as freelancer dashboard */}
        <Card className="bg-[#FDF8F3] rounded-xl border border-black/20 shadow-sm p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm">Project progress</h4>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                On-time delivery
              </span>
            </div>
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 rounded-full bg-green-50">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                Successful
              </p>
              <p className="text-base font-black">{stats.successful}</p>
            </div>
            <div className="flex flex-col items-center text-center border-x border-border/50">
              <div className="mb-2 p-2 rounded-full bg-primary/10">
                <RotateCw className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                In progress
              </p>
              <p className="text-base font-black">{stats.ongoing}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 rounded-full bg-orange-50">
                <Hourglass className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                Pending
              </p>
              <p className="text-base font-black">{stats.pending}</p>
            </div>
          </div>
        </Card>

        {/* Bio */}
        {profile.bio && (
          <Card className="rounded-xl border border-black/20 shadow-sm p-5 mb-6">
            <h4 className="font-bold text-sm mb-2">About</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {profile.bio}
            </p>
          </Card>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Card className="rounded-xl border border-black/20 shadow-sm p-5">
            <h4 className="font-bold text-sm mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FreelancerViewPage;
