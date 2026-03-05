import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Building2, Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ClientProfileState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: string;
  clientType: string;
  residentialAddress: string;
  registeredAddress: string;
  legalBusinessName: string;
  pan: string;
  gstRegistered: boolean;
  gstin: string;
  gstState: string;
  willDeductTds: boolean;
  tan: string;
  bankName: string;
  bankAccNumber: string;
  bankIfsc: string;
  profilePictureUrl: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfileState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    userType: "",
    clientType: "",
    residentialAddress: "",
    registeredAddress: "",
    legalBusinessName: "",
    pan: "",
    gstRegistered: false,
    gstin: "",
    gstState: "",
    willDeductTds: false,
    tan: "",
    bankName: "",
    bankAccNumber: "",
    bankIfsc: "",
    profilePictureUrl: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const meta = user.user_metadata || {};

      setProfile({
        firstName: data?.first_name || meta.firstName || "",
        lastName: data?.last_name || meta.lastName || "",
        email: data?.email || user.email || "",
        phone: data?.phone || "",
        userType: data?.user_type || "",
        clientType: data?.client_type || meta.clientType || "",
        residentialAddress: data?.residential_address || "",
        registeredAddress: data?.registered_address || "",
        legalBusinessName: data?.legal_business_name || "",
        pan: data?.pan || "",
        gstRegistered: data?.gst_registered || false,
        gstin: data?.gstin || "",
        gstState: data?.gst_state || "",
        willDeductTds: data?.will_deduct_tds || false,
        tan: data?.tan || "",
        bankName: data?.bank_account_name || "",
        bankAccNumber: data?.bank_account_number || "",
        bankIfsc: data?.bank_ifsc || "",
        profilePictureUrl: data?.profile_picture_url || "",
      });
    } catch (error) {
      console.error("Error fetching client profile:", error);
      toast.error("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF8F3]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isBusiness = profile.clientType === "Business";

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-primary/10">
              <AvatarImage src={profile.profilePictureUrl} />
              <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {profile.email} • {profile.clientType || "Client"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/profile/edit")}
            className="shrink-0 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </Button>
        </div>

        {/* Data Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div>
                <span className="block font-medium text-muted-foreground mb-1">Phone Number</span>
                {profile.phone ? (
                  <span className="font-medium">{profile.phone}</span>
                ) : (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                )}
              </div>
              <div>
                <span className="block font-medium text-muted-foreground mb-1">Residential Address</span>
                {profile.residentialAddress ? (
                  <span className="font-medium">{profile.residentialAddress}</span>
                ) : (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div>
                <span className="block font-medium text-muted-foreground mb-1">Client Type</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {profile.clientType || "Not specified"}
                </Badge>
              </div>
              {isBusiness && (
                <>
                  <div>
                    <span className="block font-medium text-muted-foreground mb-1">Legal Business Name</span>
                    {profile.legalBusinessName ? (
                      <span className="font-medium">{profile.legalBusinessName}</span>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                    )}
                  </div>
                  <div>
                    <span className="block font-medium text-muted-foreground mb-1">Registered Address</span>
                    {profile.registeredAddress ? (
                      <span className="font-medium">{profile.registeredAddress}</span>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Financial & Tax Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-medium text-muted-foreground mb-1">PAN Number</span>
                  {profile.pan ? (
                    <span className="font-medium tracking-wide uppercase">{profile.pan}</span>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                  )}
                </div>
                <div>
                  <span className="block font-medium text-muted-foreground mb-1">Will Deduct TDS</span>
                  <span className="font-medium">{profile.willDeductTds ? "Yes" : "No"}</span>
                </div>
                {profile.willDeductTds && (
                  <div className="col-span-2">
                    <span className="block font-medium text-muted-foreground mb-1">TAN Number</span>
                    {profile.tan ? (
                      <span className="font-medium tracking-wide uppercase">{profile.tan}</span>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                    )}
                  </div>
                )}
                <div className="col-span-2 pt-2 border-t mt-2">
                  <span className="block font-medium text-muted-foreground mb-1">GST Registration</span>
                  {profile.gstRegistered ? (
                    <span className="font-medium tracking-wide uppercase border bg-muted px-2 py-1 rounded-md text-xs">
                      {profile.gstin || <span className="text-amber-600 font-normal">GSTIN Missing</span>}
                    </span>
                  ) : (
                    <span className="font-medium text-muted-foreground">Not Registered</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Payout Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <p className="text-xs text-muted-foreground mb-2">Used for processing project refunds to your account.</p>
              <div>
                <span className="block font-medium text-muted-foreground mb-1">Bank Name</span>
                {profile.bankName ? (
                  <span className="font-medium">{profile.bankName}</span>
                ) : (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-medium text-muted-foreground mb-1">Account Number</span>
                  {profile.bankAccNumber ? (
                    <span className="font-medium tracking-wide">****{profile.bankAccNumber.slice(-4)}</span>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                  )}
                </div>
                <div>
                  <span className="block font-medium text-muted-foreground mb-1">IFSC Code</span>
                  {profile.bankIfsc ? (
                    <span className="font-medium uppercase tracking-wide">{profile.bankIfsc}</span>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 bg-amber-50">Incomplete</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
