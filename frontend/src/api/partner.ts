import client from './client'
import type { PartnerState, ImportResult, Order } from '@/types'

// Получить статус приёма заказов партнёром
export const getPartnerState = async (): Promise<PartnerState> => {
  const res = await client.get<PartnerState>('/partner/state/')
  return res.data
}

// Обновить статус приёма заказов партнёром
export const updatePartnerState = async (state: boolean): Promise<PartnerState> => {
  const res = await client.put<PartnerState>('/partner/state/', { state })
  return res.data
}

// Импорт прайса по URL
export const importPriceByUrl = async (url: string): Promise<ImportResult> => {
  const res = await client.post<ImportResult>('/partner/update/', { url })
  return res.data
}

// Импорт прайса через загрузку файла (multipart/form-data)
export const importPriceByFile = async (file: File): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post<ImportResult>('/partner/update/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// Экспорт прайса — возвращает blob для скачивания
export const exportPrice = async (): Promise<Blob> => {
  const res = await client.get('/partner/export/', { responseType: 'blob' })
  return res.data
}

// Получить заказы партнёра
export const getPartnerOrders = async (): Promise<Order[]> => {
  const res = await client.get<Order[]>('/partner/orders/')
  return res.data
}

// Изменить статус заказа партнёром
export const updatePartnerOrderStatus = async (id: number, state: string): Promise<Order> => {
  const res = await client.put<Order>('/partner/orders/', { id, state })
  return res.data
}

// Получить детали одного заказа партнёра
export const getPartnerOrderById = async (id: number): Promise<Order> => {
  const res = await client.get<Order>(`/partner/orders/${id}/`)
  return res.data
}
