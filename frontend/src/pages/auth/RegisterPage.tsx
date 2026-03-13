import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'

// Страница регистрации (полная реализация — Этап 2)
const RegisterPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Package size={40} className="mx-auto text-primary-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-center text-gray-400">Форма регистрации — Этап 2</p>
          <div className="mt-4 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
