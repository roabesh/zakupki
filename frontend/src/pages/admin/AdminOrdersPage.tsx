import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Settings, Edit2, Check, X, Filter } from 'lucide-react'
import { getAllOrders, changeOrderStatus } from '@/api/admin'
import { formatPrice, formatDate, orderStateConfig } from '@/utils'
import type { Order, OrderState } from '@/types'

// Все возможные статусы заказа (без корзины)
const ORDER_STATES: Exclude<OrderState, 'basket'>[] = [
  'new',
  'confirmed',
  'assembled',
  'sent',
  'delivered',
  'cancelled',
]

// Скелетон строки таблицы при загрузке
const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
    <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-24" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
    <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-32" /></td>
  </tr>
)

// Скелетон карточки при загрузке (мобильный вид)
const CardSkeleton = () => (
  <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="h-5 bg-gray-200 rounded w-28" />
      <div className="h-5 bg-gray-200 rounded w-20" />
    </div>
    <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-36" />
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

// Модальное окно изменения статуса заказа
interface StatusModalProps {
  order: Order
  onClose: () => void
}

const StatusModal = ({ order, onClose }: StatusModalProps) => {
  const queryClient = useQueryClient()
  // Выбранный новый статус (по умолчанию — текущий)
  const [selectedState, setSelectedState] = useState<Exclude<OrderState, 'basket'>>(
    order.state === 'basket' ? 'new' : order.state
  )

  // Мутация изменения статуса
  const changeMutation = useMutation({
    mutationFn: () => changeOrderStatus(order.id, selectedState),
    onSuccess: () => {
      const label = orderStateConfig[selectedState].label
      toast.success(`Статус изменён на "${label}". Email отправлен покупателю.`)
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] })
      onClose()
    },
    onError: () => {
      toast.error('Не удалось изменить статус заказа')
    },
  })

  // Кнопка "Сохранить" неактивна, если статус не изменился
  const isSameState = selectedState === order.state
  const currentConfig = order.state !== 'basket' ? orderStateConfig[order.state] : null

  return (
    // Затемнённый оверлей
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Содержимое модального окна */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Заказ #{order.id}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Текущий статус */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-500">Текущий статус:</span>
          {currentConfig && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentConfig.bg} ${currentConfig.color}`}>
              {currentConfig.label}
            </span>
          )}
        </div>

        {/* Дата и количество позиций */}
        <div className="text-sm text-gray-500 mb-5">
          <span>{formatDate(order.created_at)}</span>
          <span className="mx-1.5">·</span>
          <span>{order.order_items.length} поз.</span>
        </div>

        {/* Выбор нового статуса */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Новый статус
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value as Exclude<OrderState, 'basket'>)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ORDER_STATES.map((state) => (
              <option key={state} value={state}>
                {orderStateConfig[state].label}
              </option>
            ))}
          </select>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => changeMutation.mutate()}
            disabled={isSameState || changeMutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {changeMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Карточка заказа для мобильного вида
interface OrderCardProps {
  order: Order
  onChangeStatus: (order: Order) => void
}

const OrderCard = ({ order, onChangeStatus }: OrderCardProps) => (
  <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
    <div className="flex justify-between items-start gap-4 mb-2">
      <h3 className="font-semibold text-gray-900">Заказ #{order.id}</h3>
      {order.state !== 'basket' && <StatusBadge state={order.state} />}
    </div>

    <div className="text-sm text-gray-500 mb-1">{formatDate(order.created_at)}</div>

    <div className="flex justify-between items-center mb-4">
      <span className="text-sm text-gray-600">{order.order_items.length} поз.</span>
      <span className="font-semibold text-gray-900">
        {formatPrice(parseFloat(order.total_sum))}
      </span>
    </div>

    <button
      onClick={() => onChangeStatus(order)}
      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
    >
      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
      Изменить статус
    </button>
  </div>
)

// Страница управления заказами (только для администратора)
const AdminOrdersPage = () => {
  // Фильтр по статусу
  const [statusFilter, setStatusFilter] = useState<OrderState | ''>('')
  // Выбранный для изменения заказ
  const [modalOrder, setModalOrder] = useState<Order | null>(null)

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: getAllOrders,
  })

  // Фильтрация заказов по статусу
  const filteredOrders = (orders ?? []).filter(
    (o) => statusFilter === '' || o.state === statusFilter
  )

  // Открыть модальное окно для конкретного заказа
  const openModal = (order: Order) => setModalOrder(order)

  // Закрыть модальное окно
  const closeModal = () => setModalOrder(null)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <Settings className="w-7 h-7 text-blue-600 shrink-0" />
          <h1 className="text-2xl font-bold text-gray-900">Управление заказами</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Счётчик найденных заказов */}
          {!isLoading && !isError && (
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Всего заказов: {filteredOrders.length}
            </span>
          )}

          {/* Фильтр по статусу */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderState | '')}
              className="pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все статусы</option>
              <option value="new">Новые</option>
              <option value="confirmed">Подтверждённые</option>
              <option value="assembled">Собранные</option>
              <option value="sent">Отправленные</option>
              <option value="delivered">Доставленные</option>
              <option value="cancelled">Отменённые</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <>
          {/* Скелетон таблицы (десктоп) */}
          <div className="hidden md:block rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Кол-во позиций</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Сумма</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} />)}
              </tbody>
            </table>
          </div>

          {/* Скелетон карточек (мобильный) */}
          <div className="md:hidden space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
          </div>
        </>
      ) : isError ? (
        // Ошибка загрузки
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-8 text-center text-gray-500">
          Не удалось загрузить заказы. Попробуйте обновить страницу.
        </div>
      ) : filteredOrders.length === 0 ? (
        // Пустое состояние
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-12 text-center">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Заказов не найдено</h2>
          {statusFilter !== '' && (
            <p className="text-gray-500">
              Попробуйте изменить фильтр или выбрать другой статус
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Таблица заказов (десктоп) */}
          <div className="hidden md:block rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Кол-во позиций</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Сумма</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID заказа */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>

                    {/* Дата создания */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>

                    {/* Статус */}
                    <td className="px-4 py-3">
                      {order.state !== 'basket' && <StatusBadge state={order.state} />}
                    </td>

                    {/* Количество позиций */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.order_items.length} поз.
                    </td>

                    {/* Сумма */}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatPrice(parseFloat(order.total_sum))}
                    </td>

                    {/* Кнопка изменения статуса */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal(order)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        Изменить статус
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Карточки заказов (мобильный) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onChangeStatus={openModal} />
            ))}
          </div>
        </>
      )}

      {/* Модальное окно изменения статуса */}
      {modalOrder && (
        <StatusModal order={modalOrder} onClose={closeModal} />
      )}
    </div>
  )
}

export default AdminOrdersPage
