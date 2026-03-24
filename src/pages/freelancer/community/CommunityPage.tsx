import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Users,
  GraduationCap,
  IndianRupee,
  MapPin,
  Briefcase,
  Clock,
  ImageIcon,
  Sparkles,
  UserPlus,
  TrendingUp,
  CheckCircle2,
  Filter,
  Search,
  PlusCircle,
  Tag,
  ChevronRight,
  MoreHorizontal,
  ShieldCheck,
  Award,
  ShieldAlert,
  Mail,
  Phone,
  Upload,
  Loader2,
  Trash2,
  FileText,
  Check,
  ChevronsUpDown,
  ArrowLeft,
  Settings
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Preloader from "@/components/Preloader";

// Interface definitions
// Utility to generate a consistent UUID-like string from any string (for manual colleges)
const getCommunityUUID = (input: string | null) => {
  if (!input) return null;
  // If it's already a UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) return input;

  // Otherwise, create a stable hash-based UUID
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const absHash = Math.abs(hash).toString(16).padStart(8, '0');
  // Return a formatted "virtual" UUID: 00000000-0000-0000-0000-XXXXXXXX
  return `00000000-0000-0000-0000-${absHash.padStart(12, '0')}`;
};

interface College {
  id: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
}

interface CommunityMember {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  profile_picture_url: string | null;
  tasks_completed?: number;
  total_earned?: number;
}

interface CommunityTask {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  subcategory: string | null;
  bidding_deadline: string | null;
  cover_image_url: string | null;
  user_id: string;
  created_at: string;
  status: string;
  skills_required: string[] | null;
  applicant_count?: number;
  user_profiles?: {
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  };
}

const PRIMARY = "#7e63f8";
const PRIMARY_TEXT = "#ffffff";
const SECONDARY = "#fbdd84";
const SECONDARY_TEXT = "#73480d";
const ACCENT = "#cbec93";
const ACCENT_TEXT = "#145214";

