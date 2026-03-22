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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Shield, ShieldOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string | null;
  profile_picture_url: string | null;
  created_at: string;
  city: string | null;
  phone: string | null;
  bio: string | null;
  is_admin?: boolean;
  freelancer_access?: {
    has_access: boolean;
  };
  student_verification?: {
    verification_status: string;
  };
}

interface UserTableProps {
  users: UserProfile[];
  onRefresh: () => void;
}

export const UserTable = ({ users, onRefresh }: UserTableProps) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleViewDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    setLoading(true);
    try {
      if (user.is_admin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success('Admin role removed');
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.user_id,
            role: 'admin',
          });

        if (error) throw error;
        toast.success('Admin role granted');
      }
      onRefresh();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast.error('Failed to update admin role');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUserTypeBadge = (userType: string | null) => {
    if (userType === 'student') {
      return <Badge className="bg-primary/20 text-primary">Student</Badge>;
    }
    return <Badge variant="secondary">Non-Student</Badge>;
  };

  const getVerificationStatus = (user: UserProfile) => {
    const status = user.student_verification?.verification_status;
    if (!status) return <span className="text-muted-foreground">-</span>;
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green/30 text-green-foreground">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-secondary/30 text-secondary-foreground">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <span className="text-muted-foreground">-</span>;
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Freelancer Access</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile_picture_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {user.first_name} {user.last_name}
                          </p>
                          {user.is_admin && (
                            <Badge className="bg-accent-purple/20 text-accent-purple-foreground text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getUserTypeBadge(user.user_type)}</TableCell>
                  <TableCell>{getVerificationStatus(user)}</TableCell>
                  <TableCell>
                    {user.freelancer_access?.has_access ? (
                      <Badge className="bg-green/30 text-green-foreground">Active</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAdmin(user)}
                        disabled={loading}
                        className={user.is_admin ? 'text-destructive hover:bg-destructive/10' : 'text-accent-purple-foreground hover:bg-accent-purple/10'}
                      >
                        {user.is_admin ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedUser.first_name, selectedUser.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">User Type</p>
                  <p className="font-medium capitalize">{selectedUser.user_type || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{selectedUser.city || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">
                    {format(new Date(selectedUser.created_at), 'PPP')}
                  </p>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="text-sm">{selectedUser.bio}</p>
                </div>
              )}

              <div className="flex gap-2">
                {getUserTypeBadge(selectedUser.user_type)}
                {getVerificationStatus(selectedUser)}
                {selectedUser.freelancer_access?.has_access && (
                  <Badge className="bg-green/30 text-green-foreground">Freelancer</Badge>
                )}
                {selectedUser.is_admin && (
                  <Badge className="bg-accent-purple/20 text-accent-purple-foreground">Admin</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
