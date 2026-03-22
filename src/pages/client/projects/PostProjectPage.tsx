import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, FolderTree, Calendar, Upload, X, Search, Loader2, IndianRupee } from "lucide-react";
import { getCategoryList, getSubcategoriesForCategory } from "@/data/categories";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectService, ProjectFile } from "@/services/projectService";

const PostProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state: navigationState } = useLocation();
  const isFromCommunity = navigationState?.is_community || false;
  const communityCollegeId = navigationState?.college_id || null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [biddingDeadline, setBiddingDeadline] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = getCategoryList();
  const subcategories = primaryCategory
    ? getSubcategoriesForCategory(primaryCategory)
    : [];

  const addSkill = () => {
    const value = skillsInput.trim();
    if (value && !skills.includes(value)) {
      setSkills((s) => [...s, value]);
      setSkillsInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((s) => s.filter((x) => x !== skill));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) setFiles((prev) => [...prev, ...Array.from(selected)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files;
    if (dropped) setFiles((prev) => [...prev, ...Array.from(dropped)]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    // Validate required fields
    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a project description");
      return;
    }
    if (!primaryCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!user?.id) {
      toast.error("You must be logged in to post a project");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload files first
      let uploadedFiles: ProjectFile[] = [];
      if (files.length > 0) {
        toast.info("Uploading files...");
        const uploadPromises = files.map(file => ProjectService.uploadFile(file, 'project-files'));
        const results = await Promise.all(uploadPromises);
        uploadedFiles = results.filter((f): f is ProjectFile => f !== null);
      }

      // 2. Build the project data
      const projectData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category: primaryCategory || null,
        subcategory: subcategory || null,
        skills_required: skills.length > 0 ? skills : null,
        budget: budget ? parseFloat(budget) : null,
        bidding_deadline: biddingDeadline ? new Date(biddingDeadline).toISOString() : null,
        project_type: 'client_project' as const,
        status: 'open' as const,
        is_community_task: isFromCommunity,
        community_college_id: (communityCollegeId && !communityCollegeId.startsWith('00000000')) ? communityCollegeId : null,
        timeline: (communityCollegeId && communityCollegeId.startsWith('00000000')) ? navigationState?.college_name : null,
        attached_files: uploadedFiles.length > 0 ? uploadedFiles : null,
      };

      // 3. Create project via service
      await ProjectService.createProject(projectData);

      toast.success("Project posted successfully!");
      if (isFromCommunity) {
        navigate("/community");
      } else {
        navigate("/projects");
      }
    } catch (error: any) {
      console.error("Error posting project:", error);
      toast.error(error.message || "Failed to post project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f8] dark:bg-background flex flex-col">
      <main className="flex-1 flex justify-center py-6 px-4">
        <div className="flex flex-col max-w-[700px] w-full gap-5">
          <div className="flex flex-col gap-1 px-1">
            <h1 className="text-2xl font-black leading-tight tracking-[-0.02em] font-display text-[#121118] dark:text-white">
              Post Your Project
            </h1>
            <p className="text-[#68608a] dark:text-[#a09bbd] text-sm font-normal leading-normal">
              Share your brief and get matched with vetted talent.
            </p>
          </div>

          {/* Single container: Project Details + Categorization & Skills + Bidding + Documents + Review (ring, no inner containers) */}
          <div className="bg-white dark:bg-white/5 rounded-xl p-6 shadow-sm border border-primary/5 ring-2 ring-primary/5">
            <section className="p-0 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#121118] dark:text-white">
                  Project Details
                </h2>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#121118] dark:text-white text-sm font-medium">
                    Project Title
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Design a high-converting landing page for SaaS"
                    className="rounded-lg border-[#dddbe6] h-11 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#121118] dark:text-white text-sm font-medium">
                    Full Description
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the goals, deliverables, and any specific requirements for this project..."
                    className="rounded-lg border-[#dddbe6] min-h-[120px] p-3 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                  />
                  <p className="text-[#68608a] text-[11px] pt-0.5">
                    Tip: Detailed descriptions attract higher quality talent and lead to more accurate quotes.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-0 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <FolderTree className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#121118] dark:text-white">
                  Categorization & Skills
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#121118] dark:text-white text-sm font-medium">
                    Primary Category
                  </Label>
                  <Select value={primaryCategory} onValueChange={(v) => { setPrimaryCategory(v); setSubcategory(""); }}>
                    <SelectTrigger className="rounded-lg border-[#dddbe6] h-11 px-3 text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#121118] dark:text-white text-sm font-medium">
                    Subcategory
                  </Label>
                  <Select value={subcategory} onValueChange={setSubcategory} disabled={!primaryCategory}>
                    <SelectTrigger className="rounded-lg border-[#dddbe6] h-11 px-3 text-sm">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label className="text-[#121118] dark:text-white text-sm font-medium">
                  Required Skills
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Search and add skills (e.g. Figma, React, Typescript)"
                      className="rounded-lg border-[#dddbe6] h-11 px-3 pr-9 text-sm focus:ring-2 focus:ring-primary"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#68608a]" />
                  </div>
                  <Button type="button" variant="outline" onClick={addSkill} className="rounded-lg h-11 px-3 border-[#dddbe6] shrink-0 text-sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:opacity-70"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="p-0 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#121118] dark:text-white">
                  Budget & Timeline
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#121118] dark:text-white text-sm font-medium">
                    Project Budget (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68608a] text-sm">₹</span>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 5000"
                      min="0"
                      className="rounded-lg border-[#dddbe6] h-11 pl-7 pr-3 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[#68608a] text-[11px]">
                    Enter your estimated budget for this project
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#121118] dark:text-white text-sm font-medium">
                    Bidding Deadline
                  </Label>
                  <Input
                    type="date"
                    value={biddingDeadline}
                    onChange={(e) => setBiddingDeadline(e.target.value)}
                    className="rounded-lg border-[#dddbe6] h-11 px-3 text-sm focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[#68608a] text-[11px]">
                    Last date for freelancers to submit bids
                  </p>
                </div>
              </div>
            </section>

            <section className="p-0 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#121118] dark:text-white">
                  Reference Documents
                </h2>
              </div>
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#dddbe6] rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="size-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-[#121118] dark:text-white">
                    Drop files here or click to upload
                  </p>
                  <p className="text-[#68608a] text-xs mt-0.5">
                    PDF, DOCX, ZIP, or high-res images (Max 50MB)
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-primary font-medium">
                      {files.length} file(s) selected
                    </p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg text-xs">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="p-0 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-black text-primary">Ready to launch?</h3>
                <p className="text-[#68608a] dark:text-[#a09bbd] text-xs">
                  Your project will be visible to vetted experts immediately after publishing.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 md:flex-none h-10 px-6 rounded-full border-primary/30 text-primary text-sm font-bold hover:bg-white"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="flex-1 md:flex-none h-10 px-8 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Project"
                  )}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostProjectPage;
