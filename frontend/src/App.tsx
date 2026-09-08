import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminKitchen from './pages/admin/AdminKitchen'
import AdminLogin from './pages/admin/AdminLogin'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOverview from './pages/admin/AdminOverview'
import OrderPage from './pages/order/OrderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order/:tableNumber" element={<OrderPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/overview" element={<AdminOverview />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/kitchen" element={<AdminKitchen />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
