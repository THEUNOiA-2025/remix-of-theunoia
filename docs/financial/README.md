# Financial System Documentation

This folder contains documentation for the THEUNOiA platform's financial system.

## Documents

| Document | Description |
|----------|-------------|
| [BACKEND-REQUIREMENTS.md](./BACKEND-REQUIREMENTS.md) | Complete backend requirements including database tables, API endpoints, business logic, integrations, and security |

## Quick Reference

### Fee Structure

| Party | Fee | GST on Fee |
|-------|-----|------------|
| Client | 3% of contract value | 18% |
| Freelancer | 5% of contract value | 18% |

### Tax Rates

| Tax Type | Rate | Notes |
|----------|------|-------|
| TDS | 10% | Section 194J - Professional fees |
| TCS | 1% | Collected by platform, credit to freelancer |
| GST | 18% | On service (if freelancer registered) and platform fees |

### TDS Threshold

- **Single Payment**: > ₹30,000
- **Cumulative in FY**: > ₹30,000 (per client-freelancer pair)

### FD Mechanism for TDS

1. TDS amount held in FD for 30 days (+5 working days buffer)
2. If Form 16A uploaded before maturity → Refund to client
3. If FD matures without Form 16A → Release to freelancer
4. Interest on FD belongs to platform

## Frontend Implementation Status

- [x] Financial constants and types
- [x] Calculation functions (freelancer payout, client payable, milestone breakdown)
- [x] PAN/GSTIN validation functions
- [x] Freelancer payout preview page (`/bid-preview`)
- [x] PAN/GSTIN fields in Signup page
- [x] PAN/GSTIN fields in Edit Profile page
- [ ] Client payable preview (pending)
- [ ] Bid comparison view for clients (pending)
- [ ] Invoice PDF viewer (pending)
- [ ] TDS status tracker (pending)

## Backend Implementation Status

- [ ] Database tables (pending)
- [ ] API endpoints (pending)
- [ ] Razorpay integration (pending)
- [ ] Invoice generation (pending)
- [ ] TDS/TCS tracking (pending)
- [ ] Settlement processing (pending)

---

*Last Updated: February 6, 2026*
