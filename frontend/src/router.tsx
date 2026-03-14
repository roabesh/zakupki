import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from '@/components/layout/Layout'
import PrivateRoute from '@/components/layout/PrivateRoute'

// Ленивая загрузка страниц
const CatalogPageLazy = lazy(() => import('./pages/catalog/CatalogPage'))
const ProductDetailPageLazy = lazy(() => import('./pages/catalog/ProductDetailPage'))
const LoginPageLazy = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPageLazy = lazy(() => import('./pages/auth/RegisterPage'))
const BasketPageLazy = lazy(() => import('./pages/basket/BasketPage'))
const CheckoutPageLazy = lazy(() => import('./pages/checkout/CheckoutPage'))
const OrdersPageLazy = lazy(() => import('./pages/orders/OrdersPage'))
const OrderDetailPageLazy = lazy(() => import('./pages/orders/OrderDetailPage'))
const ProfilePageLazy = lazy(() => import('./pages/profile/ProfilePage'))
const PartnerDashboardLazy = lazy(() => import('./pages/partner/PartnerDashboard'))
const UploadPageLazy = lazy(() => import('./pages/partner/UploadPage'))
const PartnerOrdersPageLazy = lazy(() => import('./pages/partner/PartnerOrdersPage'))
const AdminOrdersPageLazy = lazy(() => import('./pages/admin/AdminOrdersPage'))

// Компонент загрузки при ленивом импорте
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // Публичные маршруты
      {
        index: true,
        element: <Suspense fallback={<LoadingFallback />}><CatalogPageLazy /></Suspense>,
      },
      {
        path: 'products/:id',
        element: <Suspense fallback={<LoadingFallback />}><ProductDetailPageLazy /></Suspense>,
      },
      {
        path: 'login',
        element: <Suspense fallback={<LoadingFallback />}><LoginPageLazy /></Suspense>,
      },
      {
        path: 'register',
        element: <Suspense fallback={<LoadingFallback />}><RegisterPageLazy /></Suspense>,
      },

      // Маршруты покупателя
      {
        element: <PrivateRoute role="buyer" />,
        children: [
          {
            path: 'basket',
            element: <Suspense fallback={<LoadingFallback />}><BasketPageLazy /></Suspense>,
          },
          {
            path: 'checkout',
            element: <Suspense fallback={<LoadingFallback />}><CheckoutPageLazy /></Suspense>,
          },
          {
            path: 'orders',
            element: <Suspense fallback={<LoadingFallback />}><OrdersPageLazy /></Suspense>,
          },
          {
            path: 'orders/:id',
            element: <Suspense fallback={<LoadingFallback />}><OrderDetailPageLazy /></Suspense>,
          },
        ],
      },

      // Профиль (доступен всем авторизованным)
      {
        element: <PrivateRoute />,
        children: [
          {
            path: 'profile',
            element: <Suspense fallback={<LoadingFallback />}><ProfilePageLazy /></Suspense>,
          },
        ],
      },

      // Маршруты поставщика
      {
        element: <PrivateRoute role="supplier" />,
        children: [
          {
            path: 'partner',
            element: <Suspense fallback={<LoadingFallback />}><PartnerDashboardLazy /></Suspense>,
          },
          {
            path: 'partner/upload',
            element: <Suspense fallback={<LoadingFallback />}><UploadPageLazy /></Suspense>,
          },
          {
            path: 'partner/orders',
            element: <Suspense fallback={<LoadingFallback />}><PartnerOrdersPageLazy /></Suspense>,
          },
        ],
      },

      // Маршруты администратора
      {
        element: <PrivateRoute role="admin" />,
        children: [
          { path: 'admin/orders', element: <Suspense fallback={<LoadingFallback />}><AdminOrdersPageLazy /></Suspense> },
        ],
      },
    ],
  },
])

export default router
