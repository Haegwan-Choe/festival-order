import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import { RequireAdmin } from './components/RequireAdmin'
import { AuthProvider } from './contexts/AuthContext'
import AdminKitchen from './pages/admin/AdminKitchen'
import AdminLogin from './pages/admin/AdminLogin'
import AdminMenu from './pages/admin/AdminMenu'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOverview from './pages/admin/AdminOverview'
import OrderPage from './pages/order/OrderPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/order/:tableLabel" element={<OrderPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/overview" element={<AdminOverview />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/kitchen" element={<AdminKitchen />} />
              <Route path="/admin/menu" element={<AdminMenu />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
