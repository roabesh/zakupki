import client from './client'
import type { Order, Contact } from '@/types'

// Получение корзины текущего пользователя
export const getBasket = async (): Promise<Order> => {
  const res = await client.get('/basket/')
  return res.data
}

// Добавление товара в корзину по ID позиции товара
export const addToBasket = async (productInfoId: number, quantity = 1): Promise<void> => {
  await client.post('/basket/', { items: [{ product_info: productInfoId, quantity }] })
}

// Обновление количества позиции в корзине
export const updateBasketItem = async (itemId: number, quantity: number): Promise<void> => {
  await client.put('/basket/', { items: [{ id: itemId, quantity }] })
}

// Удаление позиций из корзины по массиву ID
export const removeFromBasket = async (itemIds: number[]): Promise<void> => {
  await client.delete('/basket/', { data: { items: itemIds } })
}

// Получение всех заказов (исключая корзину)
export const getOrders = async (): Promise<Order[]> => {
  const res = await client.get('/orders/')
  return res.data
}

// Получение заказа по ID
export const getOrderById = async (id: number): Promise<Order> => {
  const res = await client.get(`/orders/${id}/`)
  return res.data
}

// Подтверждение заказа с указанным контактом для доставки
export const confirmOrder = async (contactId: number): Promise<Order> => {
  const res = await client.post('/orders/', { contact: contactId })
  return res.data
}

// Получение списка контактов пользователя
export const getContacts = async (): Promise<Contact[]> => {
  const res = await client.get('/user/contact/')
  return res.data
}

// Создание нового контакта
export const createContact = async (data: Partial<Contact>): Promise<Contact> => {
  const res = await client.post('/user/contact/', data)
  return res.data
}

// Удаление контактов по массиву ID
export const deleteContacts = async (ids: number[]): Promise<void> => {
  await client.delete('/user/contact/', { data: { items: ids } })
}
