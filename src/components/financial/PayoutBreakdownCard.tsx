/**
 * PayoutBreakdownCard Component
 * Displays freelancer payout breakdown with all deductions
 * Design based on CheckoutPage.tsx style
 */

import { Info, Wallet, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { PayoutBreakdown } from '@/types/financial';
import { formatINR } from '@/lib/financial/calculations';

interface PayoutBreakdownCardProps {
  breakdown: PayoutBreakdown;
  /** Show detailed explanations */
  showDetails?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
}

export function PayoutBreakdownCard({ 
  breakdown, 
  showDetails = true,
  compact = false 
}: PayoutBreakdownCardProps) {
  const {
    contractValue,
    serviceGST,
    grossAmount,
    platformFee,
    platformFeeGST,
    tcs,
    tds,
    tdsApplicable,
    netPayout,
  } = breakdown;

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-full bg-accent-green/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#145214]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Payout</p>
              <p className="text-xl font-black text-[#145214]">{formatINR(netPayout)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contract</p>
            <p className="text-sm font-bold text-slate-700">{formatINR(contractValue)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-4">
      <h3 className="text-slate-900 text-base font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary-purple text-lg">account_balance_wallet</span>
        Payout Breakdown
      </h3>
      
      <div className="space-y-2">
        {/* Contract Value */}
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 font-semibold text-sm">Contract Value</span>
          <span className="font-bold text-slate-900 text-sm">{formatINR(contractValue)}</span>
        </div>

        {/* GST on Service (if applicable) */}
        {serviceGST !== null && (
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-semibold text-sm flex items-center gap-1.5">
              GST on Service (18%)
              {showDetails && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-green/20 text-[9px] font-bold text-[#145214]">
                  COLLECTED
                </span>
              )}
            </span>
            <span className="font-bold text-accent-green text-sm">+{formatINR(serviceGST)}</span>
          </div>
        )}

        <div className="h-px bg-slate-100 w-full my-2" />

        {/* Gross Amount */}
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Gross Amount</span>
          <span className="font-bold text-slate-900 text-sm">{formatINR(grossAmount)}</span>
        </div>

        <div className="h-px bg-slate-100 w-full my-2" />

        {/* Deductions Header */}
        <div className="flex items-center gap-1.5 py-1">
          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deductions</span>
        </div>

        {/* Platform Fee */}
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 font-semibold text-sm">Platform Fee (5%)</span>
          <span className="font-bold text-red-500 text-sm">-{formatINR(platformFee)}</span>
        </div>

        {/* GST on Platform Fee */}
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 font-semibold text-sm">GST on Platform Fee (18%)</span>
          <span className="font-bold text-red-500 text-sm">-{formatINR(platformFeeGST)}</span>
        </div>

        {/* TCS */}
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 font-semibold text-sm flex items-center gap-1.5">
            TCS (1%)
            {showDetails && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-purple/10 text-[9px] font-bold text-primary-purple">
                CREDIT TO YOU
              </span>
            )}
          </span>
          <span className="font-bold text-red-500 text-sm">-{formatINR(tcs)}</span>
        </div>

        {/* TDS (if applicable) */}
        {tdsApplicable && tds !== null && (
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-semibold text-sm flex items-center gap-1.5">
              TDS (10%)
              {showDetails && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-yellow/30 text-[9px] font-bold text-[#73480d]">
                  HELD IN FD
                </span>
              )}
            </span>
            <span className="font-bold text-red-500 text-sm">-{formatINR(tds)}</span>
          </div>
        )}

        {/* Net Payout */}
        <div className="mt-4 bg-accent-green rounded-lg p-4 flex justify-between items-center shadow-inner">
          <span className="text-[#145214] font-black text-xs uppercase tracking-widest">Net Payout</span>
          <span className="text-xl font-black text-[#145214] tracking-tight">{formatINR(netPayout)}</span>
        </div>

        {/* Info Notes */}
        {showDetails && (
          <div className="mt-4 space-y-2">
            {/* TCS Note */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-purple/5 border border-primary-purple/10">
              <Info className="w-4 h-4 text-primary-purple shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-primary-purple">TCS (1%)</span> is deducted and deposited to the government. 
                You can claim this credit when filing your Income Tax Return.
              </p>
            </div>

            {/* TDS Note */}
            {tdsApplicable && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary-yellow/10 border border-secondary-yellow/20">
                <AlertTriangle className="w-4 h-4 text-[#73480d] shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-[#73480d]">TDS (10%)</span> is held in a Fixed Deposit. 
                  If client uploads Form 16A, TDS is refunded to them. Otherwise, you receive it after FD maturity.
                </p>
              </div>
            )}

            {/* GST Note */}
            {serviceGST !== null && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
                <CheckCircle2 className="w-4 h-4 text-[#145214] shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-[#145214]">GST (18%)</span> is collected from the client as you are GST registered. 
                  You must file GST returns and remit this amount.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PayoutBreakdownCard;
