import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HubLayout } from "./components/hub/HubLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/hub/Dashboard";
import CreateProfile from "./pages/hub/CreateProfile";
import Products from "./pages/hub/Products";
import ProductEdit from "./pages/hub/ProductEdit";
import IdeaLab from "./pages/hub/IdeaLab";
import Profile from "./pages/hub/Profile";
import Marketing from "./pages/hub/Marketing";
import Messages from "./pages/hub/Messages";
import Calendar from "./pages/hub/Calendar";
import Reviews from "./pages/hub/Reviews";
import NotFound from "./pages/NotFound";

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
          <Route path="/auth" element={<Auth />} />
          
          {/* Hub routes */}
          <Route path="/hub" element={<ProtectedRoute><HubLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/hub/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create-profile" element={<CreateProfile />} />
            <Route path="ideas" element={<IdeaLab />} />
            <Route path="products" element={<Products />} />
            <Route path="products/edit/:id" element={<ProductEdit />} />
            <Route path="profile" element={<Profile />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="messages" element={<Messages />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="reviews" element={<Reviews />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
