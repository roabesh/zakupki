import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Download, ShoppingBag, Store } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPartnerState, updatePartnerState, exportPrice, getPartnerOrders } from '@/api/partner'

// Карточка навигации в кабинете партнёра
interface NavCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  badge?: React.ReactNode
}

const NavCard = ({ icon, title, description, onClick, badge }: NavCardProps) => (
  <button
    onClick={onClick}
    className="flex items-start gap-4 w-full rounded-xl border border-gray-200 bg-white p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
  >
    <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary-50 text-primary-600">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {badge}
      </div>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
  </button>
)

// Кабинет партнёра (поставщика)
const PartnerDashboard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Запрос текущего статуса приёма заказов
  const { data: partnerState, isLoading } = useQuery({
    queryKey: ['partnerState'],
    queryFn: getPartnerState,
  })

  // Загружаем заказы для подсчёта новых
  const { data: partnerOrders } = useQuery({
    queryKey: ['partnerOrders'],
    queryFn: getPartnerOrders,
  })

  // Число заказов в статусе "new" (требуют действия)
  const newOrdersCount = (partnerOrders ?? []).filter((o) => o.state === 'new').length

  // Мутация для обновления статуса
  const toggleMutation = useMutation({
    mutationFn: (newState: boolean) => updatePartnerState(newState),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partnerState'] })
      toast.success(
        data.state ? 'Вы начали принимать заказы' : 'Приём заказов остановлен'
      )
    },
    onError: () => {
      toast.error('Не удалось изменить статус')
    },
  })

  // Переключение статуса приёма заказов
  const handleToggle = () => {
    if (partnerState === undefined) return
    toggleMutation.mutate(!partnerState.state)
  }

  // Скачивание прайса в формате YAML
  const handleExport = async () => {
    try {
      const blob = await exportPrice()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'price.yaml'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Файл скачан')
    } catch {
      toast.error('Не удалось скачать файл')
    }
  }

  const state = partnerState?.state ?? false

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-8">
        <Store className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Кабинет партнёра</h1>
      </div>

      {/* Блок переключения статуса */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Статус магазина
        </h2>

        {isLoading ? (
          // Скелетон загрузки статуса
          <div className="flex items-center gap-4 animate-pulse">
            <div className="h-7 w-14 rounded-full bg-gray-200" />
            <div className="h-5 bg-gray-200 rounded w-40" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Переключатель */}
            <button
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 ${
                state ? 'bg-green-500' : 'bg-gray-300'
              }`}
              aria-label={state ? 'Выключить приём заказов' : 'Включить приём заказов'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  state ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>

            {/* Подпись статуса */}
            <span className={`text-base font-medium ${state ? 'text-green-700' : 'text-gray-500'}`}>
              {state ? 'Принимаю заказы' : 'Не принимаю заказы'}
            </span>
          </div>
        )}
      </div>

      {/* Навигационные карточки */}
      <div className="grid gap-4">
        <NavCard
          icon={<Upload className="w-5 h-5" />}
          title="Загрузить прайс"
          description="Импортировать товары по URL или из YAML-файла"
          onClick={() => navigate('/partner/upload')}
        />
        <NavCard
          icon={<ShoppingBag className="w-5 h-5" />}
          title="Заказы покупателей"
          description="Просмотр заказов, поступивших в ваш магазин"
          onClick={() => navigate('/partner/orders')}
          badge={
            newOrdersCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                {newOrdersCount} новых
              </span>
            ) : undefined
          }
        />
        <NavCard
          icon={<Download className="w-5 h-5" />}
          title="Экспорт прайса"
          description="Скачать текущий прайс-лист в формате YAML"
          onClick={handleExport}
        />
      </div>
    </div>
  )
}

export default PartnerDashboard
