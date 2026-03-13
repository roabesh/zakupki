import client from './client'

// Добавление товара в корзину по ID позиции товара
export const addToBasket = async (productInfoId: number, quantity = 1): Promise<void> => {
  await client.post('/basket/', { items: [{ product_info: productInfoId, quantity }] })
}

// Получение содержимого корзины
export const getBasket = async () => {
  const res = await client.get('/basket/')
  return res.data
}

// Обновление количества товара в корзине
export const updateBasketItem = async (itemId: number, quantity: number): Promise<void> => {
  await client.put('/basket/', { items: [{ id: itemId, quantity }] })
}

// Удаление товаров из корзины по массиву ID
export const removeFromBasket = async (itemIds: number[]): Promise<void> => {
  await client.delete('/basket/', { data: { items: itemIds } })
}
