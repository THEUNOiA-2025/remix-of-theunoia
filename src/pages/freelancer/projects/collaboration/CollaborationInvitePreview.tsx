import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Send, Badge, List, Gavel } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  image_url: string | null;
  budget: number | null;
  user_id: string;
}

interface ClientProfile {
  first_name: string;
  last_name: string;
}

interface CollaborationInvitePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  clientProfile: ClientProfile | null;
  leadName: string;
  share: string;
  role: string;
  responsibilities: string;
  permissions: {
    performance: boolean;
    accessClientProject: boolean;
    connectWithClient: boolean;
    submitProductDetails: boolean;
    submitFinalProduct: boolean;
  };
}

export const CollaborationInvitePreview = ({
  open,
  onOpenChange,
  project,
  clientProfile,
  leadName,
  share,
  role,
  responsibilities,
  permissions,
}: CollaborationInvitePreviewProps) => {
  if (!project) return null;

  const totalBudget = project.budget || 0;
  const sharePercentage = share ? parseFloat(share) : 0;
  const recipientShare = (totalBudget * sharePercentage) / 100;
  const clientName = clientProfile
    ? `${clientProfile.first_name} ${clientProfile.last_name}`
    : "Client";

  // Convert responsibilities string to array of bullet points
  const responsibilityList = responsibilities
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.trim());

  // Map permissions to collaboration rules
  const collaborationRules = [
    {
      label: "Performance Tracking",
      checked: permissions.performance,
    },
    {
      label: "Access Client Project",
      checked: permissions.accessClientProject,
    },
    {
      label: "Connect with Client",
      checked: permissions.connectWithClient,
    },
    {
      label: "Submit Product Details",
      checked: permissions.submitProductDetails,
    },
    {
      label: "Submit Final Product",
      checked: permissions.submitFinalProduct,
    },
  ];

  const handleSendInvitation = () => {
    // Handle sending invitation
    console.log("Sending invitation", {
      project,
      share,
      role,
      responsibilities,
      permissions,
    });
    onOpenChange(false);
  };

  const handleCancelInvite = () => {
    // Handle cancel invite
    console.log("Canceling invitation");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] p-0 rounded-xl overflow-hidden max-h-[90vh] flex flex-col [&>button]:hidden">
        <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Main Content Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-xl p-4 flex flex-col gap-4 shadow-lg relative" style={{ boxShadow: '0 8px 32px 0 rgba(127, 97, 250, 0.08)' }}>
            {/* Date Badge - Top Right */}
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 bg-accent-green text-[#145214] text-[10px] font-extrabold rounded-full">
                {format(new Date(), "d MMM yyyy, h:mm a")}
              </span>
            </div>
            {/* Project Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div
                className="w-full md:w-1/3 aspect-video rounded-lg shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)",
                }}
              />
              <div className="flex-1 space-y-1">
                <span className="text-primary-purple font-bold text-[10px] uppercase tracking-widest">
                  Premium Project
                </span>
                <h3 className="text-lg font-bold text-[#121118]">{project.title}</h3>
                <p className="text-[11px]">
                  <span className="font-bold text-[#121118]">Lead:</span> <span className="font-bold text-[#121118]">{leadName}</span> | <span className="font-bold text-[#121118]">Client:</span>{" "}
                  <span className="font-bold text-[#121118]">{clientName}</span>
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed max-w-xl">{project.description}</p>
              </div>
            </div>

            {/* Budget Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-xl p-3.5 bg-primary-purple text-white border border-primary-purple">
                <p className="text-white/90 text-[11px] font-medium">Total Project Budget</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-white text-lg font-bold">
                    ₹{totalBudget.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl p-3.5 bg-secondary-yellow shadow-md">
                <p className="text-slate-800 text-[11px] font-semibold">Recipient's Share (Estimate)</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-[#121118] text-lg font-bold">
                    ₹{recipientShare.toLocaleString()}
                  </p>
                  <span className="text-slate-700 text-[11px] font-bold">
                    {sharePercentage}% Allocation
                  </span>
                </div>
              </div>
            </div>

            {/* Role, Responsibilities, and Collaboration Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                {/* Assigned Role */}
                <h4 className="font-bold text-[#121118] flex items-center gap-1.5 text-[13px]">
                  <Badge className="w-3 h-3 text-secondary-yellow" />
                  Assigned Role
                </h4>
                <div className="p-3 rounded-lg bg-secondary-yellow/10 border border-secondary-yellow/30">
                  <p className="font-bold text-primary-purple text-[13px]">{role || "Not specified"}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Role assigned for this collaboration.</p>
                </div>

                {/* Responsibilities */}
                <h4 className="font-bold text-[#121118] pt-1.5 flex items-center gap-1.5 text-[13px]">
                  <List className="w-3 h-3 text-secondary-yellow" />
                  Responsibilities
                </h4>
                <ul className="space-y-1 text-[11px] text-slate-600 p-3 rounded-lg bg-secondary-yellow/5">
                  {responsibilityList.length > 0 ? (
                    responsibilityList.map((item, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <span className="text-secondary-yellow font-bold text-sm leading-none">•</span>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No responsibilities specified</li>
                  )}
                </ul>
              </div>

              {/* Right Column - Collaboration Rules */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#121118] flex items-center gap-1.5 text-[13px]">
                  <Gavel className="w-3 h-3 text-secondary-yellow" />
                  Collaboration Rules
                </h4>
                <div className="space-y-2">
                  {collaborationRules.map((rule, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <Checkbox
                        checked={rule.checked}
                        disabled
                        className="rounded-full border-slate-300 text-primary-purple focus:ring-primary-purple h-[14px] w-[14px]"
                      />
                      <span className="text-[11px] text-slate-700 group-hover:text-primary-purple transition-colors">
                        {rule.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-white/40 flex items-center justify-between gap-3">
              <Button
                onClick={handleCancelInvite}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-bold text-[11px] hover:bg-slate-300 transition-all"
              >
                Cancel Invite
              </Button>
              <Button
                onClick={handleSendInvitation}
                className="bg-primary-purple text-white px-6 py-2 rounded-full font-bold text-[13px] flex items-center gap-1.5 shadow-xl shadow-primary-purple/30 hover:shadow-primary-purple/50 transition-all hover:scale-[1.02]"
              >
                <span>Send Invitation</span>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

