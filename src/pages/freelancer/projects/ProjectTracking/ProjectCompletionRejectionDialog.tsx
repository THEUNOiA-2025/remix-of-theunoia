import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectTrackingService } from "@/services/ProjectTrackingService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProjectCompletionRejectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    onSuccess: () => void;
}

export const ProjectCompletionRejectionDialog = ({ open, onOpenChange, projectId, onSuccess }: ProjectCompletionRejectionDialogProps) => {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }

        setIsSubmitting(true);
        try {
            await ProjectTrackingService.rejectProjectCompletion(projectId, reason);
            toast.success("Project completion request rejected.");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error rejecting completion:", error);
            toast.error("Failed to reject completion request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reject Completion Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                        <Textarea
                            id="rejection-reason"
                            placeholder="Explain why the work is not yet complete..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()} variant="destructive">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Rejecting...
                            </>
                        ) : (
                            "Reject Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
