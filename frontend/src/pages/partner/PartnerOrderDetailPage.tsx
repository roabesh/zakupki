import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Package } from 'lucide-react'
import { getPartnerOrderById, updatePartnerOrderStatus } from '@/api/partner'
import { formatPrice, formatDate, orderStateConfig } from '@/utils'
import type { OrderState } from '@/types'

// Доступные переходы статуса для поставщика (key = текущий статус)
const STATUS_TRANSITIONS: Partial<Record<OrderState, { state: string; label: string; className: string }[]>> = {
  new:       [{ state: 'confirmed', label: 'Подтвердить заказ', className: 'bg-cyan-600 text-white hover:bg-cyan-700' },
              { state: 'cancelled', label: 'Отменить',          className: 'bg-red-600 text-white hover:bg-red-700' }],
  confirmed: [{ state: 'assembled', label: 'Отметить как собранный', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
              { state: 'cancelled', label: 'Отменить',               className: 'bg-red-600 text-white hover:bg-red-700' }],
  assembled: [{ state: 'sent',      label: 'Отметить как отправленный', className: 'bg-orange-500 text-white hover:bg-orange-600' }],
}

// Страница деталей заказа для поставщика
const PartnerOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const orderId = Number(id)

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['partnerOrder', orderId],
    queryFn: () => getPartnerOrderById(orderId),
    enabled: !!orderId,
  })

  const statusMutation = useMutation({
    mutationFn: (newState: string) => updatePartnerOrderStatus(orderId, newState),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['partnerOrder', orderId] })
      queryClient.invalidateQueries({ queryKey: ['partnerOrders'] })
      const cfg = orderStateConfig[updatedOrder.state as Exclude<OrderState, 'basket'>]
      toast.success(`Статус изменён на «${cfg?.label ?? updatedOrder.state}»`)
    },
    onError: () => {
      toast.error('Не удалось изменить статус')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-40" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-60 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium">Заказ не найден</p>
        <button
          onClick={() => navigate('/partner/orders')}
          className="mt-4 text-blue-600 hover:underline text-sm"
        >
          Вернуться к заказам
        </button>
      </div>
    )
  }

  const stateConfig = order.state !== 'basket' ? orderStateConfig[order.state] : null
  const transitions = STATUS_TRANSITIONS[order.state] ?? []

  // Форматирование адреса доставки
  const formatAddress = () => {
    if (!order.contact) return 'Не указан'
    const { city, street, house, structure, building, apartment } = order.contact
    return [
      city,
      street,
      house && `д. ${house}`,
      structure && `стр. ${structure}`,
      building && `корп. ${building}`,
      apartment && `кв. ${apartment}`,
    ].filter(Boolean).join(', ')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Навигация */}
      <button
        onClick={() => navigate('/partner/orders')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Заказы партнёра
      </button>

      {/* Шапка заказа */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Заказ #{order.id}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          {stateConfig && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${stateConfig.bg} ${stateConfig.color}`}>
              {stateConfig.label}
            </span>
          )}
        </div>

        {/* Кнопки смены статуса */}
        {transitions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            {transitions.map((t) => (
              <button
                key={t.state}
                onClick={() => statusMutation.mutate(t.state)}
                disabled={statusMutation.isPending}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${t.className}`}
              >
                {statusMutation.isPending ? 'Сохранение...' : t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Адрес доставки */}
      {order.contact && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Адрес доставки</h2>
          </div>
          <p className="text-sm text-gray-700">{formatAddress()}</p>
        </div>
      )}

      {/* Таблица позиций */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Состав заказа</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {order.order_items.map((item) => {
            const name = item.product_info.product?.name ?? item.product_info.model
            const priceEach = parseFloat(item.product_info.price_rrc)
            const priceTotal = priceEach * item.quantity

            return (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.product_info.shop}</p>
                </div>
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  {formatPrice(priceEach)} × {item.quantity}
                </div>
                <div className="text-sm font-semibold text-gray-900 whitespace-nowrap w-24 text-right">
                  {formatPrice(priceTotal)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Итого */}
        <div className="px-5 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <span className="font-semibold text-gray-900">Итого</span>
          <span className="font-bold text-gray-900 text-lg">
            {formatPrice(parseFloat(order.total_sum))}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PartnerOrderDetailPage