const FEATURED_COLLEGES = [
  // Top Tier
  { id: "f1", name: "Indian Institute of Technology Madras", short_name: "IIT Madras", city: "Chennai", state: "Tamil Nadu" },
  { id: "f2", name: "Indian Institute of Science Bangalore", short_name: "IISc Bangalore", city: "Bengaluru", state: "Karnataka" },
  { id: "f3", name: "Indian Institute of Technology Bombay", short_name: "IIT Bombay", city: "Mumbai", state: "Maharashtra" },
  { id: "f4", name: "Indian Institute of Technology Delhi", short_name: "IIT Delhi", city: "New Delhi", state: "Delhi" },
  { id: "f5", name: "Indian Institute of Technology Kanpur", short_name: "IIT Kanpur", city: "Kanpur", state: "Uttar Pradesh" },
  { id: "f6", name: "Indian Institute of Technology Kharagpur", short_name: "IIT Kharagpur", city: "Kharagpur", state: "West Bengal" },
  { id: "f7", name: "Indian Institute of Technology Roorkee", short_name: "IIT Roorkee", city: "Roorkee", state: "Uttarakhand" },
  { id: "f8", name: "Indian Institute of Technology Guwahati", short_name: "IIT Guwahati", city: "Guwahati", state: "Assam" },
  { id: "f9", name: "Jawaharlal Nehru University", short_name: "JNU Delhi", city: "New Delhi", state: "Delhi" },
  { id: "f10", name: "Banaras Hindu University", short_name: "BHU Varanasi", city: "Varanasi", state: "Uttar Pradesh" },

  // State Coverage: Andhra Pradesh
  { id: "f41", name: "Andhra University", short_name: "AU", city: "Visakhapatnam", state: "Andhra Pradesh" },
  { id: "f70", name: "Jawaharlal Nehru Technological University, Kakinada", short_name: "JNTU Kakinada", city: "Kakinada", state: "Andhra Pradesh" },
  { id: "f71", name: "Jawaharlal Nehru Technological University, Anantapur", short_name: "JNTU Anantapur", city: "Anantapur", state: "Andhra Pradesh" },
  { id: "f72", name: "Sri Venkateswara University", short_name: "SVU", city: "Tirupati", state: "Andhra Pradesh" },
  { id: "f73", name: "SRM University AP", short_name: "SRM-AP", city: "Amaravati", state: "Andhra Pradesh" },
  { id: "f74", name: "VIT-AP University", short_name: "VIT-AP", city: "Amaravati", state: "Andhra Pradesh" },
  { id: "f75", name: "GITAM University", short_name: "GITAM", city: "Visakhapatnam", state: "Andhra Pradesh" },
  { id: "f76", name: "Acharya Nagarjuna University", short_name: "ANU", city: "Guntur", state: "Andhra Pradesh" },
  { id: "f77", name: "Adikavi Nannaya University", short_name: "AKNU", city: "Rajamahendravaram", state: "Andhra Pradesh" },
  { id: "f78", name: "Krishna University", short_name: "KRU", city: "Machilipatnam", state: "Andhra Pradesh" },

  { id: "f42", name: "Rajiv Gandhi University", short_name: "RGU", city: "Itanagar", state: "Arunachal Pradesh" },
  { id: "f43", name: "Patna University", short_name: "PU", city: "Patna", state: "Bihar" },
  { id: "f44", name: "National Institute of Technology Raipur", short_name: "NIT Raipur", city: "Raipur", state: "Chhattisgarh" },
  { id: "f45", name: "BITS Pilani, Goa Campus", short_name: "BITS Goa", city: "Zuarinagar", state: "Goa" },
  { id: "f46", name: "IIT Gandhinagar", short_name: "IITGN", city: "Gandhinagar", state: "Gujarat" },
  { id: "f47", name: "NIT Kurukshetra", short_name: "NITKKR", city: "Kurukshetra", state: "Haryana" },
  { id: "f48", name: "IIT Mandi", short_name: "IIT Mandi", city: "Mandi", state: "Himachal Pradesh" },
  { id: "f49", name: "IIT ISM Dhanbad", short_name: "IIT ISM", city: "Dhanbad", state: "Jharkhand" },
  { id: "f50", name: "NIT Calicut", short_name: "NITC", city: "Calicut", state: "Kerala" },
  { id: "f51", name: "IIT Indore", short_name: "IITI", city: "Indore", state: "Madhya Pradesh" },
  { id: "f52", name: "NIT Manipur", short_name: "NITMN", city: "Imphal", state: "Manipur" },
  { id: "f53", name: "North-Eastern Hill University", short_name: "NEHU", city: "Shillong", state: "Meghalaya" },
  { id: "f54", name: "NIT Mizoram", short_name: "NITMZ", city: "Aizawl", state: "Mizoram" },
  { id: "f55", name: "Nagaland University", short_name: "NU", city: "Lumami", state: "Nagaland" },
  { id: "f56", name: "NIT Rourkela", short_name: "NITRKL", city: "Rourkela", state: "Odisha" },
  { id: "f57", name: "IIT Ropar", short_name: "IIT RPR", city: "Rupnagar", state: "Punjab" },
  { id: "f58", name: "BITS Pilani", short_name: "BITS", city: "Pilani", state: "Rajasthan" },
  { id: "f59", name: "Sikkim University", short_name: "SU", city: "Gangtok", state: "Sikkim" },
  { id: "f60", name: "IIT Hyderabad", short_name: "IITH", city: "Hyderabad", state: "Telangana" },
  { id: "f61", name: "Tripura University", short_name: "TU", city: "Agartala", state: "Tripura" },
  { id: "f62", name: "NIT Uttarakhand", short_name: "NITUK", city: "Srinagar", state: "Uttarakhand" },
  { id: "f63", name: "Pondicherry University (Port Blair)", short_name: "PU", city: "Port Blair", state: "Andaman and Nicobar Islands" },
  { id: "f64", name: "Panjab University", short_name: "PU", city: "Chandigarh", state: "Chandigarh" },
  { id: "f65", name: "Dr. APJ Abdul Kalam Govt College", short_name: "AKGC", city: "Silvassa", state: "Dadra and Nagar Haveli and Daman and Diu" },
  { id: "f66", name: "NIT Srinagar", short_name: "NITSRI", city: "Srinagar", state: "Jammu and Kashmir" },
  { id: "f67", name: "University of Ladakh", short_name: "UOL", city: "Leh", state: "Ladakh" },
  { id: "f68", name: "Lakshadweep Campus (Calicut Univ)", short_name: "LCC", city: "Kavaratti", state: "Lakshadweep" },
  { id: "f69", name: "Pondicherry University", short_name: "PU", city: "Puducherry", state: "Puducherry" },

  // Others
  { id: "f11", name: "Amrita Vishwa Vidyapeetham", short_name: "Amrita", city: "Coimbatore", state: "Tamil Nadu" },
  { id: "f12", name: "Jadavpur University", short_name: "JU", city: "Kolkata", state: "West Bengal" },
  { id: "f15", name: "Manipal Academy of Higher Education", short_name: "MAHE", city: "Manipal", state: "Karnataka" },
  { id: "f18", name: "VIT University", short_name: "VIT Vellore", city: "Vellore", state: "Tamil Nadu" },
  { id: "f36", name: "SRM Institute of Science and Technology", short_name: "SRM Chennai", city: "Chennai", state: "Tamil Nadu" },
  { id: "f38", name: "Lovely Professional University", short_name: "LPU", city: "Phagwara", state: "Punjab" },
  { id: "f39", name: "Christ University", short_name: "Christ Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { id: "f40", name: "Symbiosis International University", short_name: "SIU Pune", city: "Pune", state: "Maharashtra" }
];

export default function CommunityPage() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userCollege, setUserCollege] = useState<College | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [tasks, setTasks] = useState<CommunityTask[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskFilter, setTaskFilter] = useState("all");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [manualCollegeMode, setManualCollegeMode] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    enrollmentNumber: '',
    manualUniversity: ''
  });
  const [states, setStates] = useState<string[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [stateOpen, setStateOpen] = useState(false);
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [emailVerificationStep, setEmailVerificationStep] = useState<'input' | 'sent' | 'verified'>('input');
  const [otpCode, setOtpCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchCommunityData();
    }
  }, [user]);

  const fetchCommunityData = async () => {
    try {
      const { data: contextData, error: contextError } = await supabase.rpc('get_my_community_context');
      if (contextError) throw contextError;

      const verification = contextData?.verification;
      if (verification) {
        setVerificationStatus(verification.verification_status || null);
        setVerificationPending(verification.verification_status === 'pending');
        setIsVerified(verification.verification_status === 'approved');

        const college = verification.college || (verification.institute_name
          ? { name: verification.institute_name, short_name: verification.institute_name.substring(0, 3).toUpperCase() }
          : null);
        setUserCollege(college as any);

        setVerificationForm({
          firstName: user?.user_metadata?.first_name || '',
          lastName: user?.user_metadata?.last_name || '',
          email: verification.institute_email || user?.email || '',
          phone: '',
          enrollmentNumber: verification.enrollment_id || '',
          manualUniversity: ''
        });

        if (verification.email_verified) {
          setEmailVerificationStep('verified');
        }
      }

      if (verification?.verification_status === 'approved') {
        const { data: dashboardData, error: dashboardError } = await supabase.rpc('get_community_dashboard', {
          p_status: 'all',
          p_category: 'all',
          p_limit: 500,
          p_offset: 0,
        });
        if (dashboardError) throw dashboardError;

        const fetchedMembers = (dashboardData?.members || []) as CommunityMember[];
        const fetchedTasks = (dashboardData?.tasks || []) as CommunityTask[];

        setMembers(fetchedMembers);
        setTasks(fetchedTasks);
        const uniqueCats = Array.from(new Set(fetchedTasks.map(t => t.category).filter(Boolean)));
        setCategories(uniqueCats as string[]);
      } else {
        setMembers([]);
        setTasks([]);
        setCategories([]);
      }

    } catch (error) {
      console.error('Error fetching community data:', error);
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  const INDIAN_STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
    "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const displayedColleges = useMemo(() => {
    let filtered = colleges;

    if (selectedState && selectedState !== "All States") {
      const stateTarget = selectedState.replace(/\s+/g, '').toLowerCase();
      filtered = filtered.filter(c => c.state && c.state.replace(/\s+/g, '').toLowerCase().includes(stateTarget));
    }

    if (collegeSearch.trim()) {
      const searchTerms = collegeSearch.toLowerCase().split(' ').filter(Boolean);
      return filtered.filter(c => {
        const name = (c.name || '').toLowerCase();
        const city = (c.city || '').toLowerCase();
        const shortName = (c.short_name || '').toLowerCase();
        const targetStr = `${name} ${city} ${shortName}`;
        return searchTerms.every(term => targetStr.includes(term));
      }).slice(0, 200);
    }

    return filtered.slice(0, 200);
  }, [colleges, collegeSearch, selectedState]);

  const fetchStates = async () => {
    setStates(INDIAN_STATES);
  };

  const fetchAllCollegesForState = useCallback(async (state: string) => {
    if (!state) {
      setColleges([]);
      return;
    }

    try {
      let allColls: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      const fuzzyState = '%' + state.split(' ').join('%') + '%';

      while (hasMore) {
        const { data, error } = await supabase
          .from("colleges")
          .select("id, name, city, state, short_name")
          .ilike("state", state)
          .order("name")
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allColls = [...allColls, ...data];
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      const topKeywords = [
        'IIT', 'NIT', 'VIT', 'SRM', 'IIIT', 'BITS', 'IIM', 'AIIMS', 'DU', 'Delhi University',
        'Anna University', 'JNTU', 'Amity', 'Manipal', 'LPU', 'SASTRA', 'PSG', 'SSN', 'KCT',
        'Indian Institute', 'National Institute', 'Institute of Technology', 'Medical College',
        'St. Xavier', 'Loyola', 'Christ University', 'Symbiosis'
      ];

      const sorted = allColls.sort((a, b) => {
        const safeNameA = (a?.name || '').toUpperCase();
        const safeNameB = (b?.name || '').toUpperCase();

        const aIsTop = topKeywords.some(k => safeNameA.includes(k.toUpperCase()));
        const bIsTop = topKeywords.some(k => safeNameB.includes(k.toUpperCase()));

        if (aIsTop && !bIsTop) return -1;
        if (!aIsTop && bIsTop) return 1;
        return (a?.name || '').localeCompare(b?.name || '');
      });

      // Add featured colleges for the selected state if any
      const featured = FEATURED_COLLEGES.filter(c =>
        c.state.toLowerCase() === state.toLowerCase()
      );

      setColleges([...featured, ...sorted]);
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  }, []);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState && selectedState !== "All States") {
      fetchAllCollegesForState(selectedState);
    }
  }, [selectedState, fetchAllCollegesForState]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  const getTimeRemaining = () => {
    if (!codeExpiresAt) return "0:00";
    const total = codeExpiresAt.getTime() - new Date().getTime();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSendCode = async () => {
    if (!verificationForm.email) {
      toast.error("Please enter your email address");
      return;
    }
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast.error("Please log in again to verify your email.");
      return;
    }

    setSendingCode(true);
    try {
      console.log("CommunityPage: Attempting to send OTP to:", verificationForm.email);

      // Using the correct function name: 'send-email-verification'
      const { data, error } = await supabase.functions.invoke('send-email-verification', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          email: verificationForm.email,
          userId: user?.id,
          name: verificationForm.firstName || 'Student'
        }
      });

      if (error) throw error;

      setEmailVerificationStep('sent');
      setResendCooldown(60);
      setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
      toast.success("Verification code sent to " + verificationForm.email);
    } catch (err: any) {
      console.error('Error sending code:', err);
      toast.error(err?.message || "Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) return;
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast.error("Please log in again to verify your email.");
      return;
    }
    setVerifyingCode(true);
    try {
      // Using the correct function name: 'verify-email-code'
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          email: verificationForm.email,
          code: otpCode,
          userId: user?.id
        }
      });

      if (error) throw error;

      // Adjusting based on standard response structure
      if (data?.success || data?.verified) {
        setEmailVerificationStep('verified');
        toast.success("Email verified successfully!");
      } else {
        toast.error(data?.error || "Invalid verification code");
      }
    } catch (err: any) {
      console.error('Error verifying code:', err);
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = () => {
    if (resendCooldown === 0) {
      handleSendCode();
    }
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCollegeId('');
    setStateOpen(false);
  };

  const handleCollegeSelect = (college: any) => {
    setSelectedCollegeId(college.id);
    setCollegeOpen(false);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationForm.firstName || !verificationForm.lastName || !verificationForm.email || !verificationForm.phone) {
      toast.error("Please fill in all personal details");
      return;
    }
    if (!manualCollegeMode && !selectedCollegeId) {
      toast.error("Please select your university");
      return;
    }
    if (manualCollegeMode && !verificationForm.manualUniversity) {
      toast.error("Please enter your university name");
      return;
    }
    if (!idCardFile) {
      toast.error("Please upload your student ID card");
      return;
    }

    setIsVerifying(true);
    try {
      let idCardUrl = "";
      if (idCardFile) {
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('student-id-cards')
          .upload(fileName, idCardFile);

        if (uploadError) throw uploadError;

        idCardUrl = fileName;
      }

      // 1. Update User Profile with the names and phone provided
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          first_name: verificationForm.firstName,
          last_name: verificationForm.lastName,
          phone: verificationForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user?.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      const collegeName = manualCollegeMode ? verificationForm.manualUniversity : colleges.find(c => c.id === selectedCollegeId)?.name || 'Your University';

      const isFeaturedCollege = selectedCollegeId?.startsWith('f');
      const { error: submitError } = await supabase.rpc('upsert_student_verification_submission', {
        p_first_name: verificationForm.firstName,
        p_last_name: verificationForm.lastName,
        p_phone: verificationForm.phone,
        p_institute_email: verificationForm.email,
        p_enrollment_id: verificationForm.enrollmentNumber || null,
        p_college_id: isFeaturedCollege ? null : (selectedCollegeId || null),
        p_institute_name: manualCollegeMode
          ? verificationForm.manualUniversity
          : (isFeaturedCollege ? collegeName : null),
        p_id_card_url: idCardUrl || null,
        p_email_verified: emailVerificationStep === 'verified',
        p_verification_method: emailVerificationStep === 'verified' ? 'email' : 'id_card',
      });

      if (submitError) throw submitError;

      const mockCollege: College = {
        id: selectedCollegeId || 'manual-1',
        name: collegeName,
        short_name: collegeName.substring(0, 3).toUpperCase(),
        city: 'Your City',
        state: selectedState || 'Your State'
      };
      setUserCollege(mockCollege);

      setVerificationStatus('pending');
      setVerificationPending(true);
      toast.success("Verification request submitted successfully!");
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast.error(error.message || "Failed to submit verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const communityStats = useMemo(() => {
    const totalEarnings = members.reduce((sum, m) => sum + (m.total_earned || 0), 0);
    const completedTasks = members.reduce((sum, m) => sum + (m.tasks_completed || 0), 0);
    const activeTasks = tasks.filter(t => t.status === 'open').length;
    return {
      totalEarnings,
      completedTasks,
      activeTasks,
      totalMembers: members.length
    };
  }, [members, tasks]);

  const leaderboardMembers = useMemo(() => {
    return [...members]
      .sort((a, b) => (b.total_earned || 0) - (a.total_earned || 0))
      .slice(0, 5);
  }, [members]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all' && selectedCategory === 'all') return tasks;
    return tasks.filter(t => {
      const status = (t.status || '').toLowerCase();
      const matchTab = taskFilter === 'all' || 
        (taskFilter === 'open' && status === 'open') ||
        (taskFilter === 'in_progress' && (status === 'in_progress' || status === 'in-progress' || status === 'active')) ||
        (taskFilter === 'completed' && (status === 'completed' || status === 'done'));
      
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
      
      return matchTab && matchCategory;
    });
  }, [tasks, taskFilter, selectedCategory]);

  const handleInvite = async () => {
    try {
      const url = window.location.origin + "/community";
      await navigator.clipboard.writeText(url);
      toast.success("Community invitation link copied to clipboard!");
    } catch (err) {
      console.error("Clipboard failed:", err);
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = window.location.origin + "/community";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success("Link copied!");
      } catch (copyErr) {
        toast.error("Failed to copy link. Please copy the URL from the browser bar.");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsVerifying(true);
      const { error } = await supabase.rpc('update_community_member_settings', {
        p_institute_email: verificationForm.email || null,
        p_enrollment_id: verificationForm.enrollmentNumber || null,
      });

      if (error) throw error;
      toast.success("Settings updated successfully!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) return <Preloader />;

  if (verificationPending) {
    return (
      <main className="flex-1 p-8 flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 gap-6">
        <div className="max-w-md w-full text-center space-y-8 bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="size-24 bg-[#7e63f8]/10 rounded-full flex items-center justify-center mx-auto relative">
            <Clock className="size-12 text-[#7e63f8] animate-spin" />
            <div className="absolute inset-0 rounded-full border-4 border-[#7e63f8]/20 border-t-[#7e63f8] animate-spin" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#121118] tracking-tight">Verification Under Review</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Your campus verification is under review. Once approved, you will gain access to your university community.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <div className="size-2.5 bg-[#cbec93] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="size-2.5 bg-[#cbec93] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="size-2.5 bg-[#cbec93] rounded-full animate-bounce" />
          </div>
        </div>
      </main>
    );
  }

  if (!isVerified) {
    if (verificationStatus === 'pending' || verificationPending) {
      return (
        <main className="flex-1 py-12 px-4 md:px-8 bg-[#fdfdfd] flex flex-col justify-center min-h-screen items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card className="p-12 text-center space-y-8 rounded-[40px] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#7e63f8] via-[#fbdd84] to-[#cbec93]" />

              <div className="size-24 bg-[#fbdd84]/10 rounded-[2rem] flex items-center justify-center mx-auto animate-pulse">
                <Clock className="size-12 text-[#73480d]" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black text-[#121118] tracking-tight">Verification Pending</h2>
                <p className="text-slate-500 font-medium">
                  We've received your application for <br />
                  <span className="text-[#7e63f8] font-bold">{userCollege?.name || 'Your University'}</span>.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-2 bg-[#fbdd84] rounded-full" />
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Status: Under Review</p>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Our team is currently reviewing your academic credentials. This usually takes **2-4 hours**. You'll receive an email once your access is granted.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full h-14 rounded-2xl border-slate-200 font-bold hover:bg-slate-50 transition-all"
              >
                Check Status
              </Button>
            </Card>
          </motion.div>
        </main>
      );
    }

    return (
      <main className="flex-1 py-6 md:py-12 px-3 sm:px-4 md:px-8 bg-[#fdfdfd] flex justify-center min-h-screen overflow-x-hidden">
        <div className="max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl md:rounded-[40px] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
                {/* Left Side: Branding / Info */}
                <div className="lg:col-span-5 bg-[#7e63f8] p-6 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#fbdd84]/10 rounded-full -ml-40 -mb-40 blur-3xl animate-pulse" />

                  {/* Floating Decorative Elements */}
                  <div className="absolute top-[20%] right-[10%] size-20 bg-white/5 rounded-3xl rotate-12 blur-sm animate-float [animation-duration:6s]" />
                  <div className="absolute bottom-[15%] left-[10%] size-32 bg-[#fbdd84]/5 rounded-full blur-md animate-float [animation-duration:8s] [animation-delay:2s]" />
                  <div className="absolute top-[40%] right-[5%] size-12 bg-[#cbec93]/10 rounded-xl -rotate-12 animate-wiggle" />
                  <div className="absolute top-[10%] left-[20%] size-4 bg-white/20 rounded-full blur-[1px] animate-pulse" />
                  <div className="absolute bottom-[30%] right-[20%] size-6 bg-white/10 rounded-full blur-[1px] animate-pulse [animation-delay:1.5s]" />

                  <div className="relative z-10">
                    <div className="bg-white/20 backdrop-blur-md w-fit px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-12 border border-white/30">
                      Academic Gateway
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight">
                      Verify Your <br /> Campus <br /> Identity
                    </h1>
                    <p className="text-white/80 font-medium leading-relaxed mb-12 text-lg">
                      Join your university community to collaborate and earn with fellow students.
                    </p>

                    <div className="space-y-8 relative">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-start gap-5 group"
                      >
                        <div className="size-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 animate-float">
                          <ShieldCheck className="size-6 text-[#fbdd84]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">Institution Verified</h3>
                          <p className="text-white/60 text-sm leading-relaxed">Secure data sharing with your university records.</p>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-start gap-5 group"
                      >
                        <div className="size-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 animate-float [animation-delay:1s]">
                          <Briefcase className="size-6 text-[#cbec93]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">Exclusive Marketplace</h3>
                          <p className="text-white/60 text-sm leading-relaxed">Access student-only tasks and freelance opportunities.</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-16 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/dashboard')}
                      className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl px-0 -ml-2"
                    >
                      <ArrowLeft className="size-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                </div>

                {/* Right Side: Verification Form */}
                <div className="lg:col-span-7 p-4 sm:p-6 md:p-12 lg:p-16">
                  <form onSubmit={handleVerificationSubmit} className="space-y-12">
                    <div className="space-y-12">
                      {/* Personal Profile Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                          <h2 className="text-3xl font-black text-[#121118] tracking-tight">Personal Profile</h2>
                          <p className="text-slate-400 text-sm font-medium">Please provide your legal name and contact info.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name <span className="text-red-500 ml-0.5">*</span></Label>
                            <Input
                              placeholder="Ex: John"
                              className="rounded-2xl border-slate-200 h-14 px-5 text-base font-medium focus:ring-2 focus:ring-[#7e63f8]/20 focus:border-[#7e63f8] transition-all"
                              value={verificationForm.firstName}
                              onChange={(e) => setVerificationForm({ ...verificationForm, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name <span className="text-red-500 ml-0.5">*</span></Label>
                            <Input
                              placeholder="Ex: Doe"
                              className="rounded-2xl border-slate-200 h-14 px-5 text-base font-medium focus:ring-2 focus:ring-[#7e63f8]/20 focus:border-[#7e63f8] transition-all"
                              value={verificationForm.lastName}
                              onChange={(e) => setVerificationForm({ ...verificationForm, lastName: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address <span className="text-red-500 ml-0.5">*</span></Label>
                            <div className="relative">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                              <Input
                                placeholder="name@university.edu"
                                className="rounded-2xl border-slate-200 h-14 pl-14 pr-5 text-base font-medium focus:ring-2 focus:ring-[#7e63f8]/20 focus:border-[#7e63f8] transition-all"
                                value={verificationForm.email}
                                onChange={(e) => setVerificationForm({ ...verificationForm, email: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number <span className="text-red-500 ml-0.5">*</span></Label>
                            <div className="relative">
                              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                              <Input
                                placeholder="+91 00000 00000"
                                className="rounded-2xl border-slate-200 h-14 pl-14 pr-5 text-base font-medium focus:ring-2 focus:ring-[#7e63f8]/20 focus:border-[#7e63f8] transition-all"
                                value={verificationForm.phone}
                                onChange={(e) => setVerificationForm({ ...verificationForm, phone: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Identity Verification Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-8 pt-10 border-t border-slate-100"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h2 className="text-2xl font-black text-[#121118] tracking-tight">Identity Verification</h2>
                            <p className="text-slate-400 text-sm font-medium">Verify your student email address.</p>
                          </div>
                          {emailVerificationStep === 'verified' && (
                            <Badge className="bg-[#cbec93] text-[#145214] border-none font-bold px-3 py-1">
                              <CheckCircle2 className="size-3 mr-1.5" /> VERIFIED
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-6">
                          {emailVerificationStep === 'verified' ? (
                            <div className="p-4 rounded-2xl bg-[#cbec93]/10 border border-[#cbec93]/30 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-white flex items-center justify-center text-[#cbec93] shadow-sm">
                                  <Mail className="size-5" />
                                </div>
                                <span className="font-bold text-[#145214]">{verificationForm.email}</span>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setEmailVerificationStep('input')} className="text-slate-400 hover:text-red-500 font-bold">Change</Button>
                            </div>
                          ) : emailVerificationStep === 'sent' ? (
                            <div className="space-y-6">
                              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col gap-1">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Verification code sent to</p>
                                <p className="font-bold text-blue-700">{verificationForm.email}</p>
                              </div>
                              <div className="space-y-4">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Enter 6-digit code</Label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} disabled={verifyingCode}>
                                    <InputOTPGroup className="gap-2">
                                      {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <InputOTPSlot key={index} index={index} className="size-12 rounded-xl border-slate-200 bg-white font-black text-xl text-[#7e63f8] focus:ring-2 focus:ring-[#7e63f8]/20" />
                                      ))}
                                    </InputOTPGroup>
                                  </InputOTP>
                                  <Button type="button" onClick={handleVerifyCode} disabled={otpCode.length !== 6 || verifyingCode} className="h-12 px-8 bg-[#7e63f8] hover:bg-[#6c52e6] rounded-xl font-bold">
                                    {verifyingCode ? <Loader2 className="size-5 animate-spin" /> : "Verify Code"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-4">
                              <div className="relative flex-1">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                <Input
                                  placeholder="student@university.edu"
                                  className="rounded-2xl border-slate-200 h-14 pl-14 pr-5 text-base font-medium focus:ring-2 focus:ring-[#7e63f8]/20 focus:border-[#7e63f8] transition-all"
                                  value={verificationForm.email}
                                  onChange={(e) => setVerificationForm({ ...verificationForm, email: e.target.value })}
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={handleSendCode}
                                disabled={!verificationForm.email || sendingCode || resendCooldown > 0}
                                className="h-14 px-6 bg-slate-900 hover:bg-black rounded-2xl font-bold text-white shadow-xl shadow-black/10 transition-all active:scale-95"
                              >
                                {sendingCode ? <Loader2 className="size-5 animate-spin" /> : (resendCooldown > 0 ? `${resendCooldown}s` : "Send Code")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Campus Details Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-8 pt-10 border-t border-slate-100"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h2 className="text-2xl font-black text-[#121118] tracking-tight">Campus Details</h2>
                            <p className="text-slate-400 text-sm font-medium">Select your university and location.</p>
                          </div>
                          <button type="button" onClick={() => setManualCollegeMode(!manualCollegeMode)} className="text-[#7e63f8] text-xs font-black uppercase tracking-widest hover:underline w-fit">{manualCollegeMode ? "Select from list" : "Can't find your college?"}</button>
                        </div>

                        {!manualCollegeMode ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Step 1: Select State <span className="text-red-500 ml-0.5">*</span></Label>
                              <Popover open={stateOpen} onOpenChange={setStateOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 px-5 text-left font-medium justify-between group active:scale-[0.98] transition-all bg-white">
                                    {selectedState || <span className="text-slate-400">Select state...</span>}
                                    <ChevronsUpDown className="size-4 text-slate-400 group-hover:text-[#7e63f8] transition-colors" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-slate-200 shadow-2xl z-[100] bg-white overflow-hidden" align="start">
                                  <Command className="rounded-2xl bg-white border-none">
                                    <CommandInput placeholder="Search states..." className="h-12 border-none ring-0 focus:ring-0 px-4 font-bold" />
                                    <CommandList className="max-h-[250px] custom-scrollbar bg-white">
                                      <CommandEmpty className="p-4 text-xs font-bold text-slate-400">No state found.</CommandEmpty>
                                      <CommandGroup className="p-2">
                                        {states.map((state) => (
                                          <CommandItem key={state} value={state} onSelect={() => handleStateChange(state)} className="py-3 px-4 rounded-xl aria-selected:bg-[#cbec93]/40 aria-selected:text-[#145214] font-bold cursor-pointer transition-all mb-1 last:mb-0">
                                            <div className="flex items-center">
                                              <Check className={cn("mr-3 size-4 text-[#145214]", selectedState === state ? "opacity-100" : "opacity-0")} />
                                              {state}
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Step 2: Find University <span className="text-red-500 ml-0.5">*</span></Label>
                              <Popover open={collegeOpen} onOpenChange={setCollegeOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" disabled={!selectedState} className="w-full h-14 rounded-2xl border-slate-200 px-5 text-left font-medium justify-between group active:scale-[0.98] transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                                    {colleges.find(c => c.id === selectedCollegeId)?.name || <span className="text-slate-400">{selectedState ? "Type to search..." : "Select state first..."}</span>}
                                    <ChevronsUpDown className="size-4 text-slate-400 group-hover:text-[#7e63f8] transition-colors" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-slate-200 shadow-2xl z-[100] bg-white overflow-hidden" align="start">
                                  <Command className="rounded-2xl bg-white border-none" shouldFilter={false}>
                                    <CommandInput placeholder="Search your college..." value={collegeSearch} onValueChange={setCollegeSearch} className="h-12 border-none ring-0 focus:ring-0 px-4 font-bold" />
                                    <CommandList className="max-h-[300px] custom-scrollbar bg-white">
                                      {displayedColleges.length === 0 && <div className="p-4 text-xs font-bold text-slate-400 text-center">No results found.</div>}
                                      <CommandGroup className="p-2">
                                        {displayedColleges.map((college) => (
                                          <CommandItem key={college.id} value={`${college.name} ${college.city}`} onSelect={() => handleCollegeSelect(college)} className="py-4 px-4 rounded-xl aria-selected:bg-[#cbec93]/40 border-b border-slate-50 last:border-0 cursor-pointer transition-all mb-1">
                                            <div className="flex flex-col gap-1 w-full">
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                  <Check className={cn("size-4 text-[#145214] shrink-0", selectedCollegeId === college.id ? "opacity-100" : "opacity-0")} />
                                                  <span className="font-bold text-[#121118] text-sm leading-tight">{college.name}</span>
                                                </div>
                                                {['IIT', 'NIT', 'VIT', 'SRM', 'IIIT', 'BITS', 'IIM'].some(k => college.name.toUpperCase().includes(k)) && (
                                                  <Badge className="bg-[#fbdd84]/20 text-[#73480d] border-none text-[8px] font-black h-4 px-1.5 rounded-sm shrink-0">TOP</Badge>
                                                )}
                                              </div>
                                              <div className="pl-7">
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{college.city || 'DISTRICT'}</span>
                                              </div>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Manual University Entry</Label>
                            <Input placeholder="Enter your full university name" className="rounded-2xl border-slate-200 h-14 px-5 text-base font-medium focus:ring-2 focus:ring-[#7e63f8]/20 focus:border-[#7e63f8]" value={verificationForm.manualUniversity} onChange={(e) => setVerificationForm({ ...verificationForm, manualUniversity: e.target.value })} />
                          </div>
                        )}

                        <div className="space-y-3 pt-4">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Enrollment / Roll Number</Label>
                          <div className="relative">
                            <FileText className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                            <Input placeholder="Ex: 24BECCS0102" className="rounded-2xl border-slate-200 h-14 pl-14 pr-5 text-base font-medium focus:ring-2 focus:ring-[#7e63f8]/20 focus:border-[#7e63f8]" value={verificationForm.enrollmentNumber} onChange={(e) => setVerificationForm({ ...verificationForm, enrollmentNumber: e.target.value })} />
                          </div>
                        </div>
                      </motion.div>

                      {/* Academic Evidence Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-8 pt-10 border-t border-slate-100"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-[#121118] tracking-tight">Academic Evidence <span className="text-red-500 ml-0.5">*</span></h2>
                          <p className="text-slate-400 text-sm font-medium">Upload your student ID card for visual confirmation.</p>
                        </div>

                        <div className="space-y-4">
                          {idCardPreview ? (
                            <div className="relative group rounded-3xl overflow-hidden border-2 border-[#7e63f8]/30 bg-[#7e63f8]/5 p-6 flex flex-col items-center justify-center gap-4">
                              <div className="relative w-full max-w-md aspect-[1.6/1] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden">
                                <img src={idCardPreview} className="w-full h-full object-cover rounded-xl" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button type="button" variant="destructive" onClick={() => { setIdCardFile(null); setIdCardPreview(null); }} className="rounded-full size-12 p-0"><Trash2 className="size-6" /></Button>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-[#7e63f8] flex items-center gap-2">
                                <CheckCircle2 className="size-4" /> {idCardFile?.name}
                              </p>
                            </div>
                          ) : (
                            <div onClick={() => document.getElementById('id-upload')?.click()} className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-[#7e63f8]/50 hover:bg-[#7e63f8]/5 transition-all group overflow-hidden">
                              <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#7e63f8] group-hover:bg-white group-hover:shadow-lg transition-all"><Upload className="size-8" /></div>
                              <div className="text-center"><p className="text-lg font-bold text-slate-400 group-hover:text-slate-700">Select ID Card photo</p><p className="text-sm text-slate-400 mt-1">Accepts JPG, PNG or WEBP</p></div>
                              <input id="id-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Submit Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6 pt-12 border-t border-slate-100"
                      >
                        <p className="text-center text-[11px] text-slate-400 px-8 font-medium">By clicking submit, you authorize THEUNOIA to verify your student credentials with the provided university records.</p>
                        <Button
                          type="submit"
                          disabled={
                            isVerifying ||
                            !verificationForm.firstName ||
                            !verificationForm.lastName ||
                            !verificationForm.email ||
                            !verificationForm.phone ||
                            (!selectedCollegeId && !verificationForm.manualUniversity) ||
                            emailVerificationStep !== 'verified' ||
                            (!idCardFile && !idCardPreview)
                          }
                          className="w-full h-18 py-8 rounded-[2rem] bg-[#7e63f8] hover:bg-[#6c52e6] text-white text-xl font-black shadow-2xl shadow-[#7e63f8]/30 transition-all hover:scale-[1.01] active:scale-[0.98]"
                        >
                          {isVerifying ? (
                            <div className="flex items-center gap-4"><Loader2 className="size-6 animate-spin" /> VERIFYING DATA...</div>
                          ) : (
                            <div className="flex items-center justify-center gap-3">SUBMIT FOR VERIFICATION <ChevronRight className="size-6" /></div>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </form>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      {/* Hero Header Section */}
      <div className="bg-[#7e63f8] relative overflow-hidden min-h-[500px] flex items-center">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full -mr-96 -mt-96 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#fbdd84]/10 rounded-full -ml-48 -mb-48 blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#cbec93]/5 rounded-full blur-[80px] animate-float" />

        {/* Floating 3D-like Shapes */}
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-20 right-[15%] size-32 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 rotate-12 hidden lg:block" />
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity }} className="absolute bottom-20 right-[5%] size-24 bg-[#fbdd84]/10 backdrop-blur-2xl rounded-full border border-white/10 hidden lg:block" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <Sparkles className="size-3.5 text-[#fbdd84]" />
                Exclusive Campus Community
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6 drop-shadow-2xl">
                  A {userCollege?.name || 'Vibrant Campus'} <br />
                  <span className="text-[#fbdd84]">Community</span>
                </h1>
                <p className="text-white/80 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
                  Join the elite circle of {userCollege?.short_name || 'verified'} students. Collaborate on premium tasks, share knowledge, and build your freelance career together.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-6"
              >
                <div className="flex -space-x-4">
                  {members.slice(0, 5).map((m, i) => (
                    <Avatar key={m.user_id} className="border-4 border-[#7e63f8] size-12 shadow-2xl transition-transform hover:scale-110 hover:z-10 cursor-pointer">
                      <AvatarImage src={m.profile_picture_url || undefined} />
                      <AvatarFallback className="bg-slate-100 text-[#7e63f8] font-bold">{m.first_name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 5 && (
                    <div className="size-12 rounded-full bg-white/20 backdrop-blur-xl border-2 border-[#7e63f8]/50 flex items-center justify-center text-white text-xs font-black shadow-2xl">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
                <div className="h-10 w-px bg-white/20 mx-2" />
                <div className="flex flex-col">
                  <span className="text-white font-black text-xl">{members.length} members</span>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 bg-[#cbec93] rounded-full animate-pulse" />
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Active Now</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="group relative"
                >
                  <Card className="bg-white/10 backdrop-blur-2xl border-white/20 p-6 rounded-[2.5rem] text-white hover:bg-white/15 transition-all duration-500 border h-48 flex flex-col justify-between overflow-hidden">
                    <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="size-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Total Members</p>
                      <h3 className="text-4xl font-black">{communityStats.totalMembers}</h3>
                    </div>
                    <div className="absolute -bottom-6 -right-6 size-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="group relative"
                >
                  <Card className="bg-white/10 backdrop-blur-2xl border-white/20 p-6 rounded-[2.5rem] text-white hover:bg-white/15 transition-all duration-500 border h-48 flex flex-col justify-between overflow-hidden">
                    <div className="size-12 rounded-2xl bg-[#fbdd84]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IndianRupee className="size-6 text-[#fbdd84]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Total Earned</p>
                      <h3 className="text-4xl font-black">₹{(communityStats.totalEarnings / 1000).toFixed(1)}k</h3>
                    </div>
                    <div className="absolute -bottom-6 -right-6 size-24 bg-[#fbdd84]/5 rounded-full blur-2xl group-hover:bg-[#fbdd84]/10 transition-colors" />
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="group relative sm:col-span-2"
                >
                  <Card className="bg-white/10 backdrop-blur-2xl border-white/20 p-8 rounded-[2.5rem] text-white hover:bg-white/15 transition-all duration-500 border flex items-center justify-between overflow-hidden">
                    <div className="flex items-center gap-6">
                      <div className="size-16 rounded-[1.5rem] bg-[#cbec93]/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Briefcase className="size-8 text-[#cbec93]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Active Projects</p>
                        <h3 className="text-5xl font-black">{communityStats.activeTasks}</h3>
                      </div>
                    </div>
                    <Button
                      onClick={handleInvite}
                      className="bg-[#fbdd84] hover:bg-[#f1d277] text-[#73480d] font-black rounded-2xl px-6 h-14 shadow-lg shadow-black/20 group-hover:scale-105 transition-all active:scale-95"
                    >
                      <UserPlus className="size-5 mr-3" />
                      INVITE
                    </Button>
                    <div className="absolute -bottom-12 -right-12 size-40 bg-[#cbec93]/5 rounded-full blur-3xl group-hover:bg-[#cbec93]/10 transition-colors" />
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-14 md:h-16 bg-transparent border-0 gap-2 md:gap-8 w-full justify-start overflow-x-auto no-scrollbar">
              {["Tasks Feed", "Leaderboard", "Members", "Settings"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase().split(' ')[0]}
                  className="h-full whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-[#7e63f8] data-[state=active]:bg-transparent data-[state=active]:text-[#7e63f8] text-slate-500 font-bold px-3 md:px-4 transition-all"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 mt-6 md:mt-8 lg:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Main Area */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Task Creation Box */}
                  <Card className="p-1 min-h-[64px] rounded-2xl border-2 border-slate-200 focus-within:border-[#7e63f8]/50 shadow-sm overflow-hidden flex items-center gap-3 bg-white">
                    <div className="flex-1 flex items-center gap-3 px-5 py-3 cursor-text" onClick={() => navigate('/projects/post-project', { state: { is_community: true, college_id: getCommunityUUID(userCollege?.id || userCollege?.name || null), college_name: userCollege?.name || null } })}>
                      <Avatar className="size-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-[#7e63f8] text-white text-[10px]">YOU</AvatarFallback>
                      </Avatar>
                      <span className="text-slate-400 font-medium">Start a task post...</span>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                    <Button variant="ghost" size="sm" className="hidden md:flex text-slate-500 hover:text-[#7e63f8] font-bold gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </Button>
                    <Button variant="ghost" size="sm" className="hidden md:flex text-slate-500 hover:text-[#7e63f8] font-bold gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </Button>
                    <Button
                      onClick={() => navigate('/projects/post-project', { state: { is_community: true, college_id: getCommunityUUID(userCollege?.id || userCollege?.name || null), college_name: userCollege?.name || null } })}
                      className="bg-[#7e63f8] hover:bg-[#6c52e6] text-white rounded-xl px-6 font-bold m-1"
                    >
                      POST
                    </Button>
                  </Card>

                  {/* Filters */}
                  <div className="flex items-center justify-between pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex gap-2">
                      {['all', 'open', 'in_progress', 'completed'].map((f) => (
                        <Button
                          key={f}
                          onClick={() => setTaskFilter(f)}
                          variant={taskFilter === f ? 'default' : 'ghost'}
                          className={`rounded-full px-5 font-bold h-9 text-xs transition-all ${taskFilter === f
                            ? 'bg-[#7e63f8] text-white shadow-lg shadow-[#7e63f8]/30'
                            : 'text-slate-500 hover:bg-[#7e63f8]/5 hover:text-[#7e63f8]'
                            }`}
                        >
                          {f === 'all' ? 'All Feed' : f.replace('_', ' ').toUpperCase()}
                        </Button>
                      ))}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn("rounded-full h-9 w-9 p-0", selectedCategory !== 'all' ? "text-[#7e63f8] bg-[#7e63f8]/5" : "text-slate-400")}>
                          <Filter className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Filter by Category</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedCategory('all')} className="rounded-xl font-bold py-2 px-3">
                          All Categories
                        </DropdownMenuItem>
                        {categories.map(cat => (
                          <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)} className="rounded-xl font-bold py-2 px-3">
                            {cat}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Feed */}
                  <div className="space-y-5">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">No tasks found here</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">Try changing the filter or be the first to post a new task for your community.</p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={task.id}
                        >
                          <Card
                            className="p-6 rounded-[2rem] border-2 border-slate-100 hover:border-[#7e63f8]/40 transition-all duration-300 shadow-sm hover:shadow-xl group cursor-pointer bg-white relative overflow-hidden"
                            onClick={() => navigate(`/projects/${task.id}`)}
                          >
                            <div className="absolute top-0 right-0 p-4">
                              <Badge className={`rounded-xl px-4 py-1.5 font-black uppercase text-[10px] ${task.status === 'open' ? 'bg-[#cbec93] text-[#145214]' :
                                task.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                                  'bg-[#fbdd84] text-[#73480d]'
                                }`}>
                                {task.status}
                              </Badge>
                            </div>

                            <div className="flex gap-5">
                              <Avatar className="size-12 rounded-2xl shadow-md group-hover:scale-110 transition-transform">
                                <AvatarImage src={task.user_profiles?.profile_picture_url || undefined} />
                                <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                  {task.user_profiles?.first_name[0]}{task.user_profiles?.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                  <h4 className="font-black text-slate-900 leading-none">
                                    {task.user_profiles?.first_name} {task.user_profiles?.last_name}
                                  </h4>
                                  <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {new Date(task.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <h3 className="text-xl font-black text-slate-900 group-hover:text-[#7e63f8] transition-colors line-clamp-1">
                                    {task.title}
                                  </h3>
                                  <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed">
                                    {task.description}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                  {task.skills_required?.slice(0, 3).map((skill) => (
                                    <Badge key={skill} variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-600 font-bold py-1 px-4">
                                      #{skill}
                                    </Badge>
                                  ))}
                                  {task.skills_required && task.skills_required.length > 3 && (
                                    <span className="text-[10px] font-black text-slate-300">+{task.skills_required.length - 3} MORE</span>
                                  )}
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                  <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Budget</span>
                                      <span className="text-xl font-black text-slate-900 inline-flex items-center">
                                        <IndianRupee className="w-4 h-4" /> {task.budget.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Applicants</span>
                                      <span className="text-sm font-black text-slate-800">{task.applicant_count} Students</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Deadline</span>
                                      <span className="text-sm font-black text-red-500">{task.bidding_deadline ? new Date(task.bidding_deadline).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                  </div>
                                  <Button className="bg-[#7e63f8]/5 hover:bg-[#7e63f8] text-[#7e63f8] hover:text-white rounded-2xl px-6 font-black transition-all group-hover:translate-x-1">
                                    VIEW TASK <ChevronRight className="w-4 h-4 ml-2" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6"
                >
                  <Card className="p-8 rounded-[2rem] border-2 shadow-sm bg-white overflow-hidden">
                    <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-[#7e63f8]" />
                      Global Campus Ranking
                    </h2>
                    <div className="space-y-4">
                      {members.sort((a, b) => (b.total_earned || 0) - (a.total_earned || 0)).map((m, i) => (
                        <div key={m.user_id} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-50 hover:bg-white border-2 border-transparent hover:border-[#7e63f8]/20 transition-all group">
                          <div className={`size-10 rounded-xl flex items-center justify-center font-black ${i === 0 ? 'bg-[#fbdd84] text-[#73480d]' :
                            i === 1 ? 'bg-slate-200 text-slate-600' :
                              i === 2 ? 'bg-[#7e63f8]/10 text-[#7e63f8]' :
                                'bg-white text-slate-400'
                            }`}>
                            {i + 1}
                          </div>
                          <Avatar className="size-12 rounded-xl shadow-md border-2 border-white">
                            <AvatarImage src={m.profile_picture_url || undefined} />
                            <AvatarFallback>{m.first_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-black text-slate-900">{m.first_name} {m.last_name}</h4>
                            <p className="text-xs font-bold text-slate-400">{m.tasks_completed} Tasks Completed</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-[#7e63f8]">₹{m.total_earned?.toLocaleString('en-IN')}</p>
                            <Badge variant="outline" className="border-0 bg-[#cbec93]/20 text-[#145214] text-[10px] uppercase font-black">
                              TOP 1%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div
                  key="members-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {members.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                      <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">You're the first member!</h3>
                      <p className="text-slate-500 max-w-sm mx-auto font-medium mb-8 px-8">Invite your classmates to join the {userCollege?.name} community.</p>
                      <Button
                        onClick={handleInvite}
                        className="bg-[#7e63f8] hover:bg-[#6c52e6] text-white rounded-2xl px-8 h-12 font-black shadow-lg"
                      >
                        INVITE CLASSMATES
                      </Button>
                    </div>
                  ) : (
                    members.map((m) => (
                      <Card
                        key={m.user_id}
                        className="p-6 rounded-[2rem] border-2 border-slate-100 hover:border-[#7e63f8]/40 transition-all duration-300 shadow-sm hover:shadow-xl group bg-white"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="size-16 rounded-2xl shadow-lg border-2 border-slate-50 group-hover:scale-105 transition-transform">
                            <AvatarImage src={m.profile_picture_url || undefined} />
                            <AvatarFallback>{m.first_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-black text-slate-900 text-lg leading-tight">{m.first_name} {m.last_name}</h4>
                            <p className="text-xs font-bold text-[#7e63f8] flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3 h-3" /> VERIFIED STUDENT
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-slate-500 text-sm font-medium line-clamp-2 italic leading-relaxed">
                          "{m.bio || 'Connecting and growing in the community!'}"
                        </p>
                        <div className="mt-6 flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                            onClick={() => navigate(`/profile/${m.user_id}`)}
                          >
                            Profile
                          </Button>
                          <Button className="flex-1 bg-[#7e63f8] hover:bg-[#6c52e6] text-white rounded-xl font-bold">
                            Message
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <Card className="p-12 rounded-[2.5rem] border-2 shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Settings className="size-40 text-slate-900" />
                    </div>

                    <div className="space-y-8 relative z-10">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Campus Credentials</h2>
                        <p className="text-slate-500 font-medium">Manage your verified university information.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Verified University</Label>
                          <div className="h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 flex items-center font-bold text-slate-600">
                            {userCollege?.name}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Institute Email</Label>
                          <Input
                            value={verificationForm.email}
                            onChange={(e) => setVerificationForm(prev => ({ ...prev, email: e.target.value }))}
                            className="h-14 rounded-2xl bg-white border-2 border-slate-100 hover:border-[#7e63f8]/30 focus:border-[#7e63f8] font-bold text-slate-900 px-5 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Enrollment ID</Label>
                          <Input
                            value={verificationForm.enrollmentNumber}
                            onChange={(e) => setVerificationForm(prev => ({ ...prev, enrollmentNumber: e.target.value }))}
                            className="h-14 rounded-2xl bg-white border-2 border-slate-100 hover:border-[#7e63f8]/30 focus:border-[#7e63f8] font-bold text-slate-900 px-5 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Community Status</Label>
                          <div className="h-14 rounded-2xl bg-[#cbec93]/20 border border-[#cbec93]/30 px-5 flex items-center font-black text-[#145214] uppercase text-xs tracking-widest">
                            <ShieldCheck className="w-4 h-4 mr-2" /> VERIFIED MEMBER
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100 flex justify-end">
                        <Button
                          onClick={handleSaveSettings}
                          disabled={isVerifying}
                          className="bg-[#7e63f8] hover:bg-[#6c52e6] text-white rounded-2xl px-10 h-14 font-black text-lg shadow-xl shadow-[#7e63f8]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          {isVerifying ? <Loader2 className="animate-spin mr-2" /> : null}
                          SAVE CHANGES
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Leaderboard Sidebar Card */}
            <Card className="p-8 rounded-[2.5rem] border-2 border-white shadow-2xl bg-white/70 backdrop-blur-xl sticky top-24">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Leaderboard</h3>
                <Button variant="ghost" size="sm" className="text-[#7e63f8] font-black text-xs p-0 hover:bg-transparent" onClick={() => setActiveTab('leaderboard')}>
                  VIEW ALL
                </Button>
              </div>

              <div className="space-y-6">
                {leaderboardMembers.map((m, i) => (
                  <div key={m.user_id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/profile/${m.user_id}`)}>
                    <div className="relative">
                      <Avatar className="size-12 rounded-2xl shadow-md border-2 border-white group-hover:border-[#7e63f8]/30 transition-all">
                        <AvatarImage src={m.profile_picture_url || undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">{m.first_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 size-5 rounded-lg border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm ${i === 0 ? 'bg-[#fbdd84] text-[#73480d]' :
                        i === 1 ? 'bg-slate-200 text-slate-600' :
                          i === 2 ? 'bg-[#7e63f8]/10 text-[#7e63f8]' :
                            'bg-white text-slate-300'
                        }`}>
                        {i + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 truncate leading-none mb-1 group-hover:text-[#7e63f8] transition-colors">{m.first_name} {m.last_name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{m.tasks_completed} TASKS COMPLETED</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 tracking-tight">₹{m.total_earned?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 space-y-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Community Stats</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-[2rem] p-5 border-2 border-transparent hover:border-[#7e63f8]/10 transition-all">
                    <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-5 h-5 text-[#cbec93]" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{communityStats.completedTasks}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Tasks Finished</p>
                  </div>
                  <div className="bg-slate-50 rounded-[2rem] p-5 border-2 border-transparent hover:border-[#7e63f8]/10 transition-all">
                    <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                      <TrendingUp className="w-5 h-5 text-[#7e63f8]" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{(communityStats.totalEarnings / 1000).toFixed(1)}k</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total Payouts</p>
                  </div>
                </div>

                <Card className="bg-[#7e63f8] p-6 rounded-[2rem] text-white shadow-xl shadow-[#7e63f8]/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:rotate-12 transition-transform">
                    <TrendingUp className="size-12" />
                  </div>
                  <h4 className="font-black text-lg mb-2 relative z-10">Campus Insight</h4>
                  <p className="text-white/80 text-xs font-bold leading-relaxed relative z-10">
                    Your community has completed <span className="text-[#fbdd84] font-black">{communityStats.completedTasks} tasks</span> and earned <span className="text-[#fbdd84] font-black">₹{communityStats.totalEarnings.toLocaleString()}</span> in total. Keep growing!
                  </p>
                  <div className="h-1.5 w-full bg-white/20 rounded-full mt-4 relative z-10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      className="h-full bg-[#fbdd84] rounded-full"
                    />
                  </div>
                </Card>

                <Button className="w-full bg-[#7e63f8] hover:bg-[#6c52e6] text-white h-14 rounded-2xl font-black text-sm shadow-lg shadow-[#7e63f8]/25 tracking-widest uppercase active:scale-95 transition-all">
                  SAVE CHANGES
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
