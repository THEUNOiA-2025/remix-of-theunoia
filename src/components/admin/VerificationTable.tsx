import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Verification {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  institute_email: string | null;
  institute_name: string | null;
  enrollment_id: string | null;
  id_card_url: string | null;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  college?: {
    name: string;
    city: string;
  };
}

interface VerificationTableProps {
  verifications: Verification[];
  onRefresh: () => void;
}

export const VerificationTable = ({ verifications, onRefresh }: VerificationTableProps) => {
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleViewIdCard = async (verification: Verification) => {
    if (!verification.id_card_url) {
      toast.error('No ID card uploaded');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('student-id-cards')
        .createSignedUrl(verification.id_card_url, 300);

      if (error) throw error;
      setIdCardUrl(data.signedUrl);
      setSelectedVerification(verification);
      setShowIdCard(true);
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error('Failed to load ID card');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verification: Verification) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_verifications')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
        })
        .eq('id', verification.id);

      if (error) throw error;
      toast.success('Verification approved successfully');
      onRefresh();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_verifications')
        .update({
          verification_status: 'rejected',
          rejection_reason: rejectionReason || null,
        })
        .eq('id', selectedVerification.id);

      if (error) throw error;
      toast.success('Verification rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedVerification(null);
      onRefresh();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green/30 text-green-foreground">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-secondary/30 text-secondary-foreground">Pending</Badge>;
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>College</TableHead>
              <TableHead>Institute Email</TableHead>
              <TableHead>Enrollment ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No verification requests found
                </TableCell>
              </TableRow>
            ) : (
              verifications.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {verification.user_profile?.first_name} {verification.user_profile?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {verification.user_profile?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {verification.college ? (
                      <div>
                        <p className="font-medium">{verification.college.name}</p>
                        <p className="text-sm text-muted-foreground">{verification.college.city}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{verification.institute_email || '-'}</TableCell>
                  <TableCell>{verification.enrollment_id || '-'}</TableCell>
                  <TableCell>{getStatusBadge(verification.verification_status)}</TableCell>
                  <TableCell>
                    {format(new Date(verification.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {verification.id_card_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewIdCard(verification)}
                          disabled={loading}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {verification.verification_status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-foreground hover:bg-green/20"
                            onClick={() => handleApprove(verification)}
                            disabled={loading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedVerification(verification);
                              setRejectDialogOpen(true);
                            }}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ID Card Preview Dialog */}
      <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student ID Card</DialogTitle>
          </DialogHeader>
          {idCardUrl && (
            <div className="flex justify-center">
              <img
                src={idCardUrl}
                alt="Student ID Card"
                className="max-h-96 rounded-lg border border-border"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
