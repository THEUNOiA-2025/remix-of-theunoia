// trigger vercel
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { GlobalNotificationProvider } from "./components/GlobalNotificationProvider";
import { DashboardLayout } from "./components/DashboardLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
// Old landing page (kept for reference, can be removed later)
// import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import FeaturesPage from "./pages/FeaturesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";

// Freelancer-specific pages (not role-switched)
const IndependentProjectsPage = lazy(() => import("./pages/freelancer/profile/IndependentProjectsPage"));
const StudentVerificationPage = lazy(() => import("./pages/freelancer/verification/StudentVerificationPage"));
const ContractsPage = lazy(() => import("./pages/freelancer/contracts/ContractsPage"));
const ClientContractsPage = lazy(() => import("./pages/client/contracts/ClientContractsPage"));

// Shared pages
const ProjectDetailWrapper = lazy(() => import("./pages/shared/projects/ProjectDetailWrapper"));
const BidsPage = lazy(() => import("./pages/freelancer/bids/BidsPage"));
const BidPayoutPreviewPage = lazy(() => import("./pages/freelancer/bids/BidPayoutPreviewPage"));
const MessagesPage = lazy(() => import("./pages/shared/messages/MessagesPage"));
const CalendarPage = lazy(() => import("./pages/shared/calendar/CalendarPage"));
const BuyCreditsPage = lazy(() => import("./pages/freelancer/credits/BuyCreditsPage"));
const CheckoutPage = lazy(() => import("./pages/freelancer/credits/CheckoutPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminVerificationsPage = lazy(() => import("./pages/admin/AdminVerificationsPage"));
const AdminProjectsPage = lazy(() => import("./pages/admin/AdminProjectsPage"));
const AdminCollegesPage = lazy(() => import("./pages/admin/AdminCollegesPage"));
const AdminBlogsPage = lazy(() => import("./pages/admin/AdminBlogsPage"));
const AdminCreditsPage = lazy(() => import("./pages/admin/AdminCreditsPage"));

// Blog pages (old - kept for blog detail until new design is provided)
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));

// New Landing page and related pages
const NewLandingPage = lazy(() => import("./pages/landing-page"));
const NewFAQPage = lazy(() => import("./pages/landing-page/FAQPage"));
const NewContactPage = lazy(() => import("./pages/landing-page/ContactPage"));
const NewBlogPage = lazy(() => import("./pages/landing-page/BlogPage"));

// Client: view freelancer dashboard
const FreelancerViewPage = lazy(() => import("./pages/client/freelancer/FreelancerViewPage"));
// Client: post new project
const PostProjectPage = lazy(() => import("./pages/client/projects/PostProjectPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalNotificationProvider>
            <Routes>
              <Route path="/" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <NewLandingPage />
                </Suspense>
              } />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/faq" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <NewFAQPage />
                </Suspense>
              } />
              <Route path="/contact" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <NewContactPage />
                </Suspense>
              } />
              <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
              <Route path="/blog" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <NewBlogPage />
                </Suspense>
              } />
              <Route path="/blog/:slug" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <BlogDetailPage />
                </Suspense>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Project detail route - shows client or freelancer view based on ownership */}
              <Route
                path="/projects/:id"
                element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <ProjectDetailWrapper />
                  </Suspense>
                }
              />

              {/* Dashboard routes with shared layout */}
              <Route element={<DashboardLayout />}>
                <Route
                  path="/projects/post-project"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <PostProjectPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects"
                  element={<RoleBasedRoute pageType="projects" />}
                />
                <Route
                  path="/dashboard"
                  element={<RoleBasedRoute pageType="dashboard" />}
                />
                <Route
                  path="/profile"
                  element={<RoleBasedRoute pageType="profile" />}
                />
                <Route
                  path="/profile/edit"
                  element={<RoleBasedRoute pageType="profile_edit" />}
                />
                <Route
                  path="/profile/portfolio"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <IndependentProjectsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/profile/verify"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <StudentVerificationPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/freelancer/contracts"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <ContractsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/client/contracts"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <ClientContractsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/bids"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <BidsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/bid-preview"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <BidPayoutPreviewPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <MessagesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <CalendarPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/community"
                  element={<RoleBasedRoute pageType="community" />}
                />
                <Route
                  path="/leadership"
                  element={<RoleBasedRoute pageType="leadership" />}
                />
                <Route
                  path="/buy-credits"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <BuyCreditsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <CheckoutPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/freelancer/:userId"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <FreelancerViewPage />
                    </Suspense>
                  }
                />
              </Route>

              {/* Admin routes */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminDashboard />
                  </Suspense>
                } />
                <Route path="/admin/users" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminUsersPage />
                  </Suspense>
                } />
                <Route path="/admin/verifications" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminVerificationsPage />
                  </Suspense>
                } />
                <Route path="/admin/projects" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminProjectsPage />
                  </Suspense>
                } />
                <Route path="/admin/colleges" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminCollegesPage />
                  </Suspense>
                } />
                <Route path="/admin/blogs" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminBlogsPage />
                  </Suspense>
                } />
                <Route path="/admin/credits" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminCreditsPage />
                  </Suspense>
                } />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalNotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
