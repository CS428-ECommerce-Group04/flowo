import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ChatWidget from "@/components/chat/ChatWidget";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/*" element={
            <>
              <Header />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/learn-more" element={<LearnMore />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/dashboard" element={<div className="p-8">Dashboard Page</div>} />
                <Route path="/messages" element={<div className="p-8">Messages Page</div>} />
                <Route path="/settings" element={<div className="p-8">Settings Page</div>} />
                <Route path="/support" element={<div className="p-8">Help & Support Page</div>} />
                <Route path="/billing" element={<div className="p-8">Billing Page</div>} />
                <Route path="/reports" element={<div className="p-8">Reports Page</div>} />
                <Route path="/analytics" element={<div className="p-8">Analytics Page</div>} />
              </Routes>
              <ChatWidget />
            </>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
