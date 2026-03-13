import type { OrderState } from '@/types'

// Форматирование цены в рублях
export const formatPrice = (price: string | number): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(num)
}

// Форматирование даты
export const formatDate = (dateStr: string): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

// Название и цвет статуса заказа
export const orderStateConfig: Record<
  Exclude<OrderState, 'basket'>,
  { label: string; color: string; bg: string }
> = {
  new:       { label: 'Новый',        color: 'text-blue-700',   bg: 'bg-blue-100' },
  confirmed: { label: 'Подтверждён',  color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  assembled: { label: 'Собран',       color: 'text-yellow-700', bg: 'bg-yellow-100' },
  sent:      { label: 'Отправлен',    color: 'text-orange-700', bg: 'bg-orange-100' },
  delivered: { label: 'Доставлен',    color: 'text-green-700',  bg: 'bg-green-100' },
  cancelled: { label: 'Отменён',      color: 'text-red-700',    bg: 'bg-red-100' },
}

// Минимальная цена товара среди всех магазинов
export const getMinPrice = (productInfos: { price: string }[]): string => {
  if (!productInfos.length) return '0'
  const prices = productInfos.map((pi) => parseFloat(pi.price))
  return Math.min(...prices).toString()
}
