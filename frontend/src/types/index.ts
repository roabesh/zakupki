// Типы данных API

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company: string
  position: string
  type: 'buyer' | 'supplier'
  is_staff?: boolean
}

export interface Contact {
  id: number
  type: 'phone' | 'address'
  phone: string
  city: string
  street: string
  house: string
  structure: string
  building: string
  apartment: string
}

export interface Category {
  id: number
  name: string
  product_count?: number
}

export interface Shop {
  id: number
  name: string
  state: boolean
}

export interface ProductParameter {
  parameter: string
  value: string
}

export interface ProductInfo {
  id: number
  shop: string
  model: string
  external_id: number
  quantity: number
  price: string
  price_rrc: string
  product_parameters: ProductParameter[]
}

export interface Product {
  id: number
  name: string
  category: Category
  product_infos: ProductInfo[]
}

export interface ProductsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Product[]
}

export interface OrderItem {
  id: number
  product_info: ProductInfo & { product?: { name: string } }
  quantity: number
}

export type OrderState =
  | 'basket'
  | 'new'
  | 'confirmed'
  | 'assembled'
  | 'sent'
  | 'partially_sent'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: number
  state: OrderState
  created_at: string
  contact: Contact | null
  order_items: OrderItem[]
  total_sum: string
  // Статусы по каждому поставщику: {shop_name: state}
  shop_states?: Record<string, string>
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name?: string
  last_name?: string
  company?: string
  position?: string
  type: 'buyer' | 'supplier'
}

export interface AuthResponse {
  token: string
  status?: string
}

export interface PartnerState {
  state: boolean
}

export interface ImportResult {
  status: string
  shop?: string
  created?: number
  updated?: number
  task_id?: string
}
