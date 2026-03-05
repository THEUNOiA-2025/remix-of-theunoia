import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { validatePAN, validateGSTIN, validateTAN, formatPAN, formatGSTIN } from "@/lib/financial/validators";

const EditProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialFetchDone, setInitialFetchDone] = useState(false);

    // Basic Profile State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [userType, setUserType] = useState("");
    const [phone, setPhone] = useState("");

    // Client specific
    const [clientType, setClientType] = useState<"Individual" | "Business" | "">("");
    const [residentialAddress, setResidentialAddress] = useState("");
    const [legalBusinessName, setLegalBusinessName] = useState("");
    const [registeredAddress, setRegisteredAddress] = useState("");

    // Tax / Financial
    const [pan, setPan] = useState("");
    const [panError, setPanError] = useState<string | null>(null);
    const [gstRegistered, setGstRegistered] = useState(false);
    const [gstin, setGstin] = useState("");
    const [gstinError, setGstinError] = useState<string | null>(null);
    const [willDeductTds, setWillDeductTds] = useState(false);
    const [tan, setTan] = useState("");
    const [tanError, setTanError] = useState<string | null>(null);

    // Payout Details (Refunds)
    const [bankName, setBankName] = useState("");
    const [bankAccNumber, setBankAccNumber] = useState("");
    const [bankIfsc, setBankIfsc] = useState("");

    useEffect(() => {
        if (user) {
            if (!initialFetchDone) {
                // Init from auth metadata first
                const meta = user.user_metadata;
                if (meta?.firstName) setFirstName(meta.firstName);
                if (meta?.lastName) setLastName(meta.lastName);
                if (meta?.clientType) setClientType(meta.clientType as any);
                if (user.email) setEmail(user.email);

                // Fetch remaining data from database
                fetchProfile();
            }
        }
    }, [user, initialFetchDone]);

    const fetchProfile = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                throw error;
            }

            if (data) {
                if (data.first_name) setFirstName(data.first_name);
                if (data.last_name) setLastName(data.last_name);
                if (data.phone) setPhone(data.phone);
                if (data.user_type) setUserType(data.user_type);
                if (data.client_type) setClientType(data.client_type as any);
                if (data.residential_address) setResidentialAddress(data.residential_address);
                if (data.legal_business_name) setLegalBusinessName(data.legal_business_name);
                if (data.registered_address) setRegisteredAddress(data.registered_address);
                if (data.pan) setPan(data.pan);
                if (data.gst_registered !== null) setGstRegistered(data.gst_registered);
                if (data.gstin) setGstin(data.gstin);
                if (data.will_deduct_tds !== null) setWillDeductTds(data.will_deduct_tds);
                if (data.tan) setTan(data.tan);
                if (data.bank_account_name) setBankName(data.bank_account_name);
                if (data.bank_account_number) setBankAccNumber(data.bank_account_number);
                if (data.bank_ifsc) setBankIfsc(data.bank_ifsc);
            }
        } catch (err) {
            console.error("Error fetching client profile details:", err);
            toast.error("Could not load your profile completely.");
        } finally {
            setInitialFetchDone(true);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setLoading(true);
        setPanError(null);
        setGstinError(null);
        setTanError(null);

        let hasErrors = false;

        // Validate PAN if it exists OR if mandatory (Business or will Deduct TDS)
        if (pan.trim()) {
            const panValid = validatePAN(pan);
            if (!panValid.valid) {
                setPanError(panValid.error || "Invalid PAN");
                hasErrors = true;
            }
        } else if (clientType === "Business" || willDeductTds) {
            setPanError("PAN is mandatory.");
            hasErrors = true;
        }

        // Validate GSTIN if registered
        if (gstRegistered) {
            if (!gstin.trim()) {
                setGstinError("GSTIN is required.");
                hasErrors = true;
            } else {
                const gstinValid = validateGSTIN(gstin);
                if (!gstinValid.valid) {
                    setGstinError(gstinValid.error || "Invalid GSTIN");
                    hasErrors = true;
                }
            }
        }

        // Validate TAN if deducting TDS
        if (willDeductTds) {
            if (!tan.trim()) {
                setTanError("TAN is required.");
                hasErrors = true;
            } else {
                const tanValid = validateTAN(tan);
                if (!tanValid.valid) {
                    setTanError(tanValid.error || "Invalid TAN");
                    hasErrors = true;
                }
            }
        }

        if (hasErrors) {
            setLoading(false);
            toast.error("Please fix the validation errors before saving.");
            return;
        }

        try {
            const { error } = await supabase
                .from("user_profiles")
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    client_type: clientType,
                    residential_address: residentialAddress,
                    legal_business_name: legalBusinessName,
                    registered_address: registeredAddress,
                    pan: pan.trim() ? formatPAN(pan) : null,
                    gst_registered: gstRegistered,
                    gstin: gstRegistered && gstin.trim() ? formatGSTIN(gstin) : null,
                    will_deduct_tds: willDeductTds,
                    tan: willDeductTds && tan.trim() ? tan.trim().toUpperCase() : null,
                    bank_account_name: bankName,
                    bank_account_number: bankAccNumber,
                    bank_ifsc: bankIfsc,
                })
                .eq("user_id", user.id);

            if (error) throw error;
            toast.success("Profile updated successfully!");
            navigate("/profile");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const isBusiness = clientType === "Business";

    return (
        <div className="min-h-screen bg-[#FDF8F3] p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/profile")}
                    className="mb-6 hover:bg-transparent hover:text-primary pl-0"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Profile
                </Button>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                    <p className="text-gray-600 mt-2">Update your personal and business details.</p>
                </div>

                <div className="space-y-6 flex flex-col pb-20">
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Account Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={email} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 0000000000" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Business Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="clientType">Client Type</Label>
                                <Select value={clientType} onValueChange={(val: any) => setClientType(val)}>
                                    <SelectTrigger id="clientType">
                                        <SelectValue placeholder="Select Type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Individual">Individual</SelectItem>
                                        <SelectItem value="Business">Business</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {!isBusiness && (
                                <div className="space-y-2">
                                    <Label htmlFor="residentialAddress">Residential Address</Label>
                                    <Input id="residentialAddress" value={residentialAddress} onChange={(e) => setResidentialAddress(e.target.value)} placeholder="Full Address..." />
                                </div>
                            )}

                            {isBusiness && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="legalBusinessName">Legal Business Name <span className="text-destructive">*</span></Label>
                                        <Input id="legalBusinessName" value={legalBusinessName} onChange={(e) => setLegalBusinessName(e.target.value)} placeholder="XYZ Private Limited" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="registeredAddress">Registered Address <span className="text-destructive">*</span></Label>
                                        <Input id="registeredAddress" value={registeredAddress} onChange={(e) => setRegisteredAddress(e.target.value)} placeholder="Full Corporate Address..." />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Financial & Tax Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="pan">
                                    PAN Number {(isBusiness || willDeductTds) && <span className="text-destructive">*</span>}
                                </Label>
                                <Input
                                    id="pan"
                                    value={pan}
                                    onChange={(e) => {
                                        setPan(e.target.value.toUpperCase().slice(0, 10));
                                        setPanError(null);
                                    }}
                                    placeholder="ABCDE1234F"
                                    className={`uppercase ${panError ? 'border-destructive' : ''}`}
                                    maxLength={10}
                                />
                                {panError && (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {panError}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">Required for invoice processing.</p>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                <div className="space-y-0.5">
                                    <Label htmlFor="gstRegistered" className="cursor-pointer">Are you GST Registered?</Label>
                                    <p className="text-xs text-muted-foreground">Toggle if your business has a valid GSTIN.</p>
                                </div>
                                <Switch
                                    id="gstRegistered"
                                    checked={gstRegistered}
                                    onCheckedChange={(val) => {
                                        setGstRegistered(val);
                                        if (!val) {
                                            setGstin("");
                                            setGstinError(null);
                                        }
                                    }}
                                />
                            </div>

                            {gstRegistered && (
                                <div className="space-y-2">
                                    <Label htmlFor="gstin">
                                        GSTIN <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="gstin"
                                        value={gstin}
                                        onChange={(e) => {
                                            setGstin(e.target.value.toUpperCase().slice(0, 15));
                                            setGstinError(null);
                                        }}
                                        placeholder="22AAAAA0000A1Z5"
                                        className={`uppercase ${gstinError ? 'border-destructive' : ''}`}
                                        maxLength={15}
                                    />
                                    {gstinError && (
                                        <p className="text-xs text-destructive flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {gstinError}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between p-3 border rounded-lg bg-background mt-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="willDeductTds" className="cursor-pointer">Will you deduct TDS from payments?</Label>
                                    <p className="text-xs text-muted-foreground">Toggle if you are required to deduct Tax at Source.</p>
                                </div>
                                <Switch
                                    id="willDeductTds"
                                    checked={willDeductTds}
                                    onCheckedChange={(val) => {
                                        setWillDeductTds(val);
                                        if (!val) {
                                            setTan("");
                                            setTanError(null);
                                        }
                                    }}
                                />
                            </div>

                            {willDeductTds && (
                                <div className="space-y-2">
                                    <Label htmlFor="tan">
                                        TAN Number <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="tan"
                                        value={tan}
                                        onChange={(e) => {
                                            setTan(e.target.value.toUpperCase().slice(0, 10));
                                            setTanError(null);
                                        }}
                                        placeholder="ABCD12345E"
                                        className={`uppercase ${tanError ? 'border-destructive' : ''}`}
                                        maxLength={10}
                                    />
                                    {tanError && (
                                        <p className="text-xs text-destructive flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {tanError}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Required if you are withholding tax.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Payout / Refund Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">Provide banking details here to receive project refunds directly to your account.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Account Name</Label>
                                    <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="As it appears on your statement" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccNumber">Account Number</Label>
                                    <Input id="bankAccNumber" value={bankAccNumber} onChange={(e) => setBankAccNumber(e.target.value)} placeholder="00000000000" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bankIfsc">IFSC Code</Label>
                                    <Input id="bankIfsc" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="SBIN000000" className="uppercase" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button onClick={handleSave} disabled={loading} className="w-full mt-2">
                        {loading ? "Saving Changes..." : "Save Profile"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;
