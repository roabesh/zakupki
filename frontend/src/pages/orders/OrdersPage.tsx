import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Clock } from 'lucide-react'
import { getOrders } from '@/api/orders'
import { formatPrice, formatDate, orderStateConfig } from '@/utils'
import type { Order, OrderState } from '@/types'

// Скелетон карточки заказа при загрузке
const OrderCardSkeleton = () => (
  <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="h-5 bg-gray-200 rounded w-28" />
      <div className="h-5 bg-gray-200 rounded w-20" />
    </div>
    <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-24" />
  </div>
)

// Бейдж статуса заказа
interface StatusBadgeProps {
  state: OrderState
}

const StatusBadge = ({ state }: StatusBadgeProps) => {
  if (state === 'basket') return null
  const config = orderStateConfig[state]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}

// Карточка заказа
interface OrderCardProps {
  order: Order
  onClick: () => void
}

const OrderCard = ({ order, onClick }: OrderCardProps) => (
  <div
    onClick={onClick}
    className="rounded-xl border border-gray-200 shadow-sm bg-white p-5 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all"
  >
    <div className="flex justify-between items-start gap-4 mb-2">
      <h3 className="font-semibold text-gray-900">Заказ #{order.id}</h3>
      {order.state !== 'basket' && <StatusBadge state={order.state} />}
    </div>

    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
      <Clock className="w-3.5 h-3.5" />
      <span>{formatDate(order.created_at)}</span>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">
        {order.order_items.length}{' '}
        {order.order_items.length === 1 ? 'позиция' : 'позиций'}
      </span>
      <span className="font-semibold text-gray-900">
        {formatPrice(parseFloat(order.total_sum))}
      </span>
    </div>
  </div>
)

// Страница списка заказов
const OrdersPage = () => {
  const navigate = useNavigate()

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Мои заказы</h1>
        {orders && orders.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
            {orders.length}
          </span>
        )}
      </div>

      {isLoading ? (
        // Скелетон загрузки
        <div className="space-y-3">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : isError ? (
        // Ошибка загрузки
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-8 text-center text-gray-500">
          Не удалось загрузить заказы. Попробуйте обновить страницу.
        </div>
      ) : !orders || orders.length === 0 ? (
        // Пустое состояние
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">У вас пока нет заказов</h2>
          <p className="text-gray-500 mb-6">Оформите первый заказ из каталога</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        // Список заказов
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => navigate(`/orders/${order.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default OrdersPage
