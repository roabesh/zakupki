import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Search,
  Filter,
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { getProducts, getCategories, getShops } from '@/api/products'
import { addToBasket } from '@/api/basket'
import useAuthStore from '@/store/authStore'
import { formatPrice, getMinPrice } from '@/utils'
import type { Product, ProductInfo } from '@/types'

// Карточка отдельного товара
interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate()
  const { isAuthenticated, isBuyer } = useAuthStore()
  const queryClient = useQueryClient()

  // Состояние для показа выпадающего списка магазинов (при нескольких ProductInfo)
  const [showShopDropdown, setShowShopDropdown] = useState(false)

  const addMutation = useMutation({
    mutationFn: (productInfoId: number) => addToBasket(productInfoId, 1),
    onSuccess: () => {
      toast.success('Товар добавлен в корзину')
      setShowShopDropdown(false)
      // Инвалидируем кеш корзины
      queryClient.invalidateQueries({ queryKey: ['basket'] })
    },
    onError: () => {
      toast.error('Не удалось добавить товар в корзину')
    },
  })

  // Обработчик нажатия кнопки "В корзину"
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!isBuyer) {
      toast.error('Только покупатели могут добавлять товары в корзину')
      return
    }
    if (product.product_infos.length === 1) {
      // Один магазин — добавляем сразу
      addMutation.mutate(product.product_infos[0].id)
    } else {
      // Несколько магазинов — показываем список для выбора
      setShowShopDropdown((prev) => !prev)
    }
  }

  // Обработчик выбора конкретного магазина из выпадающего списка
  const handleSelectShop = (info: ProductInfo) => {
    addMutation.mutate(info.id)
  }

  const minPrice = getMinPrice(product.product_infos)
  const shopCount = product.product_infos.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col relative">
      {/* Бейджи: категория и количество магазинов */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-[70%]">
          {product.category.name}
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap ml-1">
          {shopCount} {shopCount === 1 ? 'магазин' : shopCount < 5 ? 'магазина' : 'магазинов'}
        </span>
      </div>

      {/* Название товара — ведёт на страницу детали */}
      <h3
        className="font-medium text-gray-900 text-sm leading-snug mb-3 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors flex-grow"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        {product.name}
      </h3>

      {/* Цена и кнопка добавления в корзину */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-lg font-bold text-gray-900">
          {product.product_infos.length > 0 ? formatPrice(minPrice) : 'Нет в наличии'}
        </span>
        {isBuyer !== false && (
          <button
            onClick={handleAddToCart}
            disabled={addMutation.isPending || product.product_infos.length === 0}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Добавить в корзину"
          >
            <ShoppingCart size={18} />
          </button>
        )}
      </div>

      {/* Выпадающий список магазинов при нескольких ProductInfo */}
      {showShopDropdown && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Выберите магазин</span>
            <button
              onClick={() => setShowShopDropdown(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
          {product.product_infos.map((info) => (
            <button
              key={info.id}
              onClick={() => handleSelectShop(info)}
              disabled={addMutation.isPending}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="text-sm font-medium text-gray-900">{info.shop}</div>
              <div className="text-xs text-gray-500">
                {formatPrice(info.price)} · в наличии: {info.quantity} шт.
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Скелетон-карточка для состояния загрузки
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="flex justify-between mb-2">
      <div className="h-4 bg-gray-200 rounded-full w-24" />
      <div className="h-4 bg-gray-200 rounded-full w-10" />
    </div>
    <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
    <div className="flex justify-between items-center">
      <div className="h-6 bg-gray-200 rounded w-20" />
      <div className="h-8 w-8 bg-gray-200 rounded-lg" />
    </div>
  </div>
)

// Главная страница каталога с фильтрами, поиском и пагинацией
const CatalogPage = () => {
  // Состояние фильтров
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [selectedShop, setSelectedShop] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  // Для мобильного: показ/скрытие панели фильтров
  const [filtersOpen, setFiltersOpen] = useState(false)

  const PAGE_SIZE = 20

  // Загрузка категорий
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  })

  // Загрузка магазинов
  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
    staleTime: 5 * 60 * 1000,
  })

  // Загрузка товаров с учётом фильтров
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', { category: selectedCategory, shop: selectedShop, search, page }],
    queryFn: () =>
      getProducts({
        category: selectedCategory,
        shop: selectedShop,
        search: search || undefined,
        page,
      }),
    staleTime: 60 * 1000,
  })

  const products = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Сброс всех фильтров
  const handleReset = () => {
    setSearchInput('')
    setSearch('')
    setSelectedCategory(undefined)
    setSelectedShop(undefined)
    setPage(1)
  }

  // Применение поиска по нажатию Enter или кнопки
  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  // Переключение категории (checkbox)
  const handleCategoryToggle = (id: number) => {
    setSelectedCategory((prev) => (prev === id ? undefined : id))
    setPage(1)
  }

  // Переключение магазина (checkbox)
  const handleShopToggle = (id: number) => {
    setSelectedShop((prev) => (prev === id ? undefined : id))
    setPage(1)
  }

  // Компонент панели фильтров (используется и на десктопе и в мобильном попапе)
  const FiltersPanel = () => (
    <div className="space-y-5">
      {/* Поиск */}
      <div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Поиск товаров..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchInput !== search && (
          <button
            onClick={handleSearch}
            className="mt-2 w-full text-sm text-blue-600 hover:text-blue-700 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Найти
          </button>
        )}
      </div>

      {/* Фильтр по категориям */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Категории</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCategory === cat.id}
                  onChange={() => handleCategoryToggle(cat.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Фильтр по магазинам */}
      {shops.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Магазины</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {shops.map((shop) => (
              <label
                key={shop.id}
                className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedShop === shop.id}
                  onChange={() => handleShopToggle(shop.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{shop.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка сброса фильтров */}
      {(selectedCategory || selectedShop || search) && (
        <button
          onClick={handleReset}
          className="w-full py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <X size={14} />
          Сбросить фильтры
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок страницы */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Каталог товаров</h1>
          {!isLoading && (
            <p className="text-gray-500 mt-1 text-sm">
              {totalCount} {totalCount === 1 ? 'товар' : totalCount < 5 ? 'товара' : 'товаров'}
            </p>
          )}
        </div>
        {/* Кнопка фильтров на мобильном */}
        <button
          onClick={() => setFiltersOpen(true)}
          className="md:hidden flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter size={16} />
          Фильтры
        </button>
      </div>

      <div className="flex gap-6">
        {/* Левая боковая панель фильтров — скрыта на мобильном */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-4 bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Фильтры</h2>
            <FiltersPanel />
          </div>
        </aside>

        {/* Мобильное модальное окно фильтров */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Фильтры</h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <FiltersPanel />
              <button
                onClick={() => setFiltersOpen(false)}
                className="mt-4 w-full py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        )}

        {/* Основная область с товарами */}
        <main className="flex-1 min-w-0">
          {/* Активные фильтры (теги) */}
          {(selectedCategory || selectedShop || search) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  Поиск: «{search}»
                  <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => { setSelectedCategory(undefined); setPage(1) }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedShop && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {shops.find((s) => s.id === selectedShop)?.name}
                  <button onClick={() => { setSelectedShop(undefined); setPage(1) }}>
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Ошибка загрузки */}
          {error && (
            <div className="text-center py-12 text-red-600">
              Не удалось загрузить каталог. Убедитесь, что backend запущен.
            </div>
          )}

          {/* Скелетоны при загрузке */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Пустое состояние */}
          {!isLoading && !error && products.length === 0 && (
            <div className="text-center py-16">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Товары не найдены</p>
              <p className="text-gray-400 text-sm mt-1">
                Попробуйте изменить фильтры или поисковый запрос
              </p>
              {(selectedCategory || selectedShop || search) && (
                <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}

          {/* Сетка товаров */}
          {!isLoading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Пагинация — только если товаров больше PAGE_SIZE */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    Пред.
                  </button>
                  <span className="text-sm text-gray-600">
                    Стр. {page} из {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    След.
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default CatalogPage
