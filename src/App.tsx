import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FloatingSupportButton } from "@/components/layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ReceiveSms from "./pages/ReceiveSms";
import AboutPage from "./pages/AboutPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import LoyaltyPage from "./pages/LoyaltyPage";
import AffiliatePage from "./pages/AffiliatePage";
import SupplierPage from "./pages/SupplierPage";
import UserCenterPage from "./pages/UserCenterPage";
import RechargePage from "./pages/RechargePage";
import RechargeUsdtPage from "./pages/RechargeUsdtPage";
import AdminSettingsPage from "./pages/admin/SettingsPage";
import AdminServicesPage from "./pages/admin/ServicesPage";
import AdminServicePricesPage from "./pages/admin/ServicePricesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/api" element={<ApiDocsPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/affiliate" element={<AffiliatePage />} />
            <Route path="/supplier" element={<SupplierPage />} />
            <Route 
              path="/receive-sms" 
              element={
                <ProtectedRoute>
                  <ReceiveSms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-center" 
              element={
                <ProtectedRoute>
                  <UserCenterPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recharge" 
              element={
                <ProtectedRoute>
                  <RechargePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recharge-usdt" 
              element={
                <ProtectedRoute>
                  <RechargeUsdtPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/services" 
              element={
                <ProtectedRoute>
                  <AdminServicesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/service-prices" 
              element={
                <ProtectedRoute>
                  <AdminServicePricesPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingSupportButton />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
