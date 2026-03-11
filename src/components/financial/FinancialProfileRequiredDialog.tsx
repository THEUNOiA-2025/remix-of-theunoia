import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, FileText, User } from "lucide-react";

interface FinancialProfileRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: "bid" | "post_project";
}

export function FinancialProfileRequiredDialog({
  open,
  onOpenChange,
  action = "bid",
}: FinancialProfileRequiredDialogProps) {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    onOpenChange(false);
    navigate("/profile/edit");
  };

  const actionText = action === "bid" ? "place a bid" : "post a project";
  const actionTitle = action === "bid" ? "Place a Bid" : "Post a Project";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Financial Details Required
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            You need to complete your financial profile before you can {actionText}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Required Information
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong>PAN Number</strong> - Mandatory for tax compliance (TDS/TCS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong>GST Status</strong> - Required to determine service tax applicability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong>GSTIN</strong> - Required only if you are GST registered</span>
              </li>
            </ul>
          </div>

          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-sm text-center">
              <strong>How to complete:</strong>
              <br />
              Go to <span className="text-primary font-semibold">Profile</span> → 
              Click <span className="text-primary font-semibold">Edit Profile</span> → 
              Fill the <span className="text-primary font-semibold">Financial Details</span> section
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleGoToProfile}
            className="w-full h-11 font-bold rounded-xl"
          >
            <User className="w-4 h-4 mr-2" />
            Go to Edit Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-10 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
