import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Package, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '@/api/auth'

const schema = z
  .object({
    password: z.string().min(8, 'Минимум 8 символов'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Пароли не совпадают',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Нет токена в URL — показываем ошибку
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ссылка недействительна</h1>
          <p className="text-gray-500 text-sm mb-4">
            Ссылка для сброса пароля повреждена или устарела.
          </p>
          <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword(token, data.password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch {
      toast.error('Ссылка устарела или уже использована. Запросите новую.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Успешный сброс */}
        {done ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Пароль изменён</h1>
            <p className="text-gray-500 text-sm mb-4">
              Перенаправляем на страницу входа…
            </p>
            <Link to="/login" className="text-blue-600 hover:underline text-sm">
              Войти сейчас
            </Link>
          </div>
        ) : (
          <>
            {/* Заголовок */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-4">
                <Package size={28} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Новый пароль</h1>
              <p className="text-gray-500 mt-1 text-sm">Введите новый пароль для вашего аккаунта</p>
            </div>

            {/* Форма */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* Новый пароль */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${errors.password
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-300 bg-white hover:border-gray-400'}`}
                    />
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

                {/* Подтверждение пароля */}
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register('confirm')}
                      className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${errors.confirm
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-300 bg-white hover:border-gray-400'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                    text-white text-sm font-medium rounded-lg transition-colors
                    flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
