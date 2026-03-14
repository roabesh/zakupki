import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Package, Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from '@/api/auth'
import useAuthStore from '@/store/authStore'

// Схема валидации формы входа
const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage = () => {
  const navigate = useNavigate()
  const { login: storeLogin, isAuthenticated } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  // Если уже авторизован — перенаправляем на главную
  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { token, user } = await login(data)
      storeLogin(token, user)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      // Обработка ошибок авторизации
      const axiosErr = err as { response?: { status?: number } }
      // Backend возвращает 400 при неверных учётных данных
      const s = axiosErr.response?.status
      if (s === 400 || s === 401 || s === 403) {
        toast.error('Неверный email или пароль')
      } else {
        toast.error('Ошибка входа. Попробуйте позже.')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-4">
            <Package size={28} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Войти в Zakupki</h1>
          <p className="text-gray-500 mt-1 text-sm">Введите ваши данные для входа</p>
        </div>

        {/* Карточка формы */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Поле Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors outline-none
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Поле Пароль */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Пароль
                </label>
                <a href="#" className="text-xs text-blue-600 hover:underline">
                  Забыли пароль?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                />
                {/* Кнопка показа/скрытия пароля */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white text-sm font-medium rounded-lg transition-colors
                flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <p className="mt-5 text-center text-sm text-gray-600">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
