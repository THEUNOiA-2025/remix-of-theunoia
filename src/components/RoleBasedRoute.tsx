import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Freelancer pages
const FreelancerDashboardPage = lazy(() => import("@/pages/freelancer/dashboard/DashboardPage"));
const FreelancerProfilePage = lazy(() => import("@/pages/freelancer/profile/ProfilePage"));
const FreelancerEditProfilePage = lazy(() => import("@/pages/freelancer/profile/EditProfilePage"));
const FreelancerProjectsPage = lazy(() => import("@/pages/freelancer/projects/ProjectsPage"));
const FreelancerCommunityPage = lazy(() => import("@/pages/freelancer/community/CommunityPage"));
const FreelancerLeadershipPage = lazy(() => import("../pages/freelancer/leadership/LeadershipPage"));

// Client pages
const ClientDashboardPage = lazy(() => import("@/pages/client/dashboard/DashboardPage"));
const ClientProfilePage = lazy(() => import("@/pages/client/profile/ProfilePage"));
const ClientEditProfilePage = lazy(() => import("@/pages/client/profile/EditProfilePage"));
const ClientProjectsPage = lazy(() => import("@/pages/client/projects/ProjectsPage"));

type PageType = 'dashboard' | 'profile' | 'profile_edit' | 'projects' | 'community' | 'leadership';

interface RoleBasedRouteProps {
  pageType: PageType;
}

export const RoleBasedRoute = ({ pageType }: RoleBasedRouteProps) => {
  const { user } = useAuth();

  const { data: userProfile, isLoading, error: queryError } = useQuery({
    queryKey: ["user-profile-type", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_type, user_id, first_name, last_name")
        .eq("user_id", user.id)
        .single();


      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user?.id,
    retry: 1,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading profile. Please refresh.</div>
      </div>
    );
  }

  // Non-students are clients (they post projects and hire freelancers)
  // Students are freelancers (they work on projects)
  // Use account-creation userType from auth when profile missing/wrong (e.g. after Supabase migration)
  const metaType = (user?.user_metadata as { userType?: string } | undefined)?.userType;
  const isClient =
    userProfile?.user_type === "non-student" || metaType === "non-student";

  // Map page type to components
  const getPageComponent = () => {
    switch (pageType) {
      case 'dashboard':
        return isClient ? <ClientDashboardPage /> : <FreelancerDashboardPage />;
      case 'profile':
        return isClient ? <ClientProfilePage /> : <FreelancerProfilePage />;
      case 'profile_edit':
        return isClient ? <ClientEditProfilePage /> : <FreelancerEditProfilePage />;
      case 'projects':
        return isClient ? <ClientProjectsPage /> : <FreelancerProjectsPage />;
      case 'community':
        // Community is freelancer-only (students only)
        return <FreelancerCommunityPage />;
      case 'leadership':
        // Leadership Board is freelancer-only
        return isClient ? <ClientDashboardPage /> : <FreelancerLeadershipPage />;
      default:
        return isClient ? <ClientDashboardPage /> : <FreelancerDashboardPage />;
    }
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      {getPageComponent()}
    </Suspense>
  );
};

