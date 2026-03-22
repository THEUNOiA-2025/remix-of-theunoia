import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const slides = ['/images/auth-slide-1.png', '/images/auth-slide-2.png', '/images/auth-slide-3.png'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'Reset Link Sent',
        description: 'Please check your email for the password reset link.',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex lg:min-h-screen">
      <Helmet>
        <title>TheUnoia | Forgot Password</title>
        <meta name="description" content="Reset your password for TheUnoia." />
      </Helmet>
      
      {/* Left Side - Branding & Images */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted flex-col justify-between lg:p-8 xl:p-12">
        <div className="flex items-center">
          <img src="/images/theunoia-logo.png" alt="THEUNOiA Logo" className="h-10 object-contain" />
        </div>
        <div className="space-y-6">
          <div className="bg-transparent rounded-3xl p-4 relative overflow-hidden">
            <div className="relative h-64 xl:h-[550px] w-full flex items-center justify-center">
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

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-6">
          <Link to="/login">
            <Button variant="ghost" className="text-base font-medium">Back to Login</Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[400px] space-y-5">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold text-foreground">Forgot Password</h1>
              <p className="text-muted-foreground text-base">
                {isSubmitted ? 'Check your email for a link to reset your password. If it doesn’t appear within a few minutes, check your spam folder.' : 'Enter your email address and we will send you a link to reset your password.'}
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold rounded-full" disabled={loading}>
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="w-full h-12 text-base font-bold rounded-full">
                Try another email
              </Button>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link to="/login" className="underline underline-offset-4 hover:text-foreground font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
