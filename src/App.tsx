// trigger vercel

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { lazy, Suspense, useState, useEffect } from "react";

import { AuthProvider } from "./contexts/AuthContext";

import { GlobalNotificationProvider } from "./components/GlobalNotificationProvider";

import { DashboardLayout } from "./components/DashboardLayout";

import { AdminLayout } from "./components/admin/AdminLayout";

import { RoleBasedRoute } from "./components/RoleBasedRoute";

import Preloader from "./components/Preloader";

import Login from "./pages/Login";

import Signup from "./pages/Signup";

import NotFound from "./pages/NotFound";

import HowItWorksPage from "./pages/HowItWorksPage";

import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";



// Lazy pages

const ProjectDetailWrapper = lazy(() => import("./pages/shared/projects/ProjectDetailWrapper"));

const FreelancerEditProfilePage = lazy(() => import("./pages/freelancer/profile/EditProfilePage"));

const IndependentProjectsPage = lazy(() => import("./pages/freelancer/profile/IndependentProjectsPage"));

const StudentVerificationPage = lazy(() => import("./pages/freelancer/verification/StudentVerificationPage"));

const BidsPage = lazy(() => import("./pages/freelancer/bids/BidsPage"));

const BidPayoutPreviewPage = lazy(() => import("./pages/freelancer/bids/BidPayoutPreviewPage"));

const MessagesPage = lazy(() => import("./pages/shared/messages/MessagesPage"));

const CalendarPage = lazy(() => import("./pages/shared/calendar/CalendarPage"));

const BuyCreditsPage = lazy(() => import("./pages/freelancer/credits/BuyCreditsPage"));

const CheckoutPage = lazy(() => import("./pages/freelancer/credits/CheckoutPage"));



const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));

const AdminVerificationsPage = lazy(() => import("./pages/admin/AdminVerificationsPage"));

const AdminProjectsPage = lazy(() => import("./pages/admin/AdminProjectsPage"));

const AdminCollegesPage = lazy(() => import("./pages/admin/AdminCollegesPage"));

const AdminBlogsPage = lazy(() => import("./pages/admin/AdminBlogsPage"));

const AdminCreditsPage = lazy(() => import("./pages/admin/AdminCreditsPage"));



const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));



const NewLandingPage = lazy(() => import("./pages/landing-page"));

const NewFAQPage = lazy(() => import("./pages/landing-page/FAQPage"));

const NewContactPage = lazy(() => import("./pages/landing-page/ContactPage"));

const NewBlogPage = lazy(() => import("./pages/landing-page/BlogPage"));

const NewFeaturesPage = lazy(() => import("./pages/landing-page/FeaturesPage"));



const FreelancerViewPage = lazy(() => import("./pages/client/freelancer/FreelancerViewPage"));

const PostProjectPage = lazy(() => import("./pages/client/projects/PostProjectPage"));



const queryClient = new QueryClient();



const App = () => {


  // FIRST APP LOAD

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const timer = setTimeout(() => {

      setLoading(false);

    }, 2000);

    return () => clearTimeout(timer);

  }, []);



  if (loading) {

    return <Preloader />;

  }



  return (

    <QueryClientProvider client={queryClient}>

      <AuthProvider>

        <TooltipProvider>

          <Toaster />

          <Sonner />


          <BrowserRouter>

            <GlobalNotificationProvider>


              {/* GLOBAL PRELOADER */}

              <Suspense fallback={<Preloader />}>


                <Routes>


                  <Route path="/" element={<NewLandingPage />} />


                  <Route path="/features" element={<NewFeaturesPage />} />


                  <Route path="/how-it-works" element={<HowItWorksPage />} />


                  <Route path="/faq" element={<NewFAQPage />} />


                  <Route path="/contact" element={<NewContactPage />} />


                  <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />


                  <Route path="/blog" element={<NewBlogPage />} />


                  <Route path="/blog/:slug" element={<BlogDetailPage />} />


                  <Route path="/login" element={<Login />} />


                  <Route path="/signup" element={<Signup />} />


                  <Route element={<DashboardLayout />}>


                    <Route path="/projects/post-project" element={<PostProjectPage />} />


                    <Route path="/projects/:id" element={<ProjectDetailWrapper />} />


                    <Route path="/projects" element={<RoleBasedRoute pageType="projects" />} />


                    <Route path="/dashboard" element={<RoleBasedRoute pageType="dashboard" />} />


                    <Route path="/profile" element={<RoleBasedRoute pageType="profile" />} />


                    <Route path="/profile/edit" element={<FreelancerEditProfilePage />} />


                    <Route path="/profile/portfolio" element={<IndependentProjectsPage />} />


                    <Route path="/profile/verify" element={<StudentVerificationPage />} />


                    <Route path="/bids" element={<BidsPage />} />


                    <Route path="/bid-preview" element={<BidPayoutPreviewPage />} />


                    <Route path="/messages" element={<MessagesPage />} />


                    <Route path="/calendar" element={<CalendarPage />} />


                    <Route path="/buy-credits" element={<BuyCreditsPage />} />


                    <Route path="/checkout" element={<CheckoutPage />} />


                    <Route path="/freelancer/:userId" element={<FreelancerViewPage />} />


                  </Route>



                  <Route element={<AdminLayout />}>


                    <Route path="/admin" element={<AdminDashboard />} />


                    <Route path="/admin/users" element={<AdminUsersPage />} />


                    <Route path="/admin/verifications" element={<AdminVerificationsPage />} />


                    <Route path="/admin/projects" element={<AdminProjectsPage />} />


                    <Route path="/admin/colleges" element={<AdminCollegesPage />} />


                    <Route path="/admin/blogs" element={<AdminBlogsPage />} />


                    <Route path="/admin/credits" element={<AdminCreditsPage />} />


                  </Route>



                  <Route path="*" element={<NotFound />} />


                </Routes>


              </Suspense>


            </GlobalNotificationProvider>


          </BrowserRouter>


        </TooltipProvider>


      </AuthProvider>


    </QueryClientProvider>

  );

};



export default App;