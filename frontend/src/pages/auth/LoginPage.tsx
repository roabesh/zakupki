import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'

// Страница входа (полная реализация — Этап 2)
const LoginPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Package size={40} className="mx-auto text-primary-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Войти в Zakupki</h1>
          <p className="text-gray-500 mt-2">Введите ваши данные для входа</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-center text-gray-400">Форма входа — Этап 2</p>
          <div className="mt-4 text-center text-sm text-gray-600">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-primary-600 hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
