import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, ChevronRight, ChevronLeft, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { AgreementDialog } from '@/components/AgreementDialog';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// SHARED & FREELANCER SCHEMAS
// ============================================
const dobSchema = z.string().min(1, 'Date of Birth is required');

const phoneSchema = z.string().min(10, 'Mobile must be at least 10 digits');

const baseStep1Schema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['student', 'non-student']),
});

const studentStep1Schema = baseStep1Schema.extend({
  phone: phoneSchema,
  dob: dobSchema,
});

const studentStep2Schema = z.object({
  pan: z.string().trim().optional().refine(val => !val || (val.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(val)), 'Invalid PAN format'),
  gstRegistered: z.boolean(),
  gstin: z.string().optional(),
  gstState: z.string().optional(),
}).refine(data => {
  if (data.gstRegistered && (!data.gstin || data.gstin.trim().length < 15)) return false;
  return true;
}, { message: "GSTIN is required if GST Registered", path: ["gstin"] });

const freelancerStep3BankSchema = z.object({
  bankName: z.string().trim().optional(),
  bankAccNumber: z.string().trim().optional(),
  bankIfsc: z.string().trim().optional(),
  upiId: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  const hasUpi = !!data.upiId && data.upiId.trim().length > 0;
  const hasBankName = !!data.bankName && data.bankName.trim().length >= 2;
  const hasBankAcc = !!data.bankAccNumber && data.bankAccNumber.trim().length >= 6;
  const hasBankIfsc = !!data.bankIfsc && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(data.bankIfsc.trim());

  const hasAnyBankDetail = !!data.bankName || !!data.bankAccNumber || !!data.bankIfsc;
  const hasValidBank = hasBankName && hasBankAcc && hasBankIfsc;

  if (!hasUpi && !hasValidBank) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Either complete Bank Details OR UPI ID must be provided", path: ["upiId"] });
  }

  if (hasAnyBankDetail && !hasValidBank) {
    if (!hasBankName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid Account holder name is required", path: ["bankName"] });
    if (!hasBankAcc) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid account number is required (min 6 chars)", path: ["bankAccNumber"] });
    if (!hasBankIfsc) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid IFSC code is required", path: ["bankIfsc"] });
  }
});

