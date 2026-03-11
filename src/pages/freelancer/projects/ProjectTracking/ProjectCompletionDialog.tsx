import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectTrackingService } from "@/services/ProjectTrackingService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";

interface ProjectCompletionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    onSuccess: () => void;
}

interface UploadedFile {
    name: string;
    url: string;
    type: string;
    size: number;
}

export const ProjectCompletionDialog = ({ open, onOpenChange, projectId, onSuccess }: ProjectCompletionDialogProps) => {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const handleSubmit = async () => {
        if (!message.trim()) {
            toast.error("Please provide a completion message.");
            return;
        }

        setIsSubmitting(true);
        try {
            await ProjectTrackingService.submitProjectCompletion(projectId, message, files);
            toast.success("Project completion request submitted successfully!");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting completion:", error);
            toast.error("Failed to submit completion request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Submit Project for Completion</DialogTitle>
                    <DialogDescription>
                        Provide final deliverables and notes to the client to request project completion.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="completion-message">Completion Message</Label>
                        <Textarea
                            id="completion-message"
                            placeholder="Describe the final deliverables and any notes for the client..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Attach Deliverables (Optional)</Label>
                        <FileUploader
                            type="file"
                            maxFiles={5}
                            maxSizeInMB={50}
                            onFilesChange={setFiles}
                            currentFiles={files}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()} className="bg-primary-purple hover:bg-primary-purple/90">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit for Approval"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
