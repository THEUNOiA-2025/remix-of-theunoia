import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, X, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { validatePAN, validateGSTIN, formatPAN, formatGSTIN, extractPANFromGSTIN, getStateFromGSTIN, getPANHolderType } from "@/lib/financial/validators";

const SKILLS_STORAGE_KEY = (userId: string) => `profile_role_skills_${userId}`;

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    dateOfBirth: null as Date | null,
    city: "",
    pinCode: "",
    bio: "",
    phone: "",
    website: "",
    billingAddress: "",
  });
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Financial fields
  const [panNumber, setPanNumber] = useState("");
  const [isGSTRegistered, setIsGSTRegistered] = useState(false);
  const [gstinNumber, setGstinNumber] = useState("");
  const [panError, setPanError] = useState<string | null>(null);
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Additional fields
  const [bankName, setBankName] = useState("");
  const [bankAccNumber, setBankAccNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");

  useEffect(() => {
    if (!user) return;

    // First name, last name, email from account creation (auth) — show immediately
    const meta = user.user_metadata as {
      firstName?: string;
      lastName?: string;
      panNumber?: string;
      isGSTRegistered?: boolean;
      gstinNumber?: string;
    } | undefined;
    setProfile((prev) => ({
      ...prev,
      firstName: meta?.firstName ?? prev.firstName,
      lastName: meta?.lastName ?? prev.lastName,
      email: user.email ?? prev.email,
    }));

    // Load financial data from user_metadata
    if (meta?.panNumber) setPanNumber(meta.panNumber);
    if (meta?.isGSTRegistered !== undefined) setIsGSTRegistered(meta.isGSTRegistered);
    if (meta?.gstinNumber) setGstinNumber(meta.gstinNumber);

    fetchProfile();
    try {
      const raw = localStorage.getItem(SKILLS_STORAGE_KEY(user.id));
      if (raw) {
        const parsed = JSON.parse(raw) as { role?: string; skills?: string[] };
        if (parsed.role) setRole(parsed.role);
        if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
      }
    } catch {
      // ignore invalid stored data
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    // First name, last name, email come from account creation (auth), read-only
    const meta = user.user_metadata as {
      firstName?: string;
      lastName?: string;
      panNumber?: string;
      isGSTRegistered?: boolean;
      gstinNumber?: string;
    } | undefined;
    const fromAuth = {
      firstName: meta?.firstName ?? "",
      lastName: meta?.lastName ?? "",
      email: user.email ?? "",
    };

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const row = data as {
        gender?: string;
        date_of_birth?: string;
        city?: string;
        pin_code?: string;
        bio?: string;
        phone?: string;
        website?: string;
        billing_address?: string;
        pan_number?: string;
        is_gst_registered?: boolean;
        gstin_number?: string;
        bank_account_name?: string;
        bank_account_number?: string;
        bank_ifsc?: string;
        upi_id?: string;
        portfolio_link?: string;
      };

      setProfile({
        ...fromAuth,
        gender: row?.gender || "",
        dateOfBirth: row?.date_of_birth ? new Date(row.date_of_birth) : null,
        city: row?.city || "",
        pinCode: row?.pin_code || "",
        bio: row?.bio || "",
        phone: row?.phone || "",
        website: row?.website || "",
        billingAddress: row?.billing_address || "",
      });

      // Load financial data from database if available
      if (row?.pan_number) setPanNumber(row.pan_number);
      if (row?.is_gst_registered !== undefined) setIsGSTRegistered(row.is_gst_registered);
      if (row?.gstin_number) setGstinNumber(row.gstin_number);
      if (row?.bank_account_name) setBankName(row.bank_account_name);
      if (row?.bank_account_number) setBankAccNumber(row.bank_account_number);
      if (row?.bank_ifsc) setBankIfsc(row.bank_ifsc);
      if (row?.upi_id) setUpiId(row.upi_id);
      if (row?.portfolio_link) setPortfolioLink(row.portfolio_link);
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Still show name/email from auth even if user_profiles fails
      setProfile((prev) => ({ ...prev, ...fromAuth }));
      toast.error("Failed to load profile data");
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    // Reset errors
    setPanError(null);
    setGstinError(null);

    // Validate PAN (mandatory)
    if (panNumber.trim()) {
      const panValidation = validatePAN(panNumber);
      if (!panValidation.valid) {
        setPanError(panValidation.error || 'Invalid PAN');
        return;
      }
    } else {
      setPanError('PAN number is required');
      return;
    }

    // Validate GSTIN if GST registered
    if (isGSTRegistered) {
      if (!gstinNumber.trim()) {
        setGstinError('GSTIN is required for GST registered users');
        return;
      }
      const gstinValidation = validateGSTIN(gstinNumber);
      if (!gstinValidation.valid) {
        setGstinError(gstinValidation.error || 'Invalid GSTIN');
        return;
      }
      // Cross-validate PAN matches GSTIN
      const embeddedPAN = extractPANFromGSTIN(gstinNumber);
      if (embeddedPAN && embeddedPAN !== formatPAN(panNumber)) {
        setGstinError('PAN in GSTIN does not match your PAN number');
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          gender: profile.gender,
          date_of_birth: profile.dateOfBirth?.toISOString().split("T")[0],
          city: profile.city,
          pin_code: profile.pinCode,
          bio: profile.bio,
          phone: profile.phone,
          website: profile.website,
          // Financial fields
          pan_number: formatPAN(panNumber),
          is_gst_registered: isGSTRegistered,
          gstin_number: isGSTRegistered ? formatGSTIN(gstinNumber) : null,
          bank_account_name: bankName,
          bank_account_number: bankAccNumber,
          bank_ifsc: bankIfsc,
          upi_id: upiId,
          portfolio_link: portfolioLink,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Also update auth metadata for immediate access
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          panNumber: formatPAN(panNumber),
          isGSTRegistered: isGSTRegistered,
          gstinNumber: isGSTRegistered ? formatGSTIN(gstinNumber) : null,
        }
      });

      if (updateError) {
        console.error("Error updating auth metadata:", updateError);
      }

      localStorage.setItem(
        SKILLS_STORAGE_KEY(user.id),
        JSON.stringify({ role, skills })
      );

      // Trigger Razorpay Fund Account Creation if payout details are provided
      if (upiId || (bankAccNumber && bankIfsc && bankName)) {
        toast.loading("Setting up payout account...", { id: "payout-setup" });
        const type = upiId ? 'vpa' : 'bank_account';
        const details = upiId
          ? { upi_id: upiId }
          : { bank_account_name: bankName, bank_account_number: bankAccNumber, bank_ifsc: bankIfsc };

        const { data: fundData, error: fundError } = await supabase.functions.invoke('create-razorpay-fund-account', {
          body: { userId: user.id, type, details }
        });

        toast.dismiss("payout-setup");

        if (fundError || fundData?.error) {
          console.error("Razorpay fund error:", fundError || fundData?.error);
          toast.error("Profile saved, but payout account setup failed. " + (fundData?.error || ""));
        } else {
          toast.success("Profile updated and payout account ready!");
          navigate("/profile");
          return;
        }
      }

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.error("Skill already added");
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
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

      <Card className="max-w-3xl rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">Name and email are from your account and cannot be changed here.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profile.gender}
              onValueChange={(value) =>
                setProfile({ ...profile, gender: value })
              }
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <div className="grid grid-cols-3 gap-3">
              <Select
                value={profile.dateOfBirth ? profile.dateOfBirth.getFullYear().toString() : ""}
                onValueChange={(year) => {
                  const currentDate = profile.dateOfBirth || new Date();
                  const newDate = new Date(
                    parseInt(year),
                    currentDate.getMonth(),
                    Math.min(currentDate.getDate(), new Date(parseInt(year), currentDate.getMonth() + 1, 0).getDate())
                  );
                  setProfile({ ...profile, dateOfBirth: newDate });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={profile.dateOfBirth ? profile.dateOfBirth.getMonth().toString() : ""}
                onValueChange={(month) => {
                  const currentDate = profile.dateOfBirth || new Date();
                  const year = currentDate.getFullYear();
                  const newDate = new Date(
                    year,
                    parseInt(month),
                    Math.min(currentDate.getDate(), new Date(year, parseInt(month) + 1, 0).getDate())
                  );
                  setProfile({ ...profile, dateOfBirth: newDate });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={profile.dateOfBirth ? profile.dateOfBirth.getDate().toString() : ""}
                onValueChange={(day) => {
                  const currentDate = profile.dateOfBirth || new Date();
                  const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day));
                  setProfile({ ...profile, dateOfBirth: newDate });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from(
                    {
                      length: profile.dateOfBirth
                        ? new Date(profile.dateOfBirth.getFullYear(), profile.dateOfBirth.getMonth() + 1, 0).getDate()
                        : 31
                    },
                    (_, i) => i + 1
                  ).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                placeholder="Enter your city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinCode">Pin Code</Label>
              <Input
                id="pinCode"
                value={profile.pinCode}
                onChange={(e) =>
                  setProfile({ ...profile, pinCode: e.target.value })
                }
                placeholder="Enter pin code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-secondary-foreground">
              Role (for job matching)
            </Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer, Backend Developer"
              className="bg-secondary/15 border-secondary/30 text-secondary-foreground placeholder:text-secondary-foreground/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills" className="text-primary">
              Skills (for job matching)
            </Label>
            <p className="text-xs text-muted-foreground">
              Add skills like React, TypeScript, Node.js, etc. They help match you with relevant projects.
            </p>
            <div className="flex gap-2">
              <Input
                id="skills"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. React, Node.js, Python"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={addSkill}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary border border-primary/30"
                  >
                    {skill}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-primary/20"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) =>
                setProfile({ ...profile, bio: e.target.value })
              }
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={profile.website}
              onChange={(e) =>
                setProfile({ ...profile, website: e.target.value })
              }
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingAddress">Billing Address</Label>
            <Textarea
              id="billingAddress"
              value={profile.billingAddress}
              onChange={(e) =>
                setProfile({ ...profile, billingAddress: e.target.value })
              }
              placeholder="Enter your billing address"
              rows={3}
            />
          </div>

          {/* Financial Details Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-base">Financial Details</h3>
              <div className="group relative">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50 border">
                  PAN is mandatory for tax compliance (TDS deductions). GSTIN is required if you are GST registered.
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="panNumber">
                PAN Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="panNumber"
                  type="text"
                  placeholder="XXXXX0000X"
                  value={panNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().slice(0, 10);
                    setPanNumber(value);
                    if (panError) setPanError(null);
                  }}
                  className={`uppercase ${panError ? 'border-destructive' : ''}`}
                  maxLength={10}
                />
              </div>
              {panError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {panError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
              </p>
              {panNumber && panNumber.length === 10 && validatePAN(panNumber).valid && (
                <p className="text-xs text-primary">
                  Holder Type: {getPANHolderType(panNumber)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
              <div className="space-y-0.5">
                <Label htmlFor="gstRegistered" className="cursor-pointer">
                  Are you GST Registered?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable if you have a GSTIN for your business
                </p>
              </div>
              <Switch
                id="gstRegistered"
                checked={isGSTRegistered}
                onCheckedChange={(checked) => {
                  setIsGSTRegistered(checked);
                  if (!checked) {
                    setGstinNumber('');
                    setGstinError(null);
                  }
                }}
              />
            </div>

            {isGSTRegistered && (
              <div className="space-y-2">
                <Label htmlFor="gstinNumber">
                  GSTIN <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gstinNumber"
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstinNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().slice(0, 15);
                    setGstinNumber(value);
                    if (gstinError) setGstinError(null);
                  }}
                  className={`uppercase ${gstinError ? 'border-destructive' : ''}`}
                  maxLength={15}
                />
                {gstinError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {gstinError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  15-character GST Identification Number
                </p>
                {gstinNumber && gstinNumber.length === 15 && validateGSTIN(gstinNumber).valid && (
                  <p className="text-xs text-primary">
                    State: {getStateFromGSTIN(gstinNumber)}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t mt-4">
              <h4 className="font-semibold text-sm">Payout Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Account Name</Label>
                  <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Name on account" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccNumber">Account Number</Label>
                  <Input id="bankAccNumber" value={bankAccNumber} onChange={(e) => setBankAccNumber(e.target.value)} placeholder="00000000000" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankIfsc">IFSC Code</Label>
                  <Input id="bankIfsc" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="SBIN0000000" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@bank" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t mt-4">
              <h4 className="font-semibold text-sm">Professional Details</h4>
              <div className="space-y-2">
                <Label htmlFor="portfolioLink">Portfolio Link</Label>
                <Input id="portfolioLink" value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} placeholder="https://dribbble.com/yourname" type="url" />
              </div>
            </div>

            <div className="p-3 bg-secondary/20 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Why is this required?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>PAN is mandatory for TDS compliance on payments exceeding ₹30,000</li>
                <li>GST registration enables proper tax invoicing on platform services</li>
                <li>These details appear on invoices and payment receipts</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default EditProfilePage;
