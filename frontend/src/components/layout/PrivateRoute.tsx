import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

interface PrivateRouteProps {
  role?: 'buyer' | 'supplier' | 'admin'
}

// Защита маршрутов: редирект на /login если нет токена, на / если не та роль
const PrivateRoute = ({ role }: PrivateRouteProps) => {
  const { isAuthenticated, isBuyer, isSupplier, isAdmin } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (role === 'buyer' && !isBuyer) return <Navigate to="/" replace />
  if (role === 'supplier' && !isSupplier) return <Navigate to="/" replace />
  if (role === 'admin' && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}

export default PrivateRoute
