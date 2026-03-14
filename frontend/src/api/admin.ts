import client from './client'
import type { Order, OrderState } from '@/types'

// Получить все заказы (кроме корзины)
export const getAllOrders = async (): Promise<Order[]> => {
  const res = await client.get<Order[]>('/admin/orders/')
  return res.data
}

// Изменить статус заказа
export const changeOrderStatus = async (orderId: number, state: OrderState): Promise<Order> => {
  const res = await client.put<Order>('/admin/order/', { id: orderId, state })
  return res.data
}
