import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Machinery } from './pages/Machinery';
import { Transport } from './pages/Transport';
import { MarketPrices } from './pages/MarketPrices';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Dashboards
import { FarmerDashboard } from './pages/dashboards/FarmerDashboard';
import { BuyerDashboard } from './pages/dashboards/BuyerDashboard';
import { SupplierDashboard } from './pages/dashboards/SupplierDashboard';
import { MachineryDashboard } from './pages/dashboards/MachineryDashboard';
import { TransportDashboard } from './pages/dashboards/TransportDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-16 text-center text-xs text-stone-400">Loading your profile...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-3">
        <h2 className="text-lg font-bold text-rose-800">Access Restricted</h2>
        <p className="text-xs text-stone-500">
          Your role ({user.role}) is not authorized to access this workspace.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-stone-50">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Marketplace Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/marketplace" element={<Navigate to="/products" replace />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/machinery" element={<Machinery />} />
                  <Route path="/transport" element={<Transport />} />
                  <Route path="/market-prices" element={<MarketPrices />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Dashboards */}
                  <Route
                    path="/dashboard/farmer"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <FarmerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/buyer"
                    element={
                      <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                        <BuyerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/supplier"
                    element={
                      <ProtectedRoute allowedRoles={['supplier', 'admin']}>
                        <SupplierDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/machinery"
                    element={
                      <ProtectedRoute allowedRoles={['machinery_owner', 'admin']}>
                        <MachineryDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/transport"
                    element={
                      <ProtectedRoute allowedRoles={['transport_provider', 'admin']}>
                        <TransportDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
