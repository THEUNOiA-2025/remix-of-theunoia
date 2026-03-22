import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FREE_TOKEN_POLICY } from '@/lib/credits/freeTokenPolicy';
import { useFreeTokenStatus } from '@/hooks/useFreeTokenStatus';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Check, Gift, UserPlus, FileCheck, Gavel, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Free Token Policy section – freelancers only. Shows 4 ways to earn tokens; status from useFreeTokenStatus (backend-ready). */
export function FreeTokenPolicySection() {
  const { data: status, isLoading } = useFreeTokenStatus();

  const [open, setOpen] = useState(false);

  if (isLoading || !status) {
    return (
      <Card className="border-[#fbdd84]/50 bg-[#fbdd84]/5">
        <CardHeader className="py-3 px-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-primary" />
            How to earn free tokens
          </h2>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </CardHeader>
      </Card>
    );
  }

  const steps = status.profileCompletion.steps;

  const items = [
    {
      key: 'signup',
      title: 'A. On Sign Up',
      tokens: FREE_TOKEN_POLICY.SIGNUP,
      description: '100 free tokens when you create an account.',
      granted: status.signupBonus.granted,
      icon: UserPlus,
    },
    {
      key: 'profile',
      title: 'B. Profile Completion',
      tokens: FREE_TOKEN_POLICY.PROFILE_COMPLETION,
      description: 'Complete profile, student verification, skill verification, portfolio & DigiLocker.',
      granted: status.profileCompletion.granted,
      icon: FileCheck,
      extra: !status.profileCompletion.granted && (
        <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
          <li className={cn('flex items-center gap-1', steps.profileComplete && 'text-green-600')}>
            {steps.profileComplete ? <Check className="h-3 w-3" /> : <span className="w-3" />}
            Profile complete
          </li>
          <li className={cn('flex items-center gap-1', steps.studentVerification && 'text-green-600')}>
            {steps.studentVerification ? <Check className="h-3 w-3" /> : <span className="w-3" />}
            Student verification
          </li>
          <li className={cn('flex items-center gap-1', steps.skillVerification && 'text-green-600')}>
            {steps.skillVerification ? <Check className="h-3 w-3" /> : <span className="w-3" />}
            Skill verification
          </li>
          <li className={cn('flex items-center gap-1', steps.portfolioUploaded && 'text-green-600')}>
            {steps.portfolioUploaded ? <Check className="h-3 w-3" /> : <span className="w-3" />}
            Portfolio uploaded
          </li>
          <li className={cn('flex items-center gap-1', steps.digilockerVerified && 'text-green-600')}>
            {steps.digilockerVerified ? <Check className="h-3 w-3" /> : <span className="w-3" />}
            DigiLocker verified
          </li>
        </ul>
      ),
    },
    {
      key: 'first5bids',
      title: 'C. First 5 Bids',
      tokens: FREE_TOKEN_POLICY.FIRST_5_BIDS,
      description: '20 free tokens after you place your first 5 bids.',
      granted: status.firstFiveBids.granted,
      icon: Gavel,
      extra:
        !status.firstFiveBids.granted &&
        `Progress: ${status.firstFiveBids.bidsPlaced}/5 bids`,
    },
    {
      key: 'weekly',
      title: 'D. Weekly Free Tokens',
      tokens: FREE_TOKEN_POLICY.WEEKLY,
      description: '50 free tokens every week.',
      granted: !!status.weekly.lastClaimedAt,
      icon: Calendar,
      extra:
        status.weekly.nextClaimAvailableAt &&
        `Next claim: ${new Date(status.weekly.nextClaimAvailableAt).toLocaleDateString()}`,
    },
  ];

  return (
    <Card className="border-[#fbdd84]/50 bg-[#fbdd84]/5">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-[#fbdd84]/10 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-primary" />
                How to earn free tokens
              </h2>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
            {!open && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Click to expand – freelancers can earn free tokens in multiple ways.
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4 grid gap-3 sm:grid-cols-2">
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Freelancers can earn free tokens in multiple ways. Backend will credit tokens when conditions are met.
            </p>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    item.granted ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">{item.title}</p>
                        <p className="text-sm font-bold text-primary">{item.tokens} tokens</p>
                      </div>
                    </div>
                    {item.granted && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 shrink-0 text-[10px] px-1.5 py-0">
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Claimed
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{item.description}</p>
                  {item.extra && <div className="mt-1">{item.extra}</div>}
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      <div className="px-4 py-2 border-t border-border/60 bg-muted/20 rounded-b-lg">
        <p className="text-xs text-muted-foreground text-center">
          To check your token balance, go to{' '}
          <Link to="/bids" className="font-medium text-primary hover:underline">
            My Bids
          </Link>{' '}
          page.
        </p>
      </div>
    </Card>
  );
}
