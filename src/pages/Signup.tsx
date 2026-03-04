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
import { FileText } from 'lucide-react';
import { AgreementDialog } from '@/components/AgreementDialog';

const signupSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['student', 'non-student'], {
    required_error: 'Please select a user type',
  }),
});

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'non-student'>('student');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user } = useAuth();

  const slides = ['/images/auth-slide-1.png', '/images/auth-slide-2.png', '/images/auth-slide-3.png'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      signupSchema.parse({
        firstName,
        lastName,
        email,
        password,
        userType,
      });

      // Sign up the user
      const { error } = await signUp(email, password, {
        firstName,
        lastName,
        userType,
      });

      if (error) throw error;

      toast({
        title: 'Account created successfully!',
        description: 'Please check your email to verify your account.',
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: error.message || 'An error occurred during signup',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Helmet>
        <title>TheUnoia | Sign Up – Start Freelancing Today</title>
        <meta name="description" content="Create your TheUnoia account to access online jobs, start part time work, hire freelance talent, and begin earning online today." />
        <link rel="canonical" href="https://www.theunoia.com/signup" />
      </Helmet>
      {/* Left Side - Branding & Images */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted flex-col justify-between p-12">
        <div className="flex items-center">
          <img
            src="/images/theunoia-logo.png"
            alt="THEUNOiA Logo"
            className="h-10 object-contain"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-transparent rounded-3xl p-4 relative overflow-hidden">
            <div className="relative h-[550px] w-full flex items-center justify-center">
              {slides.map((slide, index) => (
                <img
                  key={index}
                  src={slide}
                  alt={`Slide ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ mixBlendMode: 'multiply' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-6">
          <Link to="/login">
            <Button variant="ghost" className="text-base font-medium">
              Login
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 pt-8 pb-12">
          <div className="w-full max-w-[450px] space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold text-foreground">Create an account</h1>
              <p className="text-muted-foreground text-base">
                Get started with just a few details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label>I am a</Label>
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as 'student' | 'non-student')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="flex-1 cursor-pointer">
                      <div className="font-medium">Student</div>
                      <div className="text-sm text-muted-foreground">Independent contractor</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="non-student" id="non-student" />
                    <Label htmlFor="non-student" className="flex-1 cursor-pointer">
                      <div className="font-medium">Non-Student</div>
                      <div className="text-sm text-muted-foreground">Post projects and hire freelancers only</div>
                    </Label>
                  </div>
              </RadioGroup>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => {
                    // Only allow unchecking by click. Checking is only allowed after accepting all sections in the Terms dialog.
                    if (checked === false) setTermsAccepted(false);
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setTermsDialogOpen(true)}
                      className="text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      Terms & Conditions
                    </button>
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-bold rounded-full" 
                disabled={loading || !termsAccepted}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <AgreementDialog
              open={termsDialogOpen}
              onOpenChange={setTermsDialogOpen}
              type="terms"
              onAllSectionsAccepted={() => {
                setTermsAccepted(true);
                setTermsDialogOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
