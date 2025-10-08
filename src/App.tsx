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
import Social from "./pages/hub/Social";
import Customers from "./pages/hub/Customers";
import Profile from "./pages/hub/Profile";
import Settings from "./pages/hub/Settings";

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
          <Route path="/hub" element={<HubHome />} />
          <Route path="/hub/products" element={<Products />} />
          <Route path="/hub/social" element={<Social />} />
          <Route path="/hub/customers" element={<Customers />} />
          <Route path="/hub/profile" element={<Profile />} />
          <Route path="/hub/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
