import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AdminLayout from './components/AdminLayout'
import MarketplaceLayout from './components/MarketplaceLayout'
import ProtectedRoute from './components/ProtectedRoute'
import SellerLayout from './components/SellerLayout'
import AdminPage from './pages/AdminPage'
import AdminModerationDetailPage from './pages/AdminModerationDetailPage'
import AdminModerationPage from './pages/AdminModerationPage'
import AdminSellersPage from './pages/AdminSellersPage'
import AdminConsumersPage from './pages/AdminConsumersPage'
import BrowsePage from './pages/BrowsePage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import DeploymentPage from './pages/DeploymentPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage.tsx'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProductPage from './pages/ProductPage'
import ShipmentsPage from './pages/ShipmentsPage.tsx'
import SellerOrderDetailPage from './pages/SellerOrderDetailPage'
import SellerOrdersPage from './pages/SellerOrdersPage'
import SellerProductsPage from './pages/SellerProductsPage.tsx'
import SellerPage from './pages/SellerPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'

function App() {
  return (
    <Routes>
      <Route path="sign-in" element={<SignInPage />} />
      <Route path="sign-up" element={<SignUpPage />} />
      <Route path="deployment" element={<DeploymentPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route element={<MarketplaceLayout />}>
        <Route index element={<HomePage />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="browse/:listingId" element={<ProductPage />} />
        <Route element={<ProtectedRoute roles={['buyer', 'seller', 'admin']} />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/:listingId" element={<CheckoutPage />} />
          <Route path="checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="shipments" element={<ShipmentsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['seller']} />}>
          <Route path="seller" element={<SellerLayout />}>
            <Route index element={<SellerPage />} />
            <Route path="products" element={<SellerProductsPage />} />
            <Route path="orders" element={<SellerOrdersPage />} />
            <Route path="orders/:orderId" element={<SellerOrderDetailPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="consumers" element={<AdminConsumersPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
            <Route path="moderation/:listingId" element={<AdminModerationDetailPage />} />
            <Route path="sellers" element={<AdminSellersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
