import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { getOrders } from '@/api/orders'
import { formatPrice, formatDate, orderStateConfig } from '@/utils'
import type { Order, OrderState } from '@/types'

// Скелетон строки таблицы при загрузке
const RowSkeleton = () => (
  <tr className="animate-pulse border-b border-gray-100">
    <td className="px-5 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    <td className="px-5 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
    <td className="px-5 py-3"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
    <td className="px-5 py-3"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
    <td className="px-5 py-3"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
    <td className="px-5 py-3"><div className="h-4 bg-gray-200 rounded w-4 ml-auto" /></td>
  </tr>
)

// Бейдж статуса заказа
const StatusBadge = ({ state }: { state: OrderState }) => {
  if (state === 'basket') return null
  const config = orderStateConfig[state]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}

// Строка таблицы заказов
const OrderRow = ({ order, onClick }: { order: Order; onClick: () => void }) => {
  const count = order.order_items.length
  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">#{order.id}</td>
      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(order.created_at)}
      </td>
      <td className="px-5 py-3">
        {order.state !== 'basket' && <StatusBadge state={order.state} />}
      </td>
      <td className="px-5 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
        {count} {count === 1 ? 'позиция' : 'позиций'}
      </td>
      <td className="px-5 py-3 font-semibold text-gray-900 text-right whitespace-nowrap">
        {formatPrice(parseFloat(order.total_sum))}
      </td>
      <td className="px-5 py-3 text-gray-400 text-right">
        <ChevronRight className="w-4 h-4 inline-block" />
      </td>
    </tr>
  )
}

// Страница списка заказов
const OrdersPage = () => {
  const navigate = useNavigate()

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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

      {isError ? (
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-8 text-center text-gray-500">
          Не удалось загрузить заказы. Попробуйте обновить страницу.
        </div>
      ) : !isLoading && (!orders || orders.length === 0) ? (
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
        // Табличный список заказов
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-medium">Заказ</th>
                  <th className="px-5 py-3 text-left font-medium">Дата</th>
                  <th className="px-5 py-3 text-left font-medium">Статус</th>
                  <th className="px-5 py-3 text-right font-medium">Позиций</th>
                  <th className="px-5 py-3 text-right font-medium">Сумма</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>{Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}</>
                ) : (
                  orders!.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
