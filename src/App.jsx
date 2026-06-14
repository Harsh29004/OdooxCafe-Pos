import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store.jsx'

import { Login, Signup } from './Auth.jsx'
import { AdminLayout, Reports, Products, Categories, PaymentMethods, Coupons, Tables, Users } from './Admin.jsx'
import { PosLayout, OrderView, Orders, TableView, Customers } from './Pos.jsx'
import KitchenDisplay from './Kitchen.jsx'

function RequireAuth({ children }) {
  const { state } = useStore()
  const location = useLocation()
  if (!state.session.currentUserId) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Kitchen Display — opened on a separate device/tab via fixed URL */}
      <Route path="/kitchen" element={<KitchenDisplay />} />

      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Navigate to="reports" replace />} />
        <Route path="reports" element={<Reports />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="payments" element={<PaymentMethods />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="tables" element={<Tables />} />
        <Route path="users" element={<Users />} />
      </Route>

      <Route path="/pos" element={<RequireAuth><PosLayout /></RequireAuth>}>
        <Route index element={<Navigate to="order" replace />} />
        <Route path="order" element={<OrderView />} />
        <Route path="orders" element={<Orders />} />
        <Route path="tables" element={<TableView />} />
        <Route path="customers" element={<Customers />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
