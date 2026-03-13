import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronLeft, ShoppingCart, Package } from 'lucide-react'
import { getProductById } from '@/api/products'
import { addToBasket } from '@/api/basket'
import useAuthStore from '@/store/authStore'
import { formatPrice } from '@/utils'
import type { ProductInfo } from '@/types'

// Страница детального просмотра товара
const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isBuyer } = useAuthStore()
  const queryClient = useQueryClient()

  const productId = parseInt(id ?? '0', 10)

  // Загрузка данных товара
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductById(productId),
    enabled: productId > 0,
  })

  // Мутация добавления в корзину
  const addMutation = useMutation({
    mutationFn: (productInfoId: number) => addToBasket(productInfoId, 1),
    onSuccess: () => {
      toast.success('Товар добавлен в корзину')
      queryClient.invalidateQueries({ queryKey: ['basket'] })
    },
    onError: () => {
      toast.error('Не удалось добавить товар в корзину')
    },
  })

  // Обработчик кнопки "В корзину" для конкретной позиции товара
  const handleAddToCart = (info: ProductInfo) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!isBuyer) {
      toast.error('Только покупатели могут добавлять товары в корзину')
      return
    }
    addMutation.mutate(info.id)
  }

  // Скелетон загрузки
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-6" />
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-5 bg-gray-200 rounded-full w-28 mb-8" />
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Состояние ошибки (товар не найден)
  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <ChevronLeft size={16} />
          Каталог
        </Link>
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Товар не найден</h2>
          <p className="text-gray-500 text-sm">
            Возможно, товар был удалён или введён неверный адрес
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться в каталог
          </Link>
        </div>
      </div>
    )
  }

  // Сбор всех уникальных характеристик из всех product_infos
  const allParameters = product.product_infos.length > 0
    ? product.product_infos[0].product_parameters
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Ссылка назад в каталог */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Каталог
      </Link>

      {/* Заголовок и бейдж категории */}
      <div className="mb-6">
        <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-3">
          {product.category.name}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
          {product.name}
        </h1>
      </div>

      {/* Таблица наличия по магазинам */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Наличие в магазинах</h2>
        </div>

        {product.product_infos.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            Нет в наличии ни в одном магазине
          </div>
        ) : (
          <>
            {/* Заголовки таблицы (скрыты на мобильном) */}
            <div className="hidden sm:grid sm:grid-cols-4 gap-4 px-5 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div>Магазин</div>
              <div>Цена</div>
              <div>В наличии</div>
              <div />
            </div>

            {/* Строки таблицы */}
            {product.product_infos.map((info) => (
              <div
                key={info.id}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 px-5 py-4 border-t border-gray-100 hover:bg-gray-50 transition-colors items-center"
              >
                {/* Название магазина */}
                <div>
                  <span className="font-medium text-gray-900 text-sm">{info.shop}</span>
                  {info.model && (
                    <div className="text-xs text-gray-400 mt-0.5">Модель: {info.model}</div>
                  )}
                </div>

                {/* Цена */}
                <div>
                  <div className="text-base font-bold text-gray-900">
                    {formatPrice(info.price)}
                  </div>
                  {info.price_rrc !== info.price && (
                    <div className="text-xs text-gray-400 line-through">
                      РРЦ: {formatPrice(info.price_rrc)}
                    </div>
                  )}
                </div>

                {/* Количество */}
                <div>
                  <span className={`text-sm ${info.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {info.quantity > 0 ? `${info.quantity} шт.` : 'Нет в наличии'}
                  </span>
                </div>

                {/* Кнопка "В корзину" */}
                <div className="flex justify-start sm:justify-end">
                  {isBuyer !== false && (
                    <button
                      onClick={() => handleAddToCart(info)}
                      disabled={addMutation.isPending || info.quantity === 0}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={15} />
                      В корзину
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Характеристики товара */}
      {allParameters.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Характеристики</h2>
          </div>
          <table className="w-full">
            <tbody>
              {allParameters.map((param, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-5 py-3 text-sm text-gray-500 w-1/2">
                    {param.parameter}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 w-1/2">
                    {param.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
