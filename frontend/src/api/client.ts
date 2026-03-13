import axios from 'axios'

// Базовый URL API
const API_BASE = '/api/v1'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Интерсептор запросов: добавляет Token в заголовок
client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Token ${token}`
      }
    } catch {
      // Токен не найден — запрос без авторизации
    }
  }
  return config
})

// Интерсептор ответов: при 401 очищаем хранилище
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
