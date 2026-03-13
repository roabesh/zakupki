import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ShoppingBag, Trash2, Plus, Minus, Package } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { getBasket, updateBasketItem, removeFromBasket } from '@/api/orders'
import { formatPrice } from '@/utils'
import type { OrderItem } from '@/types'

// Скелетон строки корзины при загрузке
const BasketItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
    <div className="h-8 bg-gray-200 rounded w-24" />
    <div className="h-8 bg-gray-200 rounded w-16" />
    <div className="h-8 bg-gray-200 rounded w-8" />
  </div>
)

// Карточка одной позиции корзины
interface BasketItemRowProps {
  item: OrderItem
  onQuantityChange: (itemId: number, quantity: number) => void
  onRemove: (itemId: number) => void
  isUpdating: boolean
}

const BasketItemRow = ({ item, onQuantityChange, onRemove, isUpdating }: BasketItemRowProps) => {
  const productName = item.product_info.product?.name ?? item.product_info.model
  const shopName = item.product_info.shop
  const priceNum = parseFloat(item.product_info.price_rrc)
  const itemTotal = priceNum * item.quantity

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-100 last:border-b-0">
      {/* Информация о товаре */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{productName}</p>
        <p className="text-sm text-gray-500 truncate">{shopName}</p>
        <p className="text-sm font-medium text-primary-600 mt-1">{formatPrice(priceNum)} / шт.</p>
      </div>

      {/* Спиннер количества */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1 || isUpdating}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Уменьшить количество"
        >
          <Minus className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <span className="w-10 text-center font-medium text-gray-900 tabular-nums">
          {item.quantity}
        </span>
        <button
          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          disabled={isUpdating}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Увеличить количество"
        >
          <Plus className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      {/* Сумма по позиции */}
      <div className="w-28 text-right shrink-0">
        <p className="font-semibold text-gray-900">{formatPrice(itemTotal)}</p>
      </div>

      {/* Кнопка удаления */}
      <button
        onClick={() => onRemove(item.id)}
        disabled={isUpdating}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        aria-label="Удалить из корзины"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

// Страница корзины покупателя
const BasketPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  // Редирект неавторизованных пользователей
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const { data: basket, isLoading, isError } = useQuery({
    queryKey: ['basket'],
    queryFn: getBasket,
    enabled: isAuthenticated,
  })

  // Мутация обновления количества
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateBasketItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket'] })
    },
    onError: () => {
      toast.error('Не удалось обновить количество')
    },
  })

  // Мутация удаления позиции
  const removeMutation = useMutation({
    mutationFn: (itemId: number) => removeFromBasket([itemId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket'] })
      toast.success('Товар удалён из корзины')
    },
    onError: () => {
      toast.error('Не удалось удалить товар')
    },
  })

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (quantity < 1) return
    updateMutation.mutate({ itemId, quantity })
  }

  const handleRemove = (itemId: number) => {
    removeMutation.mutate(itemId)
  }

  const isMutating = updateMutation.isPending || removeMutation.isPending

  if (!isAuthenticated) return null

  // Пустая корзина
  const isEmpty = !isLoading && !isError && (!basket?.order_items || basket.order_items.length === 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Корзина</h1>
        {basket && basket.order_items.length > 0 && (
          <span className="ml-1 px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
            {basket.order_items.length}
          </span>
        )}
      </div>

      {isLoading ? (
        // Скелетон загрузки
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
          <BasketItemSkeleton />
          <BasketItemSkeleton />
          <BasketItemSkeleton />
        </div>
      ) : isError ? (
        // Ошибка загрузки
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-8 text-center text-gray-500">
          Не удалось загрузить корзину. Попробуйте обновить страницу.
        </div>
      ) : isEmpty ? (
        // Пустое состояние
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Корзина пуста</h2>
          <p className="text-gray-500 mb-6">Добавьте товары из каталога</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        // Корзина с товарами
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Список позиций */}
          <div className="flex-1 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                {basket!.order_items.length} {basket!.order_items.length === 1 ? 'позиция' : 'позиций'}
              </p>
            </div>
            {basket!.order_items.map((item) => (
              <BasketItemRow
                key={item.id}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
                isUpdating={isMutating}
              />
            ))}
          </div>

          {/* Блок итогов */}
          <div className="lg:w-72 shrink-0">
            <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5 sticky top-6">
              <h2 className="font-semibold text-gray-900 mb-4">Итого</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Позиций</span>
                  <span>{basket!.order_items.length}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 text-lg pt-2 border-t border-gray-100">
                  <span>Сумма</span>
                  <span>{formatPrice(parseFloat(basket!.total_sum))}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                disabled={isMutating}
                className="w-full py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Оформить заказ
              </button>
              <Link
                to="/"
                className="block text-center mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Продолжить покупки
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BasketPage
