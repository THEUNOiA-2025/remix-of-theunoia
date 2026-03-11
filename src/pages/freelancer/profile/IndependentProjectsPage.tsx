import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Search, Plus, X, ArrowRight, CloudUpload, FileText } from "lucide-react";
import { toast } from "sonner";

const TEXT_PRIMARY = "#121118";
const TEXT_MUTED = "#68608a";
const PDF_MAX_MB = 15;
const COVER_IMAGE_MAX_MB = 5;

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

const MOCK_PORTFOLIO_ALL: PortfolioItem[] = [
  { id: "port-1", title: "HealthTech Mobile App", description: "Conceptual wellness tracking for athletes. Real-time metrics, goal setting, and recovery insights in one clean interface.", image_url: "/images/class1.png" },
  { id: "port-2", title: "Sustainable Brand Identity", description: "Visual identity for an eco-conscious startup. Logo, color system, and key touchpoints for a green tech brand.", image_url: "/images/dashboard-preview.png" },
  { id: "port-3", title: "Dashboard Analytics Module", description: "Custom dashboard with charts, filters and export. Built for a SaaS client to visualize user and revenue metrics.", image_url: "/images/class3.png" },
  { id: "port-4", title: "E‑commerce Checkout Flow", description: "Streamlined checkout and payment UX. Reduced steps and improved conversion for a retail client.", image_url: "/images/dashboard-hero.png" },
  { id: "port-5", title: "Neo-Banking Dashboard", description: "Modern banking dashboard for a fintech startup. Real-time balances, transactions and budgeting tools in one view.", image_url: "/images/class1.png" },
  { id: "port-6", title: "Crypto Wallet Extension", description: "Browser extension for secure crypto wallet. Clean UI for sending, receiving and portfolio overview.", image_url: "/images/dashboard-preview.png" },
];

