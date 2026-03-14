import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Package, ClipboardList, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import useAuthStore from '@/store/authStore'
import { getBasket } from '@/api/basket'

const Header = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, isBuyer, isSupplier, isAdmin, logout } = useAuthStore()

  // Состояние дропдауна
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрытие при клике вне меню
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const handleMenuLink = () => setMenuOpen(false)

  // Инициал для аватара
  const initial = user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Package className="text-primary-600" size={24} />
            <span className="text-xl font-bold text-gray-900">Zakupki</span>
          </Link>

          {/* Центральная навигация — только общие разделы */}
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
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Иконка корзины — только для покупателя */}
                {isBuyer && (
                  <Link
                    to="/basket"
                    className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ShoppingCart size={22} />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Дропдаун пользователя */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Аватар с инициалом */}
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700 select-none">
                      {initial}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user?.first_name || user?.email}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`hidden md:block text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Выпадающее меню */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50">
                      {/* Имя пользователя */}
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.first_name
                            ? `${user.first_name} ${user.last_name ?? ''}`.trim()
                            : user?.email}
                        </p>
                        {user?.first_name && (
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        )}
                      </div>

                      {/* Профиль */}
                      <Link
                        to="/profile"
                        onClick={handleMenuLink}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={16} className="text-gray-400" />
                        Профиль
                      </Link>

                      {/* Мои заказы — только покупателю */}
                      {isBuyer && (
                        <Link
                          to="/orders"
                          onClick={handleMenuLink}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ClipboardList size={16} className="text-gray-400" />
                          Мои заказы
                        </Link>
                      )}

                      {/* Разделитель */}
                      <div className="border-t border-gray-100 my-1" />

                      {/* Выйти */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                    </div>
                  )}
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
