import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Landing from "@/app/routes/Landing";
import Shop from "@/app/routes/Shop";
import Cart from "@/app/routes/Cart";
import ProductDetail from "@/app/routes/ProductDetail";
import Checkout from "@/app/routes/Checkout";
import LearnMore from "@/app/routes/LearnMore";
import Login from "@/app/routes/Login";
import Register from "@/app/routes/Register";
import ForgotPassword from "@/app/routes/ForgotPassword";
import TrackOrder from "@/app/routes/TrackOrder";
import OrderTrackingDetail from "@/app/routes/OrderTrackingDetail";
import ChatWidget from "@/components/chat/ChatWidget";

import AdminLayout from "@/admin/AdminLayout";
import AdminDashboard from "@/admin/pages/Dashboard";
import AdminSettings from "@/admin/pages/Settings";
import AdminMessages from "@/admin/pages/Messages";
import AdminSupport from "@/admin/pages/Support";
import AdminBilling from "@/admin/pages/Billing";
import AdminReports from "@/admin/pages/Reports";
import AdminAnalytics from "@/admin/pages/Analytics";
import AdminProductsTable from "@/admin/ProductCategories";
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductsTable />} /> {/* NEW */}
            <Route path="categories" element={<AdminProductsTable />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* shorthand redirects */}
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/settings"  element={<Navigate to="/admin/settings" replace />} />

          {/* public site */}
          <Route
            path="/*"
            element={
              <>
                <Header />
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/learn-more" element={<LearnMore />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/track" element={<TrackOrder />} />
                  <Route path="/orders/:id" element={<OrderTrackingDetail />} />
                </Routes>
                <ChatWidget />
              </>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}