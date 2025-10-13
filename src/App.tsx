import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthSignup from "./pages/AuthSignup";
import AuthSignin from "./pages/AuthSignin";
import HubHome from "./pages/HubHome";
import Products from "./pages/hub/Products";
import ProductsLab from "./pages/hub/ProductsLab";
import ProductsManage from "./pages/hub/ProductsManage";
import ProductEditor from "./pages/hub/ProductEditor";
import ProductsPerformance from "./pages/hub/ProductsPerformance";
import Social from "./pages/hub/Social";
import SocialLab from "./pages/hub/SocialLab";
import SocialManage from "./pages/hub/SocialManage";
import SocialPerformance from "./pages/hub/SocialPerformance";
import Customers from "./pages/hub/Customers";
import CustomersMessages from "./pages/hub/CustomersMessages";
import CustomersReviews from "./pages/hub/CustomersReviews";
import CustomersCalendar from "./pages/hub/CustomersCalendar";
import CustomersAnalytics from "./pages/hub/CustomersAnalytics";
import Analytics from "./pages/hub/Analytics";
import SalesPerformance from "./pages/hub/SalesPerformance";
import Profile from "./pages/hub/Profile";
import ProfileUser from "./pages/hub/ProfileUser";
import ProfileBusiness from "./pages/hub/ProfileBusiness";
import ProfileShopfront from "./pages/hub/ProfileShopfront";
import Settings from "./pages/hub/Settings";
import Billing from "./pages/hub/Billing";
import PublicShopfront from "./pages/shopfront/PublicShopfront";
import PaymentWelcome from "./pages/PaymentWelcome";
import OnboardingFinal from "./pages/OnboardingFinal";
import { FLAGS } from "@/lib/flags";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/signup" element={<AuthSignup />} />
          <Route path="/auth/signin" element={<AuthSignin />} />
          <Route path="/onboarding/final" element={<OnboardingFinal />} />
          <Route path="/payment/welcome" element={<PaymentWelcome />} />
          <Route path="/hub" element={<HubHome />} />
          <Route path="/hub/products" element={<Products />} />
          <Route path="/hub/products/lab" element={<ProductsLab />} />
          <Route path="/hub/products/manage" element={<ProductsManage />} />
          <Route path="/hub/products/edit/:id" element={<ProductEditor />} />
          <Route path="/hub/products/performance" element={<ProductsPerformance />} />
          <Route path="/hub/social" element={<Social />} />
          <Route path="/hub/social/lab" element={<SocialLab />} />
          <Route path="/hub/social/manage" element={<SocialManage />} />
          <Route path="/hub/social/performance" element={<SocialPerformance />} />
          <Route path="/hub/customers" element={<Customers />} />
          <Route path="/hub/customers/messages" element={<CustomersMessages />} />
          <Route path="/hub/customers/reviews" element={<CustomersReviews />} />
          <Route path="/hub/customers/calendar" element={<CustomersCalendar />} />
          {FLAGS.CUSTOMER_INSIGHTS_V1 && <Route path="/hub/customers/analytics" element={<CustomersAnalytics />} />}
          {FLAGS.ANALYTICS_V1 && <Route path="/hub/analytics" element={<Analytics />} />}
          {FLAGS.STRIPE_PAYMENTS_V1 && <Route path="/hub/sales" element={<SalesPerformance />} />}
          <Route path="/hub/profile" element={<Profile />} />
          <Route path="/hub/profile/user" element={<ProfileUser />} />
          <Route path="/hub/profile/business" element={<ProfileBusiness />} />
          <Route path="/hub/profile/shopfront" element={<ProfileShopfront />} />
          <Route path="/hub/settings" element={<Settings />} />
          {FLAGS.STRIPE_PAYMENTS_V1 && <Route path="/hub/billing" element={<Billing />} />}
          {FLAGS.SHOPFRONT_V1 && <Route path="/s/:handle" element={<PublicShopfront />} />}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
