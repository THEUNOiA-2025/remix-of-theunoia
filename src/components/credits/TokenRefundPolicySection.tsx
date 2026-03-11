import { useState } from 'react';
import { TOKEN_REFUND_POLICY } from '@/lib/credits/tokenRefundPolicy';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RotateCcw, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Token Refund Policy section – when tokens are refunded vs not.
 * Phantom logic: policy text only. Backend will apply refunds; when ready, connect per-bid status (TokenRefundStatus).
 */
export function TokenRefundPolicySection() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                {TOKEN_REFUND_POLICY.title}
              </h2>
              {open ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
            </div>
            {!open && (
              <p className="text-sm text-muted-foreground mt-1">
                When tokens are refunded vs not – click to expand.
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Tokens will be refunded only if:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                {TOKEN_REFUND_POLICY.refundedWhen.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <X className="h-4 w-4 text-amber-600" />
                Tokens will NOT be refunded if:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                {TOKEN_REFUND_POLICY.notRefundedWhen.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
