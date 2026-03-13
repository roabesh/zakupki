import client from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

// Авторизация пользователя
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await client.post<AuthResponse>('/user/login/', data)
  return res.data
}

// Регистрация нового пользователя
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const res = await client.post<AuthResponse>('/user/register/', data)
  return res.data
}

// Получение профиля текущего пользователя
export const getProfile = async (): Promise<User> => {
  const res = await client.get<User>('/user/details/')
  return res.data
}

// Обновление профиля
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const res = await client.put<User>('/user/details/', data)
  return res.data
}
