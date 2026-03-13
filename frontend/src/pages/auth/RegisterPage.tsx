import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Package, Eye, EyeOff, Loader2 } from 'lucide-react'
import { register as registerUser } from '@/api/auth'
import useAuthStore from '@/store/authStore'

// Схема валидации формы регистрации
const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен содержать не менее 8 символов'),
  first_name: z.string().min(1, 'Введите имя'),
  last_name: z.string().optional(),
  company: z.string().optional(),
  type: z.enum(['buyer', 'supplier'], {
    error: 'Выберите тип аккаунта',
  }),
})

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterPage = () => {
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
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { type: 'buyer' },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { token, user } = await registerUser(data)
      storeLogin(token, user)
      toast.success('Добро пожаловать! Проверьте email для подтверждения.')
      navigate('/', { replace: true })
    } catch (err: unknown) {
      // Обработка ошибок регистрации
      const axiosErr = err as { response?: { data?: Record<string, string[]>; status?: number } }
      if (axiosErr.response?.data) {
        const errorData = axiosErr.response.data
        // Показываем первую ошибку из ответа API
        const firstError = Object.values(errorData).flat()[0]
        if (firstError) {
          toast.error(String(firstError))
          return
        }
      }
      toast.error('Ошибка регистрации. Попробуйте позже.')
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
          <h1 className="text-2xl font-bold text-gray-900">Создать аккаунт</h1>
          <p className="text-gray-500 mt-1 text-sm">Зарегистрируйтесь в Zakupki</p>
        </div>

        {/* Карточка формы */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Поле Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Минимум 8 символов"
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

            {/* Поля Имя и Фамилия — в одну строку */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя <span className="text-red-500">*</span>
                </label>
                <input
                  id="first_name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Иван"
                  {...register('first_name')}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors outline-none
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.first_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия
                </label>
                <input
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Иванов"
                  {...register('last_name')}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                    transition-colors outline-none hover:border-gray-400
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Поле Компания */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Компания
              </label>
              <input
                id="company"
                type="text"
                autoComplete="organization"
                placeholder="ООО Ромашка"
                {...register('company')}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                  transition-colors outline-none hover:border-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Тип аккаунта */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Тип аккаунта <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Вариант Покупатель */}
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="buyer"
                    {...register('type')}
                    className="peer sr-only"
                  />
                  <div className="flex flex-col items-center justify-center py-3 px-2 rounded-lg border-2
                    border-gray-200 text-gray-600 text-sm font-medium transition-colors
                    peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700
                    hover:border-gray-300 hover:bg-gray-50">
                    <span className="text-lg mb-0.5">🛒</span>
                    Покупатель
                  </div>
                </label>

                {/* Вариант Поставщик */}
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="supplier"
                    {...register('type')}
                    className="peer sr-only"
                  />
                  <div className="flex flex-col items-center justify-center py-3 px-2 rounded-lg border-2
                    border-gray-200 text-gray-600 text-sm font-medium transition-colors
                    peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700
                    hover:border-gray-300 hover:bg-gray-50">
                    <span className="text-lg mb-0.5">📦</span>
                    Поставщик
                  </div>
                </label>
              </div>
              {errors.type && (
                <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Кнопка регистрации */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white text-sm font-medium rounded-lg transition-colors
                flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
          </form>

          {/* Ссылка на вход */}
          <p className="mt-5 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
