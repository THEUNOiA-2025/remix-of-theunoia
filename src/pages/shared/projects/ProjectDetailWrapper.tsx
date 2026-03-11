import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Lazy load both versions
const FreelancerProjectDetailPage = lazy(() => import("@/pages/freelancer/projects/ProjectDetailPage"));
const ClientProjectDetailPage = lazy(() => import("@/pages/client/projects/ProjectDetailPage"));

const ProjectDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isProjectOwner, setIsProjectOwner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!id || !user?.id) {
        setIsProjectOwner(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_projects")
          .select("user_id")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error checking project ownership:", error);
          setIsProjectOwner(false);
        } else {
          setIsProjectOwner(data?.user_id === user.id);
        }
      } catch (error) {
        console.error("Error:", error);
        setIsProjectOwner(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      {isProjectOwner ? <ClientProjectDetailPage /> : <FreelancerProjectDetailPage />}
    </Suspense>
  );
};

export default ProjectDetailWrapper;