const clientStep4BankSchema = z.object({
  bankName: z.string().trim().optional(),
  bankAccNumber: z.string().trim().optional(),
  bankIfsc: z.string().trim().optional(),
  upiId: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  const hasAnyBankDetail = !!data.bankName || !!data.bankAccNumber || !!data.bankIfsc;
  const hasBankName = !!data.bankName && data.bankName.trim().length >= 2;
  const hasBankAcc = !!data.bankAccNumber && data.bankAccNumber.trim().length >= 6;
  const hasBankIfsc = !!data.bankIfsc && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(data.bankIfsc.trim());

  if (hasAnyBankDetail && (!hasBankName || !hasBankAcc || !hasBankIfsc)) {
    if (!hasBankName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid Account holder name is required", path: ["bankName"] });
    if (!hasBankAcc) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid account number is required (min 6 chars)", path: ["bankAccNumber"] });
    if (!hasBankIfsc) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid IFSC code is required", path: ["bankIfsc"] });
  }
});

const studentStep4Schema = z.object({
  skillsCategory: z.string().trim().optional(),
  portfolioLink: z.string().trim().optional().refine(val => !val || val === '' || /^https?:\/\//i.test(val), { message: 'Invalid URL format (must include http/https)' }),
  educationLevel: z.string().trim().optional(),
  collegeName: z.string().trim().optional(),
});

// ============================================
// CLIENT SPECIFIC SCHEMAS
// ============================================
const clientStep1Schema = baseStep1Schema.extend({
  phone: phoneSchema,
});

const clientStep2Schema = z.object({
  clientType: z.enum([
    'Individual',
    'Sole Proprietor',
    'Partnership Firm',
    'LLP',
    'Private Limited Company',
    'Other Registered Entity'
  ], { required_error: 'Please select a client type' }),
});

const clientStep3IndividualSchema = z.object({
  pan: z.string().trim().optional().refine(val => !val || (val.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(val)), 'Invalid PAN format'),
  residentialAddress: z.string().trim().min(5, 'Address is required'),
  gstState: z.string().trim().min(2, 'State is required'),
  gstRegistered: z.boolean(),
  gstin: z.string().optional(),
  willDeductTds: z.boolean(),
  tan: z.string().optional(),
}).refine(data => !data.gstRegistered || (data.gstin && data.gstin.trim().length >= 15), { message: "GSTIN required if registered", path: ["gstin"] })
  .refine(data => !data.willDeductTds || (data.tan && data.tan.trim().length === 10), { message: "10-character TAN required if deducting TDS", path: ["tan"] })
  .refine(data => !data.willDeductTds || (data.pan && data.pan.trim().length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(data.pan.trim())), { message: "Valid PAN required if deducting TDS", path: ["pan"] });

const clientStep3BusinessSchema = z.object({
  legalBusinessName: z.string().trim().min(2, 'Business Name is required'),
  pan: z.string().trim().length(10, 'Entity PAN must be 10 characters').regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN format'),
  registeredAddress: z.string().trim().min(5, 'Registered Address is required'),
  gstState: z.string().trim().min(2, 'State is required'),
  gstin: z.string().optional(),
  willDeductTds: z.boolean(),
  tan: z.string().optional(),
}).refine(data => !data.willDeductTds || (data.tan && data.tan.trim().length === 10), { message: "10-character TAN required if deducting TDS", path: ["tan"] });

// ============================================
// COMPONENT
// ============================================

const Signup = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user } = useAuth();

  // Step State
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<'student' | 'non-student'>('student');
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  // Step 1: Account Details (Shared)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [dob, setDob] = useState(''); // Student only

  // Client Step 2: Client Type
  const [clientType, setClientType] = useState<string>('Individual');

  // Shared Tax & Identity (Student Step 2 / Client Step 3)
  const [pan, setPan] = useState('');
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');
  const [gstState, setGstState] = useState('');

  // Client Step 3 specific
  const [residentialAddress, setResidentialAddress] = useState('');
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [willDeductTds, setWillDeductTds] = useState(false);
  const [tan, setTan] = useState('');

  // Step 3 (Student) / Step 4 (Client): Bank Details
  const [bankName, setBankName] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState(''); // Student only

  // Step 4: Professional Details (Student Only)
  const [skillsCategory, setSkillsCategory] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [collegeName, setCollegeName] = useState('');

  // Step 5: Declarations
  const [studentDeclarations, setStudentDeclarations] = useState({
    terms: false, privacy: false, commission: false, tds: false, tcs: false, itr: false, authorize: false,
  });

  const [clientDeclarations, setClientDeclarations] = useState({
    terms: false, privacy: false, payments: false, commission: false, tdsHold: false, form16a: false, authorizeTds: false, defaultPenalty: false
  });

  const studentDeclarationsChecked = Object.values(studentDeclarations).every(Boolean);
  const clientDeclarationsChecked = Object.values(clientDeclarations).every(Boolean);

  const slides = ['/images/auth-slide-1.png', '/images/auth-slide-2.png', '/images/auth-slide-3.png'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleNextStep = () => {
    try {
      if (currentStep === 1) {
        if (userType === 'student') {
          studentStep1Schema.parse({ firstName, lastName, email, password, phone, dob, userType });
        } else {
          clientStep1Schema.parse({ firstName, lastName, email, password, phone, userType });
        }
        if (!isPhoneVerified) {
          toast({ title: 'Verification Required', description: 'Please verify your mobile number (simulated)', variant: 'destructive' });
          return;
        }
      }

      else if (currentStep === 2) {
        if (userType === 'student') {
          studentStep2Schema.parse({ pan, gstRegistered, gstin, gstState });
        } else {
          clientStep2Schema.parse({ clientType });
        }
      }

      else if (currentStep === 3) {
        if (userType === 'student') {
          freelancerStep3BankSchema.parse({ bankName, bankAccNumber, bankIfsc, upiId });
        } else {
          if (clientType === 'Individual') {
            clientStep3IndividualSchema.parse({ pan, residentialAddress, gstState, gstRegistered, gstin, willDeductTds, tan });
          } else {
            clientStep3BusinessSchema.parse({ legalBusinessName, pan, registeredAddress, gstState, gstin, willDeductTds, tan });
          }
        }
      }

      else if (currentStep === 4) {
        if (userType === 'student') {
          studentStep4Schema.parse({ skillsCategory, portfolioLink, educationLevel, collegeName });
        } else {
          clientStep4BankSchema.parse({ bankName, bankAccNumber, bankIfsc, upiId });
        }
      }

      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'student' && !studentDeclarationsChecked) return;
    if (userType === 'non-student' && !clientDeclarationsChecked) return;

    setLoading(true);

    try {
      const metadata: any = {
        firstName,
        lastName,
        userType,
        phone,
        signupIp: '127.0.0.1',
        signupDevice: navigator.userAgent,
        declarationsAccepted: true,
        consentVersion: 'v1.0',
        tdsConsentAccepted: userType === 'non-student' ? willDeductTds : false
      };

      if (userType === 'student') {
        Object.assign(metadata, {
          dob,
          pan,
          gstRegistered,
          gstin: gstRegistered ? gstin : null,
          gstState: gstRegistered ? gstState : null,
          bankName,
          bankAccNumber,
          bankIfsc: bankIfsc.toUpperCase(),
          upiId,
          skillsCategory,
          portfolioLink,
          educationLevel,
          collegeName,
        });
      } else {
        Object.assign(metadata, {
          clientType,
          pan,
          gstState,
          bankName,
          bankAccNumber,
          bankIfsc: bankIfsc.toUpperCase(),
          willDeductTds,
          tan: willDeductTds ? tan.toUpperCase() : null,
        });

        if (clientType === 'Individual') {
          Object.assign(metadata, {
            residentialAddress,
            gstRegistered,
            gstin: gstRegistered ? gstin.toUpperCase() : null
          })
        } else {
          Object.assign(metadata, {
            legalBusinessName,
            registeredAddress,
            gstin: gstin ? gstin.toUpperCase() : null
          })
        }
      }

      const { error } = await signUp(email, password, metadata);

      if (error) throw error;

      toast({
        title: 'Account created successfully!',
        description: 'Please check your email to verify your account.',
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      toast({ title: 'Error', description: 'Please enter a valid 10-digit mobile number', variant: 'destructive' });
      return;
    }
    setIsSendingOtp(true);
    try {
      // Send +91 by default if they just enter 10 digits
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone: formattedPhone }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOtpSent(true);
      toast({ title: 'Success', description: 'OTP sent to your mobile number (Simulated in Server Logs for now)' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send OTP', variant: 'destructive' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length < 6) return;
    setIsVerifyingOtp(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      const { data, error } = await supabase.functions.invoke('verify-phone-otp', {
        body: { phone: formattedPhone, otp: otpInput }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIsPhoneVerified(true);
      setOtpSent(false);
      toast({ title: 'Success', description: 'Mobile number verified successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Invalid or expired OTP', variant: 'destructive' });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ==========================================
  // RENDERERS
  // ==========================================

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>I want to join as a</Label>
        <RadioGroup value={userType} onValueChange={(value) => { setUserType(value as 'student' | 'non-student'); setCurrentStep(1); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 border rounded-xl cursor-pointer transition-colors ${userType === 'student' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => { setUserType('student'); setCurrentStep(1); }}>
              <RadioGroupItem value="student" id="student" className="sr-only" />
              <Label htmlFor="student" className="cursor-pointer">
                <div className="font-semibold text-base mb-1">Freelancer</div>
                <div className="text-sm text-muted-foreground font-normal">Find work & earn money</div>
              </Label>
            </div>
            <div className={`p-4 border rounded-xl cursor-pointer transition-colors ${userType === 'non-student' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => { setUserType('non-student'); setCurrentStep(1); }}>
              <RadioGroupItem value="non-student" id="non-student" className="sr-only" />
              <Label htmlFor="non-student" className="cursor-pointer">
                <div className="font-semibold text-base mb-1">Client</div>
                <div className="text-sm text-muted-foreground font-normal">Hire top talent</div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="First Name (as per PAN)" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      {userType === 'student' && (
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date().toISOString().split('T')[0]} />
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile Number</Label>
          <div className="flex gap-2">
            <Input 
              id="phone" 
              type="tel" 
              placeholder="10-digit mobile number" 
              value={phone} 
              onChange={e => { 
                setPhone(e.target.value); 
                setIsPhoneVerified(false); 
                setOtpSent(false); 
              }} 
              disabled={isPhoneVerified}
            />
            {!isPhoneVerified && (
              <Button type="button" variant="outline" onClick={handleSendOtp} disabled={isSendingOtp || isPhoneVerified || phone.length < 10}>
                {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
            )}
          </div>
        </div>

        {otpSent && !isPhoneVerified && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="otp">Enter 6-digit OTP</Label>
            <div className="flex gap-2">
              <Input 
                id="otp" 
                type="text" 
                placeholder="000000" 
                maxLength={6} 
                value={otpInput} 
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))} 
              />
              <Button type="button" variant="default" onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpInput.length < 6}>
                {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify
              </Button>
            </div>
          </div>
        )}

        {isPhoneVerified && (
          <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 p-2 rounded-md">
            <Check className="h-4 w-4 mr-2" /> Mobile number verified
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input id="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="button" onClick={handleNextStep} className="w-full text-base font-bold rounded-full h-11">
        Continue <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderClientStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <Label className="text-base text-foreground mb-4 block">Select Client Type *</Label>
        <RadioGroup value={clientType} onValueChange={(val) => setClientType(val)}>
          {[
            'Individual',
            'Sole Proprietor',
            'Partnership Firm',
            'LLP',
            'Private Limited Company',
            'Other Registered Entity'
          ].map((type) => (
            <div key={type} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setClientType(type)}>
              <RadioGroupItem value={type} id={`client-type-${type}`} />
              <Label htmlFor={`client-type-${type}`} className="flex-1 cursor-pointer font-medium">{type === 'Individual' ? 'Individual (Non-Business / Personal Use)' : type}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handlePreviousStep} className="flex-1 rounded-full"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button type="button" onClick={handleNextStep} className="flex-1 rounded-full">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );

  const renderTaxAndIdentityStep = () => {
    // Shared structure for Student Step 2 and Client Step 3
    if (userType === 'student') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-2">
            <Label htmlFor="pan">PAN Number (Optional)</Label>
            <Input id="pan" placeholder="ABCDE1234F" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10} />
            <p className="text-xs text-amber-600 p-2 rounded bg-amber-50">Note: If PAN is not provided accurately, higher TDS rates may apply as per law.</p>
          </div>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="gstRegistered" checked={gstRegistered} onCheckedChange={(checked) => setGstRegistered(!!checked)} />
              <Label htmlFor="gstRegistered" className="font-medium cursor-pointer">I am GST Registered</Label>
            </div>
            {gstRegistered && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN Number *</Label>
                  <Input id="gstin" placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} maxLength={15} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstState">GST State *</Label>
                  <Input id="gstState" placeholder="e.g. Maharashtra" value={gstState} onChange={e => setGstState(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handlePreviousStep} className="flex-1 rounded-full"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button type="button" onClick={handleNextStep} className="flex-1 rounded-full">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      );
    }

    // Client Legal & Tax Step
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {clientType !== 'Individual' && (
          <div className="space-y-2">
            <Label htmlFor="legalBusinessName">Legal Business Name *</Label>
            <Input id="legalBusinessName" placeholder="As per registration" value={legalBusinessName} onChange={e => setLegalBusinessName(e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pan">{clientType === 'Individual' ? 'PAN (Optional)' : 'PAN of Entity *'}</Label>
            <Input id="pan" placeholder="ABCDE1234F" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstState">State *</Label>
            <Input id="gstState" placeholder="e.g. Maharashtra" value={gstState} onChange={e => setGstState(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{clientType === 'Individual' ? 'Residential Address *' : 'Registered Address *'}</Label>
          <Input id="address" placeholder="Full address" value={clientType === 'Individual' ? residentialAddress : registeredAddress} onChange={e => clientType === 'Individual' ? setResidentialAddress(e.target.value) : setRegisteredAddress(e.target.value)} />
        </div>

        {clientType === 'Individual' ? (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="gstRegistered" checked={gstRegistered} onCheckedChange={(checked) => setGstRegistered(!!checked)} />
              <Label htmlFor="gstRegistered" className="font-medium cursor-pointer">I am GST Registered</Label>
            </div>
            {gstRegistered && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="gstin">GSTIN Number (Optional for Individuals)</Label>
                <Input id="gstin" placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} maxLength={15} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (if registered)</Label>
            <Input id="gstin" placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} maxLength={15} />
          </div>
        )}

        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="flex items-center space-x-3">
            <Checkbox id="willDeductTds" checked={willDeductTds} onCheckedChange={(checked) => setWillDeductTds(!!checked)} />
            <Label htmlFor="willDeductTds" className="font-medium cursor-pointer">I will deduct TDS (if applicable)</Label>
          </div>
          {willDeductTds && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="tan">TAN Number *</Label>
              <Input id="tan" placeholder="ABCD12345E" value={tan} onChange={e => setTan(e.target.value.toUpperCase())} maxLength={10} />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handlePreviousStep} className="flex-1 rounded-full"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button type="button" onClick={handleNextStep} className="flex-1 rounded-full">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </div>
    );
  };

  const renderBankDetails = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground mb-2">
        {userType === 'student' ? 'This information is strictly required so that we can process your project payouts.' : 'This account will be used only for refunds, if applicable.'}
      </div>
      <div className="space-y-2">
        <Label htmlFor="bankName">Account Holder Name {userType === 'student' ? '(Required if no UPI)' : '(Optional)'}</Label>
        <Input id="bankName" placeholder="As per bank records" value={bankName} onChange={e => setBankName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bankAccNumber">Bank Account Number {userType === 'student' ? '(Required if no UPI)' : '(Optional)'}</Label>
        <Input id="bankAccNumber" placeholder="Enter account number" value={bankAccNumber} onChange={e => setBankAccNumber(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bankIfsc">IFSC Code {userType === 'student' ? '(Required if no UPI)' : '(Optional)'}</Label>
        <Input id="bankIfsc" placeholder="e.g. SBIN0001234" value={bankIfsc} onChange={e => setBankIfsc(e.target.value.toUpperCase())} />
      </div>

      {userType === 'student' && (
        <div className="space-y-2 mt-4 pt-4 border-t border-border">
          <Label htmlFor="upiId">UPI ID (Required if no Bank Account provided)</Label>
          <Input id="upiId" placeholder="name@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handlePreviousStep} className="flex-1 rounded-full"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button type="button" onClick={handleNextStep} className="flex-1 rounded-full">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );

  const renderStudentStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <Label htmlFor="skillsCategory">Primary Skills Category</Label>
        <Input id="skillsCategory" placeholder="e.g. Web Development, Design, Writing" value={skillsCategory} onChange={e => setSkillsCategory(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="portfolioLink">Portfolio Link (Optional)</Label>
        <Input id="portfolioLink" type="url" placeholder="https://yourportfolio.com" value={portfolioLink} onChange={e => setPortfolioLink(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="educationLevel">Education Level</Label>
          <select
            id="educationLevel"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            value={educationLevel}
            onChange={e => setEducationLevel(e.target.value)}
          >
            <option value="">Select Level</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate / Bachelors</option>
            <option value="postgraduate">Postgraduate / Masters</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="collegeName">College Name (Optional)</Label>
          <Input id="collegeName" placeholder="Institution name" value={collegeName} onChange={e => setCollegeName(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handlePreviousStep} className="flex-1 rounded-full"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button type="button" onClick={handleNextStep} className="flex-1 rounded-full">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );

  const renderDeclarations = () => {
    const toggleStudentDecl = (key: keyof typeof studentDeclarations) => setStudentDeclarations(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleClientDecl = (key: keyof typeof clientDeclarations) => setClientDeclarations(prev => ({ ...prev, [key]: !prev[key] }));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <p className="text-sm text-foreground font-medium mb-4">Please agree to the following mandatory declarations to proceed:</p>

        {userType === 'student' ? (
          <div className="bg-muted/40 p-5 rounded-xl space-y-4 border border-border">
            <div className="flex items-start space-x-3">
              <Checkbox id="decl-terms" checked={studentDeclarations.terms} onCheckedChange={(c) => { if (c === false) toggleStudentDecl('terms'); }} className="mt-1" />
              <Label htmlFor="decl-terms" className="text-sm cursor-pointer leading-normal flex-1">
                I agree to the <button type="button" onClick={() => setTermsDialogOpen(true)} className="text-primary underline hover:text-primary/80">Terms & Conditions</button>
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="decl-privacy" checked={studentDeclarations.privacy} onCheckedChange={() => toggleStudentDecl('privacy')} className="mt-1" />
              <Label htmlFor="decl-privacy" className="text-sm cursor-pointer leading-normal flex-1">I agree to the Privacy Policy</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="decl-comm" checked={studentDeclarations.commission} onCheckedChange={() => toggleStudentDecl('commission')} className="mt-1" />
              <Label htmlFor="decl-comm" className="text-sm cursor-pointer leading-normal flex-1">I understand that a Platform commission (plus applicable GST) will be deducted from my earnings</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="decl-tds" checked={studentDeclarations.tds} onCheckedChange={() => toggleStudentDecl('tds')} className="mt-1" />
              <Label htmlFor="decl-tds" className="text-sm cursor-pointer leading-normal flex-1">I understand that TDS may be deducted if statutory thresholds are crossed</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="decl-tcs" checked={studentDeclarations.tcs} onCheckedChange={() => toggleStudentDecl('tcs')} className="mt-1" />
              <Label htmlFor="decl-tcs" className="text-sm cursor-pointer leading-normal flex-1">I understand that TCS may be collected under GST law</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="decl-itr" checked={studentDeclarations.itr} onCheckedChange={() => toggleStudentDecl('itr')} className="mt-1" />
              <Label htmlFor="decl-itr" className="text-sm cursor-pointer leading-normal flex-1">I agree to file my Income Tax Return to claim tax credits</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="decl-auth" checked={studentDeclarations.authorize} onCheckedChange={() => toggleStudentDecl('authorize')} className="mt-1" />
              <Label htmlFor="decl-auth" className="text-sm cursor-pointer leading-normal font-medium flex-1">I authorize THEUNOiA to deduct applicable taxes and fees</Label>
            </div>
          </div>
        ) : (
          <div className="bg-muted/40 p-5 rounded-xl space-y-4 border border-border">
            <div className="flex items-start space-x-3">
              <Checkbox id="c-terms" checked={clientDeclarations.terms} onCheckedChange={(c) => { if (c === false) toggleClientDecl('terms'); }} className="mt-1" />
              <Label htmlFor="c-terms" className="text-sm cursor-pointer leading-normal flex-1">
                I agree to the <button type="button" onClick={() => setTermsDialogOpen(true)} className="text-primary underline hover:text-primary/80">Terms & Conditions</button>
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="c-privacy" checked={clientDeclarations.privacy} onCheckedChange={() => toggleClientDecl('privacy')} className="mt-1" />
              <Label htmlFor="c-privacy" className="text-sm cursor-pointer leading-normal flex-1">I agree to the Privacy Policy</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="c-payments" checked={clientDeclarations.payments} onCheckedChange={() => toggleClientDecl('payments')} className="mt-1" />
              <Label htmlFor="c-payments" className="text-sm cursor-pointer leading-normal flex-1">I agree that all payments must be made through the Platform</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="c-comm" checked={clientDeclarations.commission} onCheckedChange={() => toggleClientDecl('commission')} className="mt-1" />
              <Label htmlFor="c-comm" className="text-sm cursor-pointer leading-normal flex-1">I understand that Platform Commission (plus applicable GST) will be charged above the Project value</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="c-tdsHold" checked={clientDeclarations.tdsHold} onCheckedChange={() => toggleClientDecl('tdsHold')} className="mt-1" />
              <Label htmlFor="c-tdsHold" className="text-sm cursor-pointer leading-normal flex-1">I understand that TDS, if applicable, may be held temporarily until compliance is verified</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="c-form16a" checked={clientDeclarations.form16a} onCheckedChange={() => toggleClientDecl('form16a')} className="mt-1" />
              <Label htmlFor="c-form16a" className="text-sm cursor-pointer leading-normal flex-1">I agree to upload Form 16A within statutory timelines (if TDS deducted)</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="c-auth" checked={clientDeclarations.authorizeTds} onCheckedChange={() => toggleClientDecl('authorizeTds')} className="mt-1" />
              <Label htmlFor="c-auth" className="text-sm cursor-pointer leading-normal flex-1">I authorize THEUNOiA to temporarily hold TDS amounts for compliance verification</Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="c-penalty" checked={clientDeclarations.defaultPenalty} onCheckedChange={() => toggleClientDecl('defaultPenalty')} className="mt-1" />
              <Label htmlFor="c-penalty" className="text-sm cursor-pointer leading-normal font-medium flex-1">I understand failure to upload Form 16A may result in release of the amount to the Freelancer</Label>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handlePreviousStep} className="flex-1 rounded-full" disabled={loading}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || (userType === 'student' ? !studentDeclarationsChecked : !clientDeclarationsChecked)}
            className="flex-1 rounded-full"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Account'}
          </Button>
        </div>

      </div>
    );
  };


  return (
    <div className="flex min-h-screen">
      <Helmet>
        <title>TheUnoia | Sign Up – Start Freelancing Today</title>
        <meta
          name="description"
          content="Create your TheUnoia account to access online jobs, start part time work, hire freelance talent, and begin earning online today."
        />
        <link rel="canonical" href="https://www.theunoia.com/signup" />
      </Helmet>
      {/* Left Side - Branding & Images */}
      <div className="hidden lg:flex lg:w-[45%] bg-muted flex-col justify-between p-12">
        <div className="flex items-center">
          <img src="/images/theunoia-logo.png" alt="THEUNOiA Logo" className="h-10 object-contain" />
        </div>
        <div className="space-y-6">
          <div className="bg-transparent rounded-3xl p-4 relative overflow-hidden">
            <div className="relative h-[550px] w-full flex items-center justify-center">
              {slides.map((slide, index) => (
                <img
                  key={index}
                  src={slide}
                  alt={`Slide ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                  style={{ mixBlendMode: 'multiply' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex flex-col items-center py-8 px-4 sm:px-8">
        <div className="w-full max-w-[500px] flex justify-end mb-4">
          <Link to="/login">
            <Button variant="ghost" className="text-sm font-medium">Login Instead</Button>
          </Link>
        </div>

        <div className="w-full max-w-[500px] flex-1 flex flex-col justify-center space-y-8">

          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {currentStep === 1 ? 'Create an account' :
                currentStep === 2 && userType === 'non-student' ? 'Client Type' :
                  currentStep === 2 && userType === 'student' ? 'Tax & Identity' :
                    currentStep === 3 && userType === 'non-student' ? 'Legal & Tax Details' :
                      currentStep === 3 && userType === 'student' ? 'Bank Details' :
                        currentStep === 4 && userType === 'non-student' ? 'Bank Details' :
                          currentStep === 4 && userType === 'student' ? 'Professional Profile' :
                            'Declarations'}
            </h1>
            <p className="text-muted-foreground">
              {currentStep === 1 && 'Get started with just a few details'}
              {currentStep === 2 && userType === 'non-student' && 'Select your organization structure'}
              {currentStep === 2 && userType === 'student' && 'Mandatory for statutory compliance'}
              {currentStep === 3 && userType === 'non-student' && 'Required tax and registration details'}
              {currentStep === 3 && userType === 'student' && 'Required for processing your payouts'}
              {currentStep === 4 && userType === 'non-student' && 'This account will be used only for refunds, if applicable'}
              {currentStep === 4 && userType === 'student' && 'Help clients discover your services (Optional)'}
              {currentStep === 5 && 'Final step to complete registration'}
            </p>
          </div>

          {currentStep > 1 && (
            <div className="flex items-center justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors 
                    ${currentStep > step ? 'bg-primary text-primary-foreground' : currentStep === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'}`}>
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 5 && <div className={`w-8 h-1 mx-1 rounded-full ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>
          )}

          <div className="bg-card w-full rounded-2xl">
            <form onSubmit={(e) => e.preventDefault()}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && userType === 'student' && renderTaxAndIdentityStep()}
              {currentStep === 2 && userType === 'non-student' && renderClientStep2()}
              {currentStep === 3 && userType === 'student' && renderBankDetails()}
              {currentStep === 3 && userType === 'non-student' && renderTaxAndIdentityStep()}
              {currentStep === 4 && userType === 'student' && renderStudentStep4()}
              {currentStep === 4 && userType === 'non-student' && renderBankDetails()}
              {currentStep === 5 && renderDeclarations()}
            </form>
          </div>

        </div>
      </div>

      <AgreementDialog
        open={termsDialogOpen}
        onOpenChange={setTermsDialogOpen}
        type="terms"
        onAllSectionsAccepted={() => {
          if (userType === 'student') setStudentDeclarations(prev => ({ ...prev, terms: true }));
          else setClientDeclarations(prev => ({ ...prev, terms: true }));
          setTermsDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Signup;
