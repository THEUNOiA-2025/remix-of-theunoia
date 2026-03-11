import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  city?: string;
  pinCode?: string;
}

const creditPlans: Record<string, { name: string; tokens: number; price: number; originalPrice?: number }> = {
  starter: { name: 'Starter', tokens: 100, price: 99 },
  value: { name: 'Value', tokens: 670, price: 499 },
  pro: { name: 'Pro', tokens: 1500, price: 999 },
};

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const planId = searchParams.get('plan');
  const plan = planId ? creditPlans[planId] : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email, city, pin_code')
        .eq('user_id', user.id)
        .single();

      console.log("User ID:", user?.id);
      console.log("Data:", data);
      console.log("Error:", error);

      const row = data;
      if (row) {
        setProfile({
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          city: row.city || '',
          pinCode: row.pin_code || '',
        });
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <p className="text-muted-foreground">Invalid plan selected</p>
        <Button onClick={() => navigate('/buy-credits')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
      </div>
    );
  }

  const basePrice = plan.price;
  const platformFee = Math.round(basePrice * 0.02 * 100) / 100; // 2% platform fee
  const taxableAmount = basePrice + platformFee;
  const gst = Math.round(taxableAmount * 0.18 * 100) / 100; // 18% GST
  const totalPayable = Math.round((taxableAmount + gst) * 100) / 100;

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    
    // TODO: Integrate with Razorpay
    toast({
      title: "Coming Soon!",
      description: "Payment gateway integration is being set up. Stay tuned!",
    });
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/buy-credits')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Plans
        </Button>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Shield className="h-3 w-3 mr-1" />
          SECURE PAYMENT
        </Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Payment Summary</h1>
        <p className="text-muted-foreground">Review details before final confirmation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Transaction Breakdown & Billing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Breakdown */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-6 w-1 bg-primary rounded-full" />
                <h2 className="font-semibold text-foreground">Transaction Breakdown</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base Price ({plan.name} Plan)</span>
                  <span className="font-medium text-foreground">₹{basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform Commission (2%)</span>
                  <span className="font-medium text-foreground">₹{platformFee.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground uppercase tracking-wide">Taxable Amount</span>
                  <span className="font-medium text-foreground">₹{taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground uppercase tracking-wide">GST (18%)</span>
                  <span className="font-medium text-foreground">₹{gst.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center bg-green-100 dark:bg-green-900/30 -mx-6 px-6 py-4">
                  <span className="font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Total Payable</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">₹{totalPayable.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-6 w-1 bg-accent rounded-full" />
                <h2 className="font-semibold text-foreground">Billing Information</h2>
              </div>

              {profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Account Name</p>
                    <p className="font-medium text-foreground">{profile.firstName} {profile.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                    <p className="font-medium text-foreground">{profile.email}</p>
                  </div>
                  {(profile.city || profile.pinCode) && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                      <p className="font-medium text-foreground">
                        {[profile.city, profile.pinCode].filter(Boolean).join(', ')}
                        {profile.city || profile.pinCode ? ', India' : ''}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Loading billing information...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Final Amount & Policy */}
        <div className="space-y-6">
          {/* Final Payment Amount */}
          <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-primary/30">
            <CardContent className="p-6 text-center">
              <p className="text-xs text-primary uppercase tracking-wide mb-2 font-medium">
                Final Payment Amount
              </p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-foreground">₹{Math.floor(totalPayable)}</span>
                <span className="text-xl text-muted-foreground">.{(totalPayable % 1).toFixed(2).substring(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.name} Plan • {plan.tokens} Tokens
              </p>

              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={handleProceedToPayment}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </CardContent>
          </Card>

          {/* Payment Details & Policy */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground text-sm">Payment Details & Policy</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <Badge variant="outline" className="text-xs shrink-0">Refund</Badge>
                  <p className="text-muted-foreground">
                    Refunds are processed to the original payment method within 5-7 business days.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="text-xs shrink-0">Note</Badge>
                  <p className="text-muted-foreground">
                    Platform commission is a service fee and is non-refundable.
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <p className="text-xs text-muted-foreground">
                By proceeding, you agree to THEUNOiA's{' '}
                <Link to="/terms-and-conditions" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/terms-and-conditions" className="text-primary hover:underline">Refund Policy</Link>.
                You will be redirected to a secure payment portal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex justify-center gap-8 mt-8 text-sm text-muted-foreground">
        <Link to="/terms-and-conditions" className="hover:text-foreground transition-colors">Terms</Link>
        <Link to="/terms-and-conditions" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link to="/contact" className="hover:text-foreground transition-colors">Support</Link>
      </div>
    </div>
  );
};

export default CheckoutPage;
