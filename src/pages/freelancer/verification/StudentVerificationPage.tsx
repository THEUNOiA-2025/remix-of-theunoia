import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Upload, X, Pencil, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const StudentVerificationPage = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "" });
  const [verification, setVerification] = useState<any>(null);
  const [states, setStates] = useState<string[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  const [stateOpen, setStateOpen] = useState(false);

  // College search state
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [selectedCollegeData, setSelectedCollegeData] = useState<any>(null);
  const [collegeOpen, setCollegeOpen] = useState(false);

  const [formData, setFormData] = useState({
    instituteEmail: "",
    enrollmentId: "",
  });
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [isEditingCollege, setIsEditingCollege] = useState(false);

  // Email OTP verification state
  const [emailVerificationStep, setEmailVerificationStep] = useState<'input' | 'sent' | 'verified'>('input');
  const [otpCode, setOtpCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle code expiry timer
  useEffect(() => {
    if (codeExpiresAt && emailVerificationStep === 'sent') {
      const interval = setInterval(() => {
        const now = new Date();
        if (now >= codeExpiresAt) {
          setEmailVerificationStep('input');
          setCodeExpiresAt(null);
          toast.error("Verification code expired. Please request a new one.");
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [codeExpiresAt, emailVerificationStep]);

  // Fetch states using the RPC function
  const fetchStates = async () => {
    setStatesLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_college_states');
      if (error) throw error;
      setStates((data || []).map((row: { state: string }) => row.state));
    } catch (error) {
      console.error("Error fetching states:", error);
      toast.error("Failed to load states");
    } finally {
      setStatesLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      // Fetch states first using RPC
      fetchStates();

      const profileRes = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();
      console.log("User ID:", user?.id);
      console.log("Data:", profileRes.data);
      console.log("Error:", profileRes.error);

      const verificationRes = await supabase.from("student_verifications").select("*, colleges(*)").eq("user_id", user.id).maybeSingle();
      console.log("User ID:", user?.id);
      console.log("Data:", verificationRes.data);
      console.log("Error:", verificationRes.error);

      const profileRow = profileRes.data;
      if (profileRow) {
        setProfile({
          firstName: profileRow.first_name || "",
          lastName: profileRow.last_name || "",
          email: profileRow.email || "",
        });
      }

      const verificationRow = verificationRes.data;
      if (verificationRow) {
        setVerification(verificationRow);
        setSelectedCollege(verificationRow.college_id || "");
        setFormData({
          instituteEmail: verificationRow.institute_email || "",
          enrollmentId: verificationRow.enrollment_id || "",
        });

        // Check if email is already verified
        if (verificationRow.email_verified) {
          setEmailVerificationStep('verified');
        }

        // If existing verification has a college, set the college data and state
        if (verificationRow.colleges) {
          setSelectedCollegeData(verificationRow.colleges);
          setSelectedState(verificationRow.colleges?.state || "");
        }

        // Load ID card if exists
        if (verificationRow.id_card_url) {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('student-id-cards')
              .createSignedUrl(verificationRow.id_card_url, 3600);

            if (signedUrlData?.signedUrl) {
              setIdCardPreview(signedUrlData.signedUrl);
            }
          } catch (error) {
            console.error('Error loading ID card:', error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load verification data");
    }
  };

  // Fetch ALL colleges for a state using pagination
  const fetchAllCollegesForState = useCallback(async (state: string) => {
    if (!state) {
      setColleges([]);
      return;
    }

    setCollegesLoading(true);
    try {
      let allColleges: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("colleges")
          .select("id, name, city, state")
          .eq("state", state)
          .eq("is_active", true)
          .order("name")
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allColleges = [...allColleges, ...data];
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      setColleges(allColleges);
    } catch (error) {
      console.error("Error fetching colleges:", error);
      toast.error("Failed to load colleges");
    } finally {
      setCollegesLoading(false);
    }
  }, []);

  // Fetch colleges when state changes
  useEffect(() => {
    if (selectedState) {
      fetchAllCollegesForState(selectedState);
    }
  }, [selectedState, fetchAllCollegesForState]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCollege("");
    setSelectedCollegeData(null);
    setColleges([]);
    setStateOpen(false);
  };

  const handleCollegeSelect = (college: any) => {
    setSelectedCollege(college.id);
    setSelectedCollegeData(college);
    setCollegeOpen(false);
  };

  const validateEmail = (email: string) => {
    const eduDomains = [".edu", ".ac.", ".edu."];
    return eduDomains.some((domain) => email.toLowerCase().includes(domain));
  };

  const handleSendVerificationCode = async () => {
    if (!formData.instituteEmail || !validateEmail(formData.instituteEmail)) {
      toast.error("Please enter a valid educational email (.edu or .ac domain)");
      return;
    }

    if (!session?.access_token) {
      toast.error("Please log in to continue");
      return;
    }

    setSendingCode(true);
    try {
      const response = await supabase.functions.invoke('send-email-verification', {
        body: { email: formData.instituteEmail },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send verification code");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setEmailVerificationStep('sent');
      setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
      setResendCooldown(60); // 60 second cooldown
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    if (!session?.access_token) {
      toast.error("Please log in to continue");
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: formData.instituteEmail,
          code: otpCode,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to verify code");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setEmailVerificationStep('verified');
      setCodeExpiresAt(null);
      toast.success("Email verified successfully!");

      // Refresh verification data
      fetchData();
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast.error(error.message || "Failed to verify code");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setOtpCode("");
    await handleSendVerificationCode();
  };

  const getTimeRemaining = () => {
    if (!codeExpiresAt) return "";
    const now = new Date();
    const diff = codeExpiresAt.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, or WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIdCardFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setIdCardPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setIdCardFile(null);
    setIdCardPreview("");
  };

  const uploadIdCard = async (): Promise<string | null> => {
    if (!idCardFile || !user?.id) return null;

    setUploading(true);
    try {
      const fileExt = idCardFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('student-id-cards')
        .upload(fileName, idCardFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error('Error uploading ID card:', error);
      toast.error('Failed to upload ID card');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (!selectedCollege) {
      toast.error("Please select your college");
      return;
    }

    const hasVerifiedEmail = emailVerificationStep === 'verified';
    const hasIdCard = idCardFile || idCardPreview;

    if (!hasVerifiedEmail && !hasIdCard) {
      toast.error("Please verify your email OR upload your student ID card");
      return;
    }

    setLoading(true);
    try {
      let idCardUrl = idCardPreview || null;

      if (idCardFile) {
        const uploadedUrl = await uploadIdCard();
        if (uploadedUrl) {
          idCardUrl = uploadedUrl;
        } else {
          setLoading(false);
          return;
        }
      }

      const verificationData: any = {
        user_id: user.id,
        college_id: selectedCollege,
        institute_email: formData.instituteEmail || null,
        enrollment_id: formData.enrollmentId || null,
        verification_status: "pending",
        id_card_url: idCardUrl,
        verification_method: hasVerifiedEmail ? 'email' : 'id_card',
        email_verified: hasVerifiedEmail,
        email_verified_at: hasVerifiedEmail ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("student_verifications").upsert(verificationData, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Verification request submitted successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit verification request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          variant: "default" as const,
          text: "Verified",
        };
      case "pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Pending",
        };
      case "rejected":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "destructive" as const,
          text: "Rejected",
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "outline" as const,
          text: "Not Verified",
        };
    }
  };

  const canSubmit = !verification ||
    verification.verification_status === "rejected" ||
    !verification.college_id ||
    isEditingCollege;
  const statusInfo = verification ? getStatusInfo(verification.verification_status) : null;

  // Get display text for selected college
  const getSelectedCollegeDisplay = () => {
    if (selectedCollegeData) {
      return `${selectedCollegeData.name} - ${selectedCollegeData.city}`;
    }
    if (selectedCollege) {
      const found = colleges.find(c => c.id === selectedCollege);
      if (found) return `${found.name} - ${found.city}`;
    }
    return null;
  };

  return (
    <main className="flex-1 p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/profile")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Profile
      </Button>

      <Card className="max-w-2xl rounded-2xl border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Verification</CardTitle>
              <CardDescription>
                Verify your student status to access freelancer features
              </CardDescription>
            </div>
            {statusInfo && (
              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                {statusInfo.icon}
                {statusInfo.text}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {verification?.verification_status === "pending" && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your verification request is being reviewed. We'll notify you once it's processed.
              </p>
            </div>
          )}

          {verification?.verification_status === "approved" && verification.college_id && !isEditingCollege && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Your student status has been verified! You now have access to all freelancer features.
              </p>
            </div>
          )}

          {isEditingCollege && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Updating College Information
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Select your new college and submit. Your verification will be reviewed again if necessary.
              </p>
            </div>
          )}

          {verification?.verification_status === "approved" && !verification.college_id && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Update Required
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please select your college to complete your verification and access community features.
              </p>
            </div>
          )}

          {verification?.verification_status === "rejected" && verification.rejection_reason && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Verification Rejected
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {verification.rejection_reason}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="college">College/University *</Label>
                {verification?.verification_status === "approved" && verification.college_id && !isEditingCollege && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingCollege(true)}
                    className="h-8 gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
                {isEditingCollege && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingCollege(false);
                      setSelectedCollege(verification?.college_id || "");
                      if (verification?.colleges) {
                        setSelectedCollegeData(verification.colleges);
                        setSelectedState(verification.colleges.state || "");
                      }
                    }}
                    className="h-8"
                  >
                    Cancel
                  </Button>
                )}
              </div>
              {verification?.verification_status === "approved" && verification.college_id && verification.colleges && !isEditingCollege ? (
                <div className="p-3 border border-border rounded-md bg-muted/50">
                  <p className="text-sm font-medium">
                    {verification.colleges.name} - {verification.colleges.city}, {verification.colleges.state}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* State Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm text-muted-foreground">Step 1: Select State</Label>
                    <Popover open={stateOpen} onOpenChange={setStateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={stateOpen}
                          disabled={!canSubmit || statesLoading}
                          className="w-full justify-between bg-background font-normal"
                        >
                          {statesLoading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading states...
                            </span>
                          ) : selectedState ? (
                            selectedState
                          ) : (
                            "Select state first..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search states..." />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No state found.</CommandEmpty>
                            <CommandGroup>
                              {states.map((state) => (
                                <CommandItem
                                  key={state}
                                  value={state}
                                  onSelect={() => handleStateChange(state)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedState === state ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {state}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* College Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="college" className="text-sm text-muted-foreground">Step 2: Search & Select College</Label>
                    <Popover open={collegeOpen} onOpenChange={setCollegeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={collegeOpen}
                          disabled={!canSubmit || !selectedState}
                          className="w-full justify-between bg-background font-normal"
                        >
                          {getSelectedCollegeDisplay() || (
                            selectedState ? "Type to search colleges..." : "Select state first..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command shouldFilter={true}>
                          <CommandInput
                            placeholder="Search your college..."
                          />
                          <CommandList className="max-h-[300px]">
                            {collegesLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading colleges...</span>
                              </div>
                            ) : colleges.length === 0 ? (
                              <CommandEmpty>No colleges found for this state.</CommandEmpty>
                            ) : (
                              <CommandGroup heading={`${colleges.length} colleges found`}>
                                {colleges.map((college) => (
                                  <CommandItem
                                    key={college.id}
                                    value={`${college.name} ${college.city}`}
                                    onSelect={() => handleCollegeSelect(college)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedCollege === college.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{college.name}</span>
                                      <span className="text-xs text-muted-foreground">{college.city}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Can't find your college? Contact support to add it.
              </p>
            </div>

            {/* Institute Email with OTP Verification */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="instituteEmail">
                  Institute Email {emailVerificationStep !== 'verified' && !idCardFile && !idCardPreview && "*"}
                </Label>
                {emailVerificationStep === 'verified' && (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              {emailVerificationStep === 'verified' ? (
                <div className="p-3 border border-green-200 dark:border-green-800 rounded-md bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      {formData.instituteEmail}
                    </span>
                  </div>
                </div>
              ) : emailVerificationStep === 'sent' ? (
                <div className="space-y-4">
                  <div className="p-3 border border-border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Verification code sent to:</p>
                    <p className="text-sm font-medium">{formData.instituteEmail}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Enter 6-digit code</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={setOtpCode}
                        disabled={verifyingCode}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      <Button
                        onClick={handleVerifyCode}
                        disabled={otpCode.length !== 6 || verifyingCode}
                        className="sm:w-auto"
                      >
                        {verifyingCode ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Code expires in: <span className="font-medium text-foreground">{getTimeRemaining()}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || sendingCode}
                      className="gap-1"
                    >
                      <RefreshCw className={cn("h-3 w-3", sendingCode && "animate-spin")} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailVerificationStep('input');
                      setOtpCode("");
                      setCodeExpiresAt(null);
                    }}
                  >
                    Change email
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="instituteEmail"
                      type="email"
                      value={formData.instituteEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, instituteEmail: e.target.value })
                      }
                      placeholder="student@university.edu"
                      disabled={!canSubmit}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendVerificationCode}
                      disabled={!formData.instituteEmail || !validateEmail(formData.instituteEmail) || sendingCode || !canSubmit}
                    >
                      {sendingCode ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Code
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your educational email (.edu or .ac domain) and verify it with a code
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idCard">
                Student ID Card {emailVerificationStep !== 'verified' && !formData.instituteEmail && "*"}
              </Label>
              <div className="space-y-3">
                {idCardPreview ? (
                  <div className="relative border-2 border-dashed border-border rounded-lg p-4">
                    <img
                      src={idCardPreview}
                      alt="ID Card Preview"
                      className="max-w-full h-auto max-h-64 mx-auto rounded-lg"
                    />
                    {canSubmit && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your student ID card
                    </p>
                    <Input
                      id="idCard"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                      disabled={!canSubmit}
                      className="hidden"
                    />
                    <Label
                      htmlFor="idCard"
                      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${canSubmit
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                    >
                      Choose File
                    </Label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  If you can't verify via email, upload a clear photo of your student ID card (JPG, PNG, or WEBP, max 5MB)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrollmentId">Enrollment ID (Optional)</Label>
              <Input
                id="enrollmentId"
                value={formData.enrollmentId}
                onChange={(e) =>
                  setFormData({ ...formData, enrollmentId: e.target.value })
                }
                placeholder="STU123456"
                disabled={!canSubmit}
              />
            </div>
          </div>

          {canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={loading || uploading || (emailVerificationStep !== 'verified' && !idCardFile && !idCardPreview)}
              className="w-full"
            >
              {uploading
                ? "Uploading..."
                : loading
                  ? "Submitting..."
                  : isEditingCollege
                    ? "Update College Information"
                    : "Submit Verification Request"}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default StudentVerificationPage;
