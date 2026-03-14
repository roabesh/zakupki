import { useState, useEffect } from 'react'
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
  Minus,
  Plus,
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

  // Выбранное количество для добавления в корзину
  const [qty, setQty] = useState(1)
  // Показ выпадающего списка магазинов (при нескольких ProductInfo)
  const [showShopDropdown, setShowShopDropdown] = useState(false)

  const addMutation = useMutation({
    mutationFn: ({ productInfoId, quantity }: { productInfoId: number; quantity: number }) =>
      addToBasket(productInfoId, quantity),
    onSuccess: () => {
      toast.success(`Добавлено в корзину: ${qty} шт.`)
      setShowShopDropdown(false)
      setQty(1)
      queryClient.invalidateQueries({ queryKey: ['basket'] })
    },
    onError: () => {
      toast.error('Не удалось добавить товар в корзину')
    },
  })

  // Максимальное доступное количество (для единственного магазина)
  const maxQty =
    product.product_infos.length === 1 ? product.product_infos[0].quantity : 999

  const handleQtyDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setQty((q) => Math.max(1, q - 1))
  }

  const handleQtyUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    setQty((q) => Math.min(maxQty, q + 1))
  }

  // Обработчик нажатия кнопки «В корзину»
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!isBuyer) {
      toast.error('Только покупатели могут добавлять товары в корзину')
      return
    }
    if (product.product_infos.length === 1) {
      addMutation.mutate({ productInfoId: product.product_infos[0].id, quantity: qty })
    } else {
      setShowShopDropdown((prev) => !prev)
    }
  }

  // Обработчик выбора конкретного магазина из выпадающего списка
  const handleSelectShop = (info: ProductInfo) => {
    addMutation.mutate({ productInfoId: info.id, quantity: qty })
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

      {/* Цена, счётчик количества и кнопка добавления в корзину */}
      <div className="mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {product.product_infos.length > 0 ? formatPrice(minPrice) : 'Нет в наличии'}
          </span>

          {/* Счётчик + кнопка корзины */}
          {isBuyer !== false && product.product_infos.length > 0 && (
            <div className="flex items-center gap-1">
              {/* Кнопка уменьшить */}
              <button
                type="button"
                onClick={handleQtyDown}
                disabled={qty <= 1}
                className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={11} />
              </button>
              {/* Текущее количество */}
              <span className="w-6 text-center text-sm font-medium text-gray-800">{qty}</span>
              {/* Кнопка увеличить */}
              <button
                type="button"
                onClick={handleQtyUp}
                disabled={qty >= maxQty}
                className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={11} />
              </button>

              {/* Кнопка «В корзину» */}
              <button
                onClick={handleAddToCart}
                disabled={addMutation.isPending}
                className="ml-1 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Добавить в корзину"
              >
                <ShoppingCart size={17} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Выпадающий список магазинов при нескольких ProductInfo */}
      {showShopDropdown && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Выберите магазин ({qty} шт.)</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowShopDropdown(false) }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
          {product.product_infos.map((info) => (
            <button
              key={info.id}
              onClick={() => handleSelectShop(info)}
              disabled={addMutation.isPending || info.quantity < qty}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 disabled:opacity-40"
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
      <div className="h-8 w-24 bg-gray-200 rounded-lg" />
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
  // Сортировка на клиенте
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default')
  // Для мобильного: показ/скрытие панели фильтров
  const [filtersOpen, setFiltersOpen] = useState(false)

  const PAGE_SIZE = 20

  // Дебаунс поиска: применяем через 400ms после последнего ввода
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Прокрутка в начало страницы при смене страницы, категории, магазина или поиска
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page, selectedCategory, selectedShop, search])

  // Загрузка категорий (без кеширования устаревших данных)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
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

  const rawProducts = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Сортировка товаров на клиенте
  const products = [...rawProducts].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return parseFloat(getMinPrice(a.product_infos)) - parseFloat(getMinPrice(b.product_infos))
    }
    if (sortBy === 'price_desc') {
      return parseFloat(getMinPrice(b.product_infos)) - parseFloat(getMinPrice(a.product_infos))
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'ru')
    }
    return 0
  })

  // Сброс всех фильтров
  const handleReset = () => {
    setSearchInput('')
    setSearch('')
    setSelectedCategory(undefined)
    setSelectedShop(undefined)
    setPage(1)
  }

  // Переключение магазина (checkbox)
  const handleShopToggle = (id: number) => {
    setSelectedShop((prev) => (prev === id ? undefined : id))
    setPage(1)
  }

  // JSX панели фильтров (поиск + магазины) — inline переменная, не отдельный компонент
  // ВАЖНО: не выносить в const Component = () => внутри CatalogPage —
  // это приведёт к пересозданию компонента на каждый рендер и потере фокуса input
  const filtersPanelJsx = (
    <div className="space-y-5">
      {/* Поиск с дебаунсом */}
      <div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск товаров..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

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
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Каталог товаров</h1>
          {!isLoading && (
            <p className="text-gray-500 mt-1 text-sm">
              {totalCount} {totalCount === 1 ? 'товар' : totalCount < 5 ? 'товара' : 'товаров'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Сортировка */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="default">По умолчанию</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="name">По названию</option>
          </select>
          {/* Кнопка фильтров на мобильном */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            Фильтры
          </button>
        </div>
      </div>

      {/* Горизонтальные чипы категорий */}
      {categoriesLoading ? (
        // Скелетоны пока категории загружаются
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-200 rounded-full animate-pulse"
              style={{ width: `${60 + i * 15}px` }}
            />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setSelectedCategory(undefined); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {cat.name}
              {cat.product_count !== undefined && (
                <span className={`ml-1.5 text-xs ${selectedCategory === cat.id ? 'text-blue-200' : 'text-gray-400'}`}>
                  {cat.product_count}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-6">
        {/* Левая боковая панель фильтров — скрыта на мобильном */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-4 bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Фильтры</h2>
            {filtersPanelJsx}
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
              {filtersPanelJsx}
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
          {(selectedShop || search) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  Поиск: «{search}»
                  <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}>
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
