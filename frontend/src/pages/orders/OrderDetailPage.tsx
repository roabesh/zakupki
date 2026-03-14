import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, MapPin, Clock } from 'lucide-react'
import { getOrderById } from '@/api/orders'
import { formatPrice, formatDate, orderStateConfig } from '@/utils'
import type { OrderState } from '@/types'

// Скелетон загрузки страницы заказа
const OrderDetailSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-7 bg-gray-200 rounded w-48" />
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-32" />
      <div className="h-4 bg-gray-200 rounded w-64" />
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-1 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
)

// Бейдж статуса заказа
interface StatusBadgeProps {
  state: OrderState
}

const StatusBadge = ({ state }: StatusBadgeProps) => {
  if (state === 'basket') return null
  const config = orderStateConfig[state]
  if (!config) return null
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}

// Страница детального просмотра заказа
const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Навигация назад */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Мои заказы
      </Link>

      {isLoading ? (
        <OrderDetailSkeleton />
      ) : isError || !order ? (
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-8 text-center text-gray-500">
          Не удалось загрузить заказ. Попробуйте обновить страницу.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Заголовок с номером, датой и статусом */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Заказ #{order.id}</h1>
            {order.state !== 'basket' && <StatusBadge state={order.state} />}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
              <Clock className="w-4 h-4" />
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>

          {/* Адрес доставки */}
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Адрес доставки</h2>
            </div>
            {order.contact ? (
              <p className="text-sm text-gray-700">
                {[
                  order.contact.city,
                  order.contact.street,
                  order.contact.house && `д. ${order.contact.house}`,
                  order.contact.structure && `стр. ${order.contact.structure}`,
                  order.contact.building && `корп. ${order.contact.building}`,
                  order.contact.apartment && `кв. ${order.contact.apartment}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Адрес не указан</p>
            )}
          </div>

          {/* Таблица позиций заказа */}
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Состав заказа</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-2.5 text-left font-medium">Товар</th>
                    <th className="px-5 py-2.5 text-left font-medium">Магазин</th>
                    <th className="px-5 py-2.5 text-left font-medium">Статус</th>
                    <th className="px-5 py-2.5 text-right font-medium whitespace-nowrap">Цена</th>
                    <th className="px-5 py-2.5 text-right font-medium whitespace-nowrap">Кол-во</th>
                    <th className="px-5 py-2.5 text-right font-medium whitespace-nowrap">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.order_items.map((item) => {
                    const productName = item.product_info.product?.name ?? item.product_info.model
                    const shopName = item.product_info.shop
                    const priceNum = parseFloat(item.product_info.price_rrc)
                    const itemTotal = priceNum * item.quantity
                    // Статус поставщика для этой позиции из shop_states
                    const shopStateStr = order.shop_states?.[shopName]
                    const shopStateCfg = shopStateStr && shopStateStr !== 'basket'
                      ? orderStateConfig[shopStateStr as Exclude<OrderState, 'basket'>]
                      : null

                    return (
                      <tr key={item.id}>
                        <td className="px-5 py-3 font-medium text-gray-900">{productName}</td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{shopName}</td>
                        <td className="px-5 py-3">
                          {shopStateCfg && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${shopStateCfg.bg} ${shopStateCfg.color}`}>
                              {shopStateCfg.label}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-700 text-right whitespace-nowrap">
                          {formatPrice(priceNum)}
                        </td>
                        <td className="px-5 py-3 text-gray-700 text-right">{item.quantity}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900 text-right whitespace-nowrap">
                          {formatPrice(itemTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Итоговая строка */}
            <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Итого:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(parseFloat(order.total_sum))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetailPage
