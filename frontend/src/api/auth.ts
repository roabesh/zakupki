import client from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

// Авторизация пользователя — возвращает токен и профиль
export const login = async (data: LoginRequest): Promise<{ token: string; user: User }> => {
  const res = await client.post<AuthResponse>('/user/login/', data)
  const token = res.data.token
  // Временно устанавливаем токен для следующего запроса профиля
  const profile = await client.get<User>('/user/details/', {
    headers: { Authorization: `Token ${token}` },
  })
  return { token, user: profile.data }
}

// Регистрация нового пользователя — возвращает токен и профиль
export const register = async (data: RegisterRequest): Promise<{ token: string; user: User }> => {
  const res = await client.post<AuthResponse>('/user/register/', data)
  const token = res.data.token
  // Временно устанавливаем токен для следующего запроса профиля
  const profile = await client.get<User>('/user/details/', {
    headers: { Authorization: `Token ${token}` },
  })
  return { token, user: profile.data }
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
