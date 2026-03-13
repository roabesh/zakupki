import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from '@/components/layout/Layout'
import PrivateRoute from '@/components/layout/PrivateRoute'

// Ленивая загрузка страниц
const CatalogPageLazy = lazy(() => import('./pages/catalog/CatalogPage'))
const ProductDetailPageLazy = lazy(() => import('./pages/catalog/ProductDetailPage'))
const LoginPageLazy = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPageLazy = lazy(() => import('./pages/auth/RegisterPage'))

// Временные заглушки для ещё не реализованных страниц
const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
      <p className="text-gray-500 mt-2">Страница в разработке</p>
    </div>
  </div>
)

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
          { path: 'basket', element: <ComingSoon title="Корзина" /> },
          { path: 'checkout', element: <ComingSoon title="Оформление заказа" /> },
          { path: 'orders', element: <ComingSoon title="Мои заказы" /> },
          { path: 'orders/:id', element: <ComingSoon title="Детали заказа" /> },
        ],
      },

      // Профиль (доступен всем авторизованным)
      {
        element: <PrivateRoute />,
        children: [
          { path: 'profile', element: <ComingSoon title="Профиль" /> },
        ],
      },

      // Маршруты поставщика
      {
        element: <PrivateRoute role="supplier" />,
        children: [
          { path: 'partner', element: <ComingSoon title="Кабинет партнёра" /> },
          { path: 'partner/upload', element: <ComingSoon title="Загрузка прайса" /> },
          { path: 'partner/orders', element: <ComingSoon title="Заказы партнёра" /> },
        ],
      },

      // Маршруты администратора
      {
        element: <PrivateRoute role="admin" />,
        children: [
          { path: 'admin/orders', element: <ComingSoon title="Все заказы" /> },
        ],
      },
    ],
  },
])

export default router
