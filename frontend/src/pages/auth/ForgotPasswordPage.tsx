import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { forgotPassword } from '@/api/auth'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
})

type FormData = z.infer<typeof schema>

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
    } catch {
      // Намеренно не раскрываем существование аккаунта — показываем общую ошибку
      setError('email', { message: 'Не удалось отправить письмо. Попробуйте позже.' })
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Успешная отправка */}
        {sent ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
              <MailCheck size={28} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Письмо отправлено</h1>
            <p className="text-gray-500 text-sm mb-1">
              Мы отправили инструкции по восстановлению на
            </p>
            <p className="text-gray-800 font-medium text-sm mb-6">{sentEmail}</p>
            <p className="text-gray-400 text-xs mb-6">
              Если письмо не пришло — проверьте папку «Спам» или попробуйте снова.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-blue-600 text-sm hover:underline"
            >
              Попробовать другой email
            </button>
          </div>
        ) : (
          <>
            {/* Заголовок */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-4">
                <Package size={28} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Восстановление пароля</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Введите email — пришлём ссылку для сброса
              </p>
            </div>

            {/* Форма */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                      ${errors.email
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
                  {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={14} />
                  Вернуться ко входу
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
