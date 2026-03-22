import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "For general inquiries and support",
      value: "support@theunoia.com",
      color: "bg-[#B8A3FF]"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Mon-Fri from 9am to 6pm IST",
      value: "+91 98765 43210",
      color: "bg-[#FFD86F]"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Our headquarters",
      value: "Bangalore, Karnataka, India",
      color: "bg-[#C8F070]"
    }
  ];

  const supportFeatures = [
    {
      icon: Clock,
      title: "Quick Response",
      description: "We respond to all queries within 24 hours"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our team directly from the dashboard"
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description: "Get personalized help for complex issues"
    }
  ];

  return (
    <div className="bg-white overflow-hidden min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20 bg-[#F8F4F1]">
          <div className="flex w-full max-w-6xl flex-col items-center">
            <div className="bg-green flex items-center text-[13px] text-green-foreground font-medium w-fit px-6 py-2 rounded-full mb-6">
              Contact Us
            </div>
            <h1 className="text-foreground text-5xl font-bold tracking-tight text-center max-md:text-4xl">
              We'd love to <br />
              hear from you
            </h1>
            <p className="text-muted-foreground text-lg font-normal text-center mt-8 max-w-3xl">
              Have questions, feedback, or need assistance? Our team is here to help. 
              Reach out through any of the channels below.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="flex w-full flex-col items-center py-16 px-5 md:px-20">
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div 
                  key={index} 
                  className={`${method.color} p-8 rounded-3xl hover-lift transition-all duration-300`}
                >
                  <div className="bg-background p-4 rounded-2xl w-fit">
                    <method.icon className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="text-foreground text-xl font-bold mt-5">
                    {method.title}
                  </h3>
                  <p className="text-foreground/70 text-sm mt-2">
                    {method.description}
                  </p>
                  <p className="text-foreground font-semibold mt-4">
                    {method.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="flex w-full flex-col items-center py-16 px-5 md:px-20">
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Form */}
              <div className="bg-[#F8F4F1] p-10 rounded-3xl">
                <h2 className="text-foreground text-2xl font-bold mb-2">Send us a message</h2>
                <p className="text-muted-foreground mb-8">Fill out the form and we'll get back to you shortly.</p>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="text-foreground text-sm font-medium mb-2 block">Your Name</label>
                    <Input 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="bg-background border-none py-6 px-5 rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="text-foreground text-sm font-medium mb-2 block">Email Address</label>
                    <Input 
                      type="email"
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="bg-background border-none py-6 px-5 rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="text-foreground text-sm font-medium mb-2 block">Subject</label>
                    <Input 
                      placeholder="How can we help?" 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      required
                      className="bg-background border-none py-6 px-5 rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="text-foreground text-sm font-medium mb-2 block">Message</label>
                    <Textarea 
                      placeholder="Tell us more about your inquiry..." 
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                      className="bg-background border-none py-4 px-5 rounded-2xl resize-none"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground font-bold py-6 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Support Info */}
              <div className="flex flex-col justify-center">
                <h2 className="text-foreground text-3xl font-bold mb-4">
                  We're here to help
                </h2>
                <p className="text-muted-foreground text-lg mb-10">
                  Our support team works around the clock to ensure you get the help you need, when you need it.
                </p>
                
                <div className="space-y-6">
                  {supportFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-foreground font-bold">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FAQ Link */}
                <div className="mt-10 p-6 bg-yellow/30 rounded-2xl border border-yellow">
                  <h3 className="text-foreground font-bold mb-2">Looking for quick answers?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Check out our FAQ section for answers to common questions.
                  </p>
                  <a href="/faq" className="text-primary font-semibold hover:underline">
                    View FAQ →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Office Hours */}
        <section className="flex w-full flex-col items-center py-16 px-5 md:px-20 bg-[#F8F4F1]">
          <div className="w-full max-w-6xl text-center">
            <h2 className="text-foreground text-2xl font-bold mb-8">Office Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl">
                <h3 className="text-foreground font-bold mb-2">Monday - Friday</h3>
                <p className="text-muted-foreground">9:00 AM - 6:00 PM IST</p>
              </div>
              <div className="bg-white p-6 rounded-2xl">
                <h3 className="text-foreground font-bold mb-2">Saturday</h3>
                <p className="text-muted-foreground">10:00 AM - 4:00 PM IST</p>
              </div>
              <div className="bg-white p-6 rounded-2xl">
                <h3 className="text-foreground font-bold mb-2">Sunday</h3>
                <p className="text-muted-foreground">Closed</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
