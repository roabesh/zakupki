import client from './client'
import type { Category, Shop, Product, ProductsResponse } from '@/types'

// Параметры фильтрации списка товаров
interface ProductFilters {
  category?: number
  shop?: number  // параметр product_infos__shop
  search?: string
  page?: number
}

// Получение списка товаров с фильтрами и пагинацией
export const getProducts = async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
  const params: Record<string, string | number> = {}
  if (filters.category) params.category = filters.category
  if (filters.shop) params['product_infos__shop'] = filters.shop
  if (filters.search) params.search = filters.search
  if (filters.page && filters.page > 1) params.page = filters.page
  const res = await client.get<ProductsResponse>('/products/', { params })
  return res.data
}

// Получение одного товара по ID
export const getProductById = async (id: number): Promise<Product> => {
  const res = await client.get<Product>(`/products/${id}/`)
  return res.data
}

// Получение списка категорий
export const getCategories = async (): Promise<Category[]> => {
  const res = await client.get<Category[]>('/categories/')
  return res.data
}

// Получение списка магазинов
export const getShops = async (): Promise<Shop[]> => {
  const res = await client.get<Shop[]>('/shops/')
  return res.data
}
