import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ChevronLeft, MapPin, Plus } from 'lucide-react'
import { getBasket, getContacts, createContact, confirmOrder } from '@/api/orders'
import { formatPrice } from '@/utils'
import type { Contact } from '@/types'

// Поля формы нового адреса
interface AddressFormFields {
  city: string
  street: string
  house: string
  structure: string
  building: string
  apartment: string
}

// Страница оформления заказа
const CheckoutPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ID выбранного контакта доставки
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)
  // Показывать/скрывать форму нового адреса
  const [showAddressForm, setShowAddressForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormFields>()

  // Загрузка корзины
  const { data: basket, isLoading: basketLoading } = useQuery({
    queryKey: ['basket'],
    queryFn: getBasket,
  })

  // Загрузка контактов (только тип address)
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  })

  const addressContacts = contacts.filter((c: Contact) => c.type === 'address')

  // Мутация создания нового адреса
  const createContactMutation = useMutation({
    mutationFn: (data: Partial<Contact>) => createContact(data),
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setSelectedContactId(newContact.id)
      setShowAddressForm(false)
      reset()
      toast.success('Адрес добавлен')
    },
    onError: () => {
      toast.error('Не удалось добавить адрес')
    },
  })

  // Мутация подтверждения заказа
  const confirmMutation = useMutation({
    mutationFn: (contactId: number) => confirmOrder(contactId),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['basket'] })
      toast.success('Заказ оформлен! Ожидайте письмо.')
      navigate(`/orders/${order.id}`)
    },
    onError: () => {
      toast.error('Не удалось оформить заказ')
    },
  })

  const handleAddAddress = (data: AddressFormFields) => {
    createContactMutation.mutate({ type: 'address', ...data })
  }

  const handleConfirmOrder = () => {
    if (!selectedContactId) return
    confirmMutation.mutate(selectedContactId)
  }

  // Форматирование адреса контакта в строку
  const formatAddress = (contact: Contact) => {
    const parts = [
      contact.city,
      contact.street,
      contact.house && `д. ${contact.house}`,
      contact.structure && `стр. ${contact.structure}`,
      contact.building && `корп. ${contact.building}`,
      contact.apartment && `кв. ${contact.apartment}`,
    ].filter(Boolean)
    return parts.join(', ')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Навигация назад */}
      <Link
        to="/basket"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Корзина
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Оформление заказа</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка: адрес доставки */}
        <div className="flex-1 space-y-4">
          {/* Блок выбора адреса */}
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Адрес доставки</h2>
            </div>

            {contactsLoading ? (
              // Скелетон загрузки адресов
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : addressContacts.length === 0 && !showAddressForm ? (
              <p className="text-sm text-gray-500 mb-3">Нет сохранённых адресов</p>
            ) : (
              // Список адресов с радиокнопками
              <div className="space-y-2 mb-3">
                {addressContacts.map((contact: Contact) => (
                  <label
                    key={contact.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedContactId === contact.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contact"
                      value={contact.id}
                      checked={selectedContactId === contact.id}
                      onChange={() => setSelectedContactId(contact.id)}
                      className="mt-0.5 accent-primary-600"
                    />
                    <span className="text-sm text-gray-700">{formatAddress(contact)}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Кнопка/форма добавления нового адреса */}
            {!showAddressForm ? (
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Добавить новый адрес
              </button>
            ) : (
              <form onSubmit={handleSubmit(handleAddAddress)} className="space-y-3 mt-2">
                <p className="text-sm font-medium text-gray-700">Новый адрес</p>

                {/* Город — обязательное */}
                <div>
                  <input
                    {...register('city', { required: 'Укажите город' })}
                    placeholder="Город *"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                  )}
                </div>

                {/* Улица — обязательное */}
                <div>
                  <input
                    {...register('street', { required: 'Укажите улицу' })}
                    placeholder="Улица *"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.street && (
                    <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>
                  )}
                </div>

                {/* Дом — обязательное */}
                <div>
                  <input
                    {...register('house', { required: 'Укажите дом' })}
                    placeholder="Дом *"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.house && (
                    <p className="text-xs text-red-500 mt-1">{errors.house.message}</p>
                  )}
                </div>

                {/* Необязательные поля */}
                <div className="grid grid-cols-3 gap-2">
                  <input
                    {...register('structure')}
                    placeholder="Строение"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    {...register('building')}
                    placeholder="Корпус"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    {...register('apartment')}
                    placeholder="Кв./Офис"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createContactMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createContactMutation.isPending ? 'Сохранение...' : 'Сохранить адрес'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddressForm(false); reset() }}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Правая колонка: состав заказа и кнопка */}
        <div className="lg:w-80 shrink-0 space-y-4">
          {/* Состав заказа */}
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Состав заказа</h2>
            {basketLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : basket?.order_items && basket.order_items.length > 0 ? (
              <>
                <ul className="space-y-2 mb-3">
                  {basket.order_items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm text-gray-700">
                      <span className="truncate mr-2">
                        {item.product_info.product?.name ?? item.product_info.model}
                        {' '}
                        <span className="text-gray-400">× {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium">
                        {formatPrice(parseFloat(item.product_info.price_rrc) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Итого</span>
                  <span>{formatPrice(parseFloat(basket.total_sum))}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Корзина пуста</p>
            )}
          </div>

          {/* Кнопка подтверждения */}
          <button
            onClick={handleConfirmOrder}
            disabled={!selectedContactId || confirmMutation.isPending || basketLoading}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {confirmMutation.isPending ? 'Оформление...' : 'Подтвердить заказ'}
          </button>
          {!selectedContactId && (
            <p className="text-xs text-center text-gray-400">Выберите адрес доставки</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
