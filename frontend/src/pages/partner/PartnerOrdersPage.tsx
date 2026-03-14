import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ShoppingBag, Clock, ArrowLeft, Package, ChevronRight } from 'lucide-react'
import { getPartnerOrders, updatePartnerOrderStatus } from '@/api/partner'
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
const StatusBadge = ({ state }: { state: OrderState }) => {
  if (state === 'basket') return null
  const config = orderStateConfig[state]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}

// Доступные переходы статуса для поставщика (key = текущий статус)
const STATUS_TRANSITIONS: Partial<Record<OrderState, { state: string; label: string; className: string }[]>> = {
  new:       [{ state: 'confirmed', label: 'Подтвердить',  className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
              { state: 'cancelled', label: 'Отменить',     className: 'bg-red-100 text-red-700 hover:bg-red-200' }],
  confirmed: [{ state: 'assembled', label: 'Собран',       className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
              { state: 'cancelled', label: 'Отменить',     className: 'bg-red-100 text-red-700 hover:bg-red-200' }],
  assembled: [{ state: 'sent',      label: 'Отправлен',    className: 'bg-orange-100 text-orange-700 hover:bg-orange-200' }],
}

// Карточка заказа с кнопками смены статуса
interface OrderCardProps {
  order: Order
  onStatusChange: (id: number, state: string) => void
  isPending: boolean
}

const OrderCard = ({ order, onStatusChange, isPending }: OrderCardProps) => {
  const navigate = useNavigate()
  const transitions = STATUS_TRANSITIONS[order.state] ?? []

  return (
    <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
      {/* Шапка карточки */}
      <div
        className="flex justify-between items-start gap-4 mb-2 cursor-pointer"
        onClick={() => navigate(`/partner/orders/${order.id}`)}
      >
        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
          Заказ #{order.id}
        </h3>
        <div className="flex items-center gap-2">
          {order.state !== 'basket' && <StatusBadge state={order.state} />}
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatDate(order.created_at)}</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Package className="w-3.5 h-3.5" />
          <span>
            {order.order_items.length}{' '}
            {order.order_items.length === 1 ? 'позиция' : 'позиций'}
          </span>
        </div>
        <span className="font-semibold text-gray-900">
          {formatPrice(parseFloat(order.total_sum))}
        </span>
      </div>

      {/* Кнопки смены статуса */}
      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {transitions.map((t) => (
            <button
              key={t.state}
              onClick={() => onStatusChange(order.id, t.state)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${t.className}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Страница заказов партнёра с управлением статусами
const PartnerOrdersPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['partnerOrders'],
    queryFn: getPartnerOrders,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: string }) =>
      updatePartnerOrderStatus(id, state),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['partnerOrders'] })
      const cfg = orderStateConfig[updatedOrder.state as Exclude<OrderState, 'basket'>]
      toast.success(`Статус заказа #${updatedOrder.id} изменён на «${cfg?.label ?? updatedOrder.state}»`)
    },
    onError: () => {
      toast.error('Не удалось изменить статус заказа')
    },
  })

  const handleStatusChange = (id: number, state: string) => {
    statusMutation.mutate({ id, state })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/partner')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Назад"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ShoppingBag className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Заказы партнёра</h1>
        {orders && orders.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
            {orders.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-8 text-center text-gray-500">
          Не удалось загрузить заказы. Попробуйте обновить страницу.
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Заказов пока нет</h2>
          <p className="text-gray-500">
            Заказы появятся здесь, когда покупатели оформят покупки из вашего магазина
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: Order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isPending={statusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PartnerOrdersPage
