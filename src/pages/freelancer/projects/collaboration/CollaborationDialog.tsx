import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Search, Loader2 } from "lucide-react";
import { CollaborationInvitePreview } from "./CollaborationInvitePreview";

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

interface CollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  clientProfile: ClientProfile | null;
  leadName: string;
}

export const CollaborationDialog = ({ open, onOpenChange, project, clientProfile, leadName }: CollaborationDialogProps) => {
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [share, setShare] = useState("");
  const [role, setRole] = useState("Designer");
  const [responsibilities, setResponsibilities] = useState("");
  const [permissions, setPermissions] = useState({
    performance: true,
    accessClientProject: false,
    connectWithClient: true,
    submitProductDetails: false,
    submitFinalProduct: false,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset to search step when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('search');
      setSearchQuery("");
      setSelectedUser(null);
      setIsGenerating(false);
    }
    onOpenChange(isOpen);
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInviteClick = (userName: string) => {
    setSelectedUser(userName);
    setStep('form');
  };

  const handleGenerate = () => {
    // Show loading state
    setIsGenerating(true);
    
    // Wait for 4 seconds before showing preview
    setTimeout(() => {
      setIsGenerating(false);
      setPreviewOpen(true);
      onOpenChange(false);
    }, 4000);
  };

  // Mock user data - for now just "Om"
  const mockUsers = [
    { id: '1', name: 'Om' }
  ];

  // Filter users based on search query
  const filteredUsers = searchQuery.trim() 
    ? mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[504px] p-0 rounded-[18px] overflow-hidden max-h-[90vh] flex flex-col [&>button]:hidden">
        {step === 'search' ? (
          <>
            {/* Header */}
            <div className="p-5 pb-3.5 flex justify-between items-start flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Collaborator</h2>
                <p className="text-slate-500 text-[11px] mt-0.5">Search for a user to invite</p>
              </div>
              <button
                onClick={() => handleOpenChange(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Content */}
            <div className="px-5 pb-5 flex flex-col flex-1">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-0 focus:border-primary-purple transition-all outline-none text-xs"
                  autoFocus
                />
              </div>

              {/* Dropdown Container - Only show when typing */}
              {searchQuery.trim() && (
                <div className="mt-3 border border-slate-200 rounded-lg bg-white shadow-lg overflow-hidden">
                  {/* User List */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="px-4 py-3 border-b border-slate-100 last:border-b-0 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-purple flex items-center justify-center text-white font-bold text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-900">{user.name}</span>
                          </div>
                          <Button
                            onClick={() => handleInviteClick(user.name)}
                            className="px-4 py-1.5 bg-primary-purple text-white rounded-lg font-bold text-[11px] hover:bg-primary-purple/90 transition-all"
                          >
                            Invite
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-400">No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 pb-3.5 flex justify-between items-start flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Collaboration Invite</h2>
                <p className="text-slate-500 text-[11px] mt-0.5">Set share, role, responsibilities, and permissions</p>
              </div>
              <button
                onClick={() => handleOpenChange(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div 
              className="px-5 pb-3.5 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
          <div className="space-y-3.5">
            {/* Your Share and Your Role */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <Label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Your Share <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="25"
                    value={share}
                    onChange={(e) => setShare(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-0 focus:border-primary-purple transition-all outline-none pr-7 text-xs"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-medium">Your share of project earnings</p>
              </div>
              <div>
                <Label className="block text-xs font-bold text-slate-900 mb-1.5">Your Role <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Designer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-0 focus:border-primary-purple transition-all outline-none text-xs"
                />
              </div>
            </div>

            {/* Your Responsibilities */}
            <div>
              <Label className="block text-xs font-bold text-slate-900 mb-1.5">Your Responsibilities <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Briefly describe what you'll be handling..."
                rows={2}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-0 focus:border-primary-purple transition-all outline-none resize-none text-xs"
              />
            </div>
          </div>

          {/* Permissions Section */}
          <div className="relative rounded-xl border border-slate-100 overflow-hidden bg-white group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary-yellow"></div>
            <div className="p-3.5">
              <div className="mb-3.5">
                <h3 className="text-xs font-bold text-slate-900">Permissions <span className="text-red-500">*</span></h3>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5 tracking-tight">
                  Configure what this collaborator can see and manage
                </p>
              </div>
              <div className="space-y-2.5">
                {/* Performance */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Performance</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-md ${
                        permissions.performance
                          ? "bg-accent-green text-[#145214]"
                          : "bg-secondary-yellow text-[#73480d]"
                      }`}>
                        {permissions.performance ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Track task completion metrics</span>
                  </div>
                  <button
                    onClick={() => togglePermission("performance")}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      permissions.performance ? "bg-primary-purple" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissions.performance ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Can access client project */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Can access client project</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-md ${
                        permissions.accessClientProject
                          ? "bg-accent-green text-[#145214]"
                          : "bg-secondary-yellow text-[#73480d]"
                      }`}>
                        {permissions.accessClientProject ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">View project details and assets</span>
                  </div>
                  <button
                    onClick={() => togglePermission("accessClientProject")}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      permissions.accessClientProject ? "bg-primary-purple" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissions.accessClientProject ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Can connect with client */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Can connect with client</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-md ${
                        permissions.connectWithClient
                          ? "bg-accent-green text-[#145214]"
                          : "bg-secondary-yellow text-[#73480d]"
                      }`}>
                        {permissions.connectWithClient ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Direct communication access</span>
                  </div>
                  <button
                    onClick={() => togglePermission("connectWithClient")}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      permissions.connectWithClient ? "bg-primary-purple" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissions.connectWithClient ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Can submit product details */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Can submit product details</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-md ${
                        permissions.submitProductDetails
                          ? "bg-accent-green text-[#145214]"
                          : "bg-secondary-yellow text-[#73480d]"
                      }`}>
                        {permissions.submitProductDetails ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Upload documentation and specs</span>
                  </div>
                  <button
                    onClick={() => togglePermission("submitProductDetails")}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      permissions.submitProductDetails ? "bg-primary-purple" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissions.submitProductDetails ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Can submit final product */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Can submit final product</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-md ${
                        permissions.submitFinalProduct
                          ? "bg-accent-green text-[#145214]"
                          : "bg-secondary-yellow text-[#73480d]"
                      }`}>
                        {permissions.submitFinalProduct ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Final delivery permission</span>
                  </div>
                  <button
                    onClick={() => togglePermission("submitFinalProduct")}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      permissions.submitFinalProduct ? "bg-primary-purple" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissions.submitFinalProduct ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('search')}
                  className="text-slate-400 hover:text-slate-600 text-[11px] font-bold transition-colors"
                >
                  Back
                </button>
                <Button
                  onClick={handleGenerate}
                  className="px-5 py-2.5 bg-primary-purple text-white rounded-xl font-bold text-[11px] shadow-xl shadow-primary-purple/20 hover:bg-primary-purple/90 transition-all"
                >
                  Generate Collaboration Invite
                </Button>
              </div>
              <p className="text-center mt-2.5 text-[8px] text-slate-400 font-medium tracking-tight">
                Permissions can be changed later by the project owner.
              </p>
            </div>
          </>
        )}
      </DialogContent>
      
      {/* Loading Dialog */}
      <Dialog open={isGenerating} onOpenChange={() => {}}>
        <DialogContent className="max-w-[400px] p-0 rounded-[18px] overflow-hidden [&>button]:hidden">
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-purple animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Generating Collaboration Invite</h3>
            <p className="text-xs text-slate-500 text-center">Please wait while we prepare your collaboration invite...</p>
          </div>
        </DialogContent>
      </Dialog>

      <CollaborationInvitePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        project={project}
        clientProfile={clientProfile}
        leadName={leadName}
        share={share}
        role={role}
        responsibilities={responsibilities}
        permissions={permissions}
      />
    </Dialog>
  );
};

