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

            {/* Шапка таблицы — только на десктопе */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Товар</span>
              <span className="text-right">Магазин</span>
              <span className="text-right w-24">Цена</span>
              <span className="text-right w-16">Кол-во</span>
              <span className="text-right w-24">Сумма</span>
            </div>

            {/* Строки товаров */}
            {order.order_items.map((item) => {
              const productName = item.product_info.product?.name ?? item.product_info.model
              const shopName = item.product_info.shop
              const priceNum = parseFloat(item.product_info.price_rrc)
              const itemTotal = priceNum * item.quantity

              return (
                <div
                  key={item.id}
                  className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-1 md:gap-4 px-5 py-3 border-b border-gray-100 last:border-b-0"
                >
                  {/* Название товара */}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{productName}</p>
                    {/* Магазин — показывается под именем на мобильном */}
                    <p className="text-xs text-gray-500 md:hidden">{shopName}</p>
                  </div>
                  {/* Магазин — только на десктопе */}
                  <span className="hidden md:block text-right text-sm text-gray-600 self-center">
                    {shopName}
                  </span>
                  <div className="flex justify-between md:block">
                    <span className="text-xs text-gray-500 md:hidden">Цена:</span>
                    <span className="text-right w-24 text-sm text-gray-700 self-center">
                      {formatPrice(priceNum)}
                    </span>
                  </div>
                  <div className="flex justify-between md:block">
                    <span className="text-xs text-gray-500 md:hidden">Кол-во:</span>
                    <span className="text-right w-16 text-sm text-gray-700 self-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between md:block">
                    <span className="text-xs text-gray-500 md:hidden">Сумма:</span>
                    <span className="text-right w-24 text-sm font-semibold text-gray-900 self-center">
                      {formatPrice(itemTotal)}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Итоговая строка */}
            <div className="flex justify-between items-center px-5 py-4 bg-gray-50">
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
