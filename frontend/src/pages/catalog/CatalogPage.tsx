import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import type { ProductsResponse } from '@/types'
import { formatPrice, getMinPrice } from '@/utils'
import { ShoppingCart, Package } from 'lucide-react'

// Главная страница: каталог товаров
const CatalogPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await client.get<ProductsResponse>('/products/')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-3 bg-gray-200 rounded mb-2 w-1/2" />
              <div className="h-6 bg-gray-200 rounded mt-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-red-600">
        Не удалось загрузить каталог. Убедитесь что backend запущен.
      </div>
    )
  }

  const products = data?.results ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Каталог товаров</h1>
        <p className="text-gray-500 mt-1">{data?.count ?? 0} товаров</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Товары не найдены</p>
          <p className="text-gray-400 text-sm mt-1">
            Загрузите прайс через кабинет поставщика
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {product.category.name}
                </span>
                <span className="text-xs text-gray-400">
                  {product.product_infos.length} маг.
                </span>
              </div>
              <h3 className="font-medium text-gray-900 text-sm leading-snug mb-3 line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(getMinPrice(product.product_infos))}
                </span>
                <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CatalogPage
