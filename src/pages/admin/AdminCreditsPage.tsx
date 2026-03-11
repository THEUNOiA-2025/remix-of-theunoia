import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Coins, Search, Plus, Minus, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';

interface FreelancerCredit {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  notes: string | null;
  created_at: string;
}

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState<FreelancerCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<FreelancerCredit | null>(null);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [modifyAmount, setModifyAmount] = useState('');
  const [modifyNotes, setModifyNotes] = useState('');
  const [modifyType, setModifyType] = useState<'add' | 'deduct'>('add');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      // Fetch all freelancer credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('freelancer_credits')
        .select('*')
        .order('balance', { ascending: false });

      if (creditsError) throw creditsError;

      // Fetch user profiles for all users
      if (creditsData && creditsData.length > 0) {
        const userIds = creditsData.map(c => c.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const creditsWithProfiles = creditsData.map(credit => ({
          ...credit,
          user_profile: profilesData?.find(p => p.user_id === credit.user_id)
        }));

        setCredits(creditsWithProfiles);
      } else {
        setCredits([]);
      }
    } catch (error: any) {
      console.error('Error fetching credits:', error);
      toast.error('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    }
  };

  const handleModifyCredits = async () => {
    if (!selectedUser || !modifyAmount || !modifyNotes.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseInt(modifyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    setSubmitting(true);
    try {
      const finalAmount = modifyType === 'add' ? amount : -amount;
      
      const { error } = await supabase.rpc('admin_modify_credits', {
        _target_user_id: selectedUser.user_id,
        _amount: finalAmount,
        _notes: modifyNotes.trim()
      });

      if (error) throw error;

      toast.success(`Successfully ${modifyType === 'add' ? 'added' : 'deducted'} ${amount} credits`);
      setModifyDialogOpen(false);
      setModifyAmount('');
      setModifyNotes('');
      setSelectedUser(null);
      fetchCredits();
    } catch (error: any) {
      console.error('Error modifying credits:', error);
      toast.error(error.message || 'Failed to modify credits');
    } finally {
      setSubmitting(false);
    }
  };

  const openModifyDialog = (user: FreelancerCredit, type: 'add' | 'deduct') => {
    setSelectedUser(user);
    setModifyType(type);
    setModifyAmount('');
    setModifyNotes('');
    setModifyDialogOpen(true);
  };

  const openHistoryDialog = (user: FreelancerCredit) => {
    setSelectedUser(user);
    fetchUserTransactions(user.user_id);
    setHistoryDialogOpen(true);
  };

  const filteredCredits = credits.filter(credit => {
    if (!searchQuery) return true;
    const fullName = `${credit.user_profile?.first_name || ''} ${credit.user_profile?.last_name || ''}`.toLowerCase();
    const email = credit.user_profile?.email?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'admin_grant':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Admin Grant</Badge>;
      case 'admin_deduct':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">Admin Deduct</Badge>;
      case 'bid_placed':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Bid Placed</Badge>;
      case 'project_posted':
        return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">Task Posted</Badge>;
      case 'signup_bonus':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">Signup Bonus</Badge>;
      case 'refund':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">Refund</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const totalCredits = credits.reduce((sum, c) => sum + c.balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading credits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Credit Management</h1>
        <p className="text-muted-foreground mt-2">Manage user credits and view transaction history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits in System</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credit Cost per Bid</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credit Cost per Task</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Credits</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCredits.map((credit) => (
                  <TableRow key={credit.id}>
                    <TableCell className="font-medium">
                      {credit.user_profile?.first_name} {credit.user_profile?.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {credit.user_profile?.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={credit.balance > 0 ? 'default' : 'destructive'}>
                        {credit.balance} credits
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(credit.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModifyDialog(credit, 'add')}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModifyDialog(credit, 'deduct')}
                          className="gap-1"
                        >
                          <Minus className="h-3 w-3" />
                          Deduct
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openHistoryDialog(credit)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modify Credits Dialog */}
      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>
              {modifyType === 'add' ? 'Add Credits' : 'Deduct Credits'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-muted-foreground">User</Label>
              <p className="font-medium">
                {selectedUser?.user_profile?.first_name} {selectedUser?.user_profile?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedUser?.user_profile?.email}</p>
              <p className="text-sm mt-1">Current Balance: <span className="font-semibold">{selectedUser?.balance} credits</span></p>
            </div>
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter credit amount"
                value={modifyAmount}
                onChange={(e) => setModifyAmount(e.target.value)}
                min={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Reason / Notes *</Label>
              <Textarea
                id="notes"
                placeholder="Enter the reason for this adjustment..."
                value={modifyNotes}
                onChange={(e) => setModifyNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleModifyCredits}
                disabled={submitting}
                variant={modifyType === 'add' ? 'default' : 'destructive'}
              >
                {submitting ? 'Processing...' : modifyType === 'add' ? 'Add Credits' : 'Deduct Credits'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="bg-background max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <div className="mb-4">
              <p className="font-medium">
                {selectedUser?.user_profile?.first_name} {selectedUser?.user_profile?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">Current Balance: {selectedUser?.balance} credits</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions found</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          {getTransactionBadge(tx.transaction_type)}
                          {tx.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{tx.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {tx.balance_after}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
