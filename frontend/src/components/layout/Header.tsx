import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/authStore'
import { getBasket } from '@/api/basket'

const Header = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, isBuyer, isSupplier, isAdmin, logout } = useAuthStore()

  // Загружаем корзину только для покупателя, чтобы показать счётчик товаров
  const { data: basket } = useQuery({
    queryKey: ['basket'],
    queryFn: getBasket,
    enabled: !!isBuyer,
    staleTime: 30000,
  })

  // Количество позиций в корзине
  const itemCount = basket?.order_items?.length ?? 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2">
            <Package className="text-primary-600" size={24} />
            <span className="text-xl font-bold text-gray-900">Zakupki</span>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Каталог
            </Link>
            {isSupplier && (
              <Link
                to="/partner"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Кабинет партнёра
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/orders"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Администратор
              </Link>
            )}
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Иконка корзины — только для покупателя */}
                {isBuyer && (
                  <Link to="/basket" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <ShoppingCart size={22} />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Меню пользователя */}
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User size={16} className="text-primary-600" />
                    </div>
                    <span className="hidden md:block">
                      {user?.first_name || user?.email}
                    </span>
                  </Link>
                  {isBuyer && (
                    <Link
                      to="/orders"
                      className="hidden md:block text-sm text-gray-600 hover:text-gray-900"
                    >
                      Мои заказы
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Выйти"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-700 hover:text-gray-900 px-3 py-1.5"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