const IndependentProjectsPage = () => {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState({ first: "", last: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    coverImageFile: null as File | null,
    pdfFile: null as File | null,
  });
  const [saving, setSaving] = useState(false);
  const [portfolioDragActive, setPortfolioDragActive] = useState(false);
  const [coverImageDragActive, setCoverImageDragActive] = useState(false);
  const portfolioFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const fromMeta = user.user_metadata as { firstName?: string; lastName?: string } | undefined;
    (async () => {
      const { data } = await supabase.from("user_profiles").select("first_name, last_name").eq("user_id", user.id).single();
      const row = data as { first_name?: string; last_name?: string } | undefined;
      setProfileName({
        first: row?.first_name ?? fromMeta?.firstName ?? "",
        last: row?.last_name ?? fromMeta?.lastName ?? "",
      });
    })();
  }, [user?.id, user?.user_metadata]);

  const filteredProjects = MOCK_PORTFOLIO_ALL.filter(
    (p) =>
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setPortfolioForm({ title: "", description: "", coverImageFile: null, pdfFile: null });
  };

  const handleCoverImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCoverImageDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      if (file.size > COVER_IMAGE_MAX_MB * 1024 * 1024) {
        toast.error(`Cover image must be under ${COVER_IMAGE_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, coverImageFile: file }));
    } else if (file) toast.error("Please upload an image file.");
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      if (file.size > COVER_IMAGE_MAX_MB * 1024 * 1024) {
        toast.error(`Cover image must be under ${COVER_IMAGE_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, coverImageFile: file }));
    } else if (file) toast.error("Please upload an image file.");
    e.target.value = "";
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPortfolioDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") {
      if (file.size > PDF_MAX_MB * 1024 * 1024) {
        toast.error(`PDF must be under ${PDF_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, pdfFile: file }));
    } else if (file) toast.error("Please upload a PDF file only.");
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") {
      if (file.size > PDF_MAX_MB * 1024 * 1024) {
        toast.error(`PDF must be under ${PDF_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, pdfFile: file }));
    } else if (file) toast.error("Please upload a PDF file only.");
    e.target.value = "";
  };

  const handleSavePortfolio = async () => {
    if (!user?.id) return;
    const { title, description, coverImageFile, pdfFile } = portfolioForm;
    if (!title.trim()) { toast.error("Project title is required."); return; }
    if (!description.trim()) { toast.error("Project description is required."); return; }
    if (!coverImageFile) { toast.error("Cover image is required."); return; }
    if (!pdfFile) { toast.error("Portfolio (PDF) is required."); return; }
    setSaving(true);
    try {
      const prefix = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const coverExt = coverImageFile.name.split(".").pop();
      const { error: coverError } = await supabase.storage.from("project-images").upload(`${prefix}-cover.${coverExt}`, coverImageFile);
      if (coverError) throw coverError;
      const { data: { publicUrl: coverUrl } } = supabase.storage.from("project-images").getPublicUrl(`${prefix}-cover.${coverExt}`);
      const pdfExt = pdfFile.name.split(".").pop();
      const { error: pdfError } = await supabase.storage.from("project-files").upload(`${prefix}.${pdfExt}`, pdfFile);
      if (pdfError) throw pdfError;
      const { data: { publicUrl: pdfUrl } } = supabase.storage.from("project-files").getPublicUrl(`${prefix}.${pdfExt}`);
      const { error: insertError } = await supabase.from("user_projects").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        cover_image_url: coverUrl,
        attached_files: [{ name: pdfFile.name, url: pdfUrl, type: pdfFile.type, size: pdfFile.size }],
        project_type: "portfolio_project",
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      toast.success("Portfolio project saved.");
      setUploadModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save portfolio.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = [profileName.first, profileName.last].filter(Boolean).join(" ") || "User";

  return (
    <div className="w-full max-w-[1280px] px-3 lg:px-4 py-6">
      {/* Header: user's name on top, "Independent Projects" below; search and upload alongside */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>
            {displayName}&apos;s
          </h1>
          <p className="text-2xl font-bold mt-0.5" style={{ color: TEXT_PRIMARY }}>
            Independent Projects
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1 sm:max-w-md lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: TEXT_MUTED }} />
            <input
              type="text"
              placeholder="Filter projects by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-[#68608a]/70"
            />
          </div>
          <Button
            className="bg-primary text-white font-bold rounded-xl hover:opacity-90 shrink-0 flex items-center justify-center gap-2"
            onClick={() => setUploadModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Upload New Project
          </Button>
        </div>
      </div>

      {/* Grid: 4 per row — white container: cover image, spacing, title, spacing, description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredProjects.map((item) => (
          <div key={item.id} className="group cursor-pointer bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="pt-4 px-4 pb-1">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full aspect-video object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
            <div className="px-4 pt-4 pb-5 flex flex-col flex-1">
              <h3 className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed line-clamp-3 mt-3" style={{ color: TEXT_MUTED }}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <p className="text-center py-12 text-sm" style={{ color: TEXT_MUTED }}>
          No projects match your search.
        </p>
      )}

      {/* Upload modal (same as Profile page) */}
      <Dialog open={uploadModalOpen} onOpenChange={(o) => { setUploadModalOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg w-full rounded-2xl shadow-2xl border border-gray-200 p-0 gap-0 [&>button]:hidden overflow-hidden bg-white">
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-[#121118]">Upload Portfolio Project</h2>
              <p className="text-xs text-[#68608a] mt-1">Add a project with cover image and PDF.</p>
            </div>
            <DialogClose className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1">Project Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Modern E-commerce Dashboard"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1">Project Description *</label>
                <textarea
                  placeholder="Describe your process and the problem you solved..."
                  rows={3}
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1">Cover Image *</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${coverImageDragActive ? "border-primary/50 bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"}`}
                  onDragEnter={(e) => { e.preventDefault(); setCoverImageDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setCoverImageDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCoverImageDrop}
                  onClick={() => coverImageInputRef.current?.click()}
                >
                  <input ref={coverImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
                  <CloudUpload className="h-7 w-7 text-primary mb-2" />
                  <p className="text-xs font-medium text-[#121118]">Drag & drop or click — Image only (Max {COVER_IMAGE_MAX_MB}MB)</p>
                  {portfolioForm.coverImageFile && <p className="mt-2 text-xs text-primary font-medium truncate max-w-full">{portfolioForm.coverImageFile.name}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1">Upload Portfolio (PDF) *</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${portfolioDragActive ? "border-primary/50 bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"}`}
                  onDragEnter={(e) => { e.preventDefault(); setPortfolioDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setPortfolioDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handlePdfDrop}
                  onClick={() => portfolioFileInputRef.current?.click()}
                >
                  <input ref={portfolioFileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfChange} />
                  <FileText className="h-7 w-7 text-primary mb-2" />
                  <p className="text-xs font-medium text-[#121118]">PDF only (Max {PDF_MAX_MB}MB)</p>
                  {portfolioForm.pdfFile && <p className="mt-2 text-xs text-primary font-medium truncate max-w-full">{portfolioForm.pdfFile.name}</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" className="px-4 py-2 text-xs font-bold text-[#68608a] hover:text-[#121118]" onClick={() => { setUploadModalOpen(false); resetForm(); }}>
              Discard
            </Button>
            <Button type="button" className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:opacity-95 shadow-lg shadow-primary/25 flex items-center gap-2" onClick={handleSavePortfolio} disabled={saving}>
              {saving ? "Saving…" : "Save to Portfolio"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndependentProjectsPage;
