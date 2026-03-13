import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Mail, Building, Phone, MapPin, Trash2, Plus } from 'lucide-react'
import { getProfile, updateProfile } from '@/api/auth'
import { getContacts, createContact, deleteContacts } from '@/api/orders'
import useAuthStore from '@/store/authStore'
import type { Contact } from '@/types'

// Типы вкладок страницы профиля
type Tab = 'personal' | 'contacts'

// Поля формы личных данных
interface PersonalFormFields {
  first_name: string
  last_name: string
  company: string
  position: string
}

// Поля формы добавления телефона
interface PhoneFormFields {
  phone: string
}

// Поля формы добавления адреса
interface AddressFormFields {
  city: string
  street: string
  house: string
  structure: string
  building: string
  apartment: string
}

// Скелетон строки формы при загрузке
const FieldSkeleton = () => (
  <div className="space-y-1.5">
    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
  </div>
)

// Форматирование адреса контакта в читаемую строку
const formatAddress = (contact: Contact): string => {
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

// Вкладка личных данных
const PersonalTab = () => {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<PersonalFormFields>({
    values: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      company: profile?.company ?? '',
      position: profile?.position ?? '',
    },
  })

  // Мутация сохранения личных данных
  const saveMutation = useMutation({
    mutationFn: (data: PersonalFormFields) => updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Данные сохранены')
    },
    onError: () => {
      toast.error('Не удалось сохранить данные')
    },
  })

  const onSubmit = (data: PersonalFormFields) => {
    saveMutation.mutate(data)
  }

  // Метка типа аккаунта
  const accountTypeLabel = profile?.type === 'supplier' ? 'Поставщик' : 'Покупатель'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Личные данные</h2>

      {isLoading ? (
        // Скелетон загрузки
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Email — только чтение */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Email
              </span>
            </label>
            <input
              value={profile?.email ?? ''}
              readOnly
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Тип аккаунта — только чтение */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Тип аккаунта
              </span>
            </label>
            <input
              value={accountTypeLabel}
              readOnly
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Имя */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Имя *</label>
            <input
              {...register('first_name', { required: 'Введите имя' })}
              placeholder="Иван"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.first_name && (
              <p className="text-xs text-red-500">{errors.first_name.message}</p>
            )}
          </div>

          {/* Фамилия */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Фамилия</label>
            <input
              {...register('last_name')}
              placeholder="Иванов"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Компания */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                Компания
              </span>
            </label>
            <input
              {...register('company')}
              placeholder="ООО Рога и Копыта"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Должность */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Должность</label>
            <input
              {...register('position')}
              placeholder="Менеджер по закупкам"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Кнопка сохранения */}
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      )}
    </form>
  )
}

// Вкладка контактов
const ContactsTab = () => {
  const queryClient = useQueryClient()

  // Показывать/скрывать форму добавления телефона
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  // Показывать/скрывать форму добавления адреса
  const [showAddressForm, setShowAddressForm] = useState(false)

  const phoneForm = useForm<PhoneFormFields>()
  const addressForm = useForm<AddressFormFields>()

  // Загрузка контактов
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  })

  const phoneContact = contacts.find((c: Contact) => c.type === 'phone')
  const addressContacts = contacts.filter((c: Contact) => c.type === 'address')

  // Мутация удаления контакта
  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteContacts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Контакт удалён')
    },
    onError: () => {
      toast.error('Не удалось удалить контакт')
    },
  })

  // Мутация добавления телефона
  const addPhoneMutation = useMutation({
    mutationFn: (data: PhoneFormFields) =>
      createContact({ type: 'phone', phone: data.phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      phoneForm.reset()
      setShowPhoneForm(false)
      toast.success('Телефон добавлен')
    },
    onError: () => {
      toast.error('Не удалось добавить телефон')
    },
  })

  // Мутация добавления адреса
  const addAddressMutation = useMutation({
    mutationFn: (data: AddressFormFields) =>
      createContact({ type: 'address', ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      addressForm.reset()
      setShowAddressForm(false)
      toast.success('Адрес добавлен')
    },
    onError: () => {
      toast.error('Не удалось добавить адрес')
    },
  })

  const onSubmitPhone = (data: PhoneFormFields) => {
    addPhoneMutation.mutate(data)
  }

  const onSubmitAddress = (data: AddressFormFields) => {
    addAddressMutation.mutate(data)
  }

  return (
    <div className="space-y-8">
      {/* Раздел телефона */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Телефон</h2>

        {isLoading ? (
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ) : phoneContact ? (
          // Отображение существующего телефона
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 text-gray-800">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">{phoneContact.phone}</span>
            </div>
            <button
              type="button"
              onClick={() => deleteMutation.mutate([phoneContact.id])}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              title="Удалить телефон"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : showPhoneForm ? (
          // Форма добавления телефона
          <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-3">
            <div>
              <input
                {...phoneForm.register('phone', { required: 'Введите номер телефона' })}
                placeholder="+79001234567"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {phoneForm.formState.errors.phone && (
                <p className="text-xs text-red-500 mt-1">
                  {phoneForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addPhoneMutation.isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addPhoneMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => { setShowPhoneForm(false); phoneForm.reset() }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          // Кнопка показа формы
          <button
            type="button"
            onClick={() => setShowPhoneForm(true)}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить телефон
          </button>
        )}
      </section>

      {/* Разделитель */}
      <div className="border-t border-gray-100" />

      {/* Раздел адресов доставки */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Адреса доставки</h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Список существующих адресов */}
            {addressContacts.length > 0 && (
              <div className="space-y-2 mb-4">
                {addressContacts.map((contact: Contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-gray-200 bg-white gap-3"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-800 break-words">
                        {formatAddress(contact)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate([contact.id])}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors shrink-0"
                      title="Удалить адрес"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Ограничение или форма добавления */}
            {addressContacts.length >= 5 ? (
              <p className="text-sm text-gray-500 italic">Достигнут лимит 5 адресов</p>
            ) : showAddressForm ? (
              // Форма добавления нового адреса
              <form
                onSubmit={addressForm.handleSubmit(onSubmitAddress)}
                className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-700">Новый адрес</p>

                {/* Город — обязательное */}
                <div>
                  <input
                    {...addressForm.register('city', { required: 'Укажите город' })}
                    placeholder="Город *"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {addressForm.formState.errors.city && (
                    <p className="text-xs text-red-500 mt-1">
                      {addressForm.formState.errors.city.message}
                    </p>
                  )}
                </div>

                {/* Улица — обязательное */}
                <div>
                  <input
                    {...addressForm.register('street', { required: 'Укажите улицу' })}
                    placeholder="Улица *"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {addressForm.formState.errors.street && (
                    <p className="text-xs text-red-500 mt-1">
                      {addressForm.formState.errors.street.message}
                    </p>
                  )}
                </div>

                {/* Дом — обязательное */}
                <div>
                  <input
                    {...addressForm.register('house', { required: 'Укажите дом' })}
                    placeholder="Дом *"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {addressForm.formState.errors.house && (
                    <p className="text-xs text-red-500 mt-1">
                      {addressForm.formState.errors.house.message}
                    </p>
                  )}
                </div>

                {/* Необязательные поля: строение, корпус, квартира/офис */}
                <div className="grid grid-cols-3 gap-2">
                  <input
                    {...addressForm.register('structure')}
                    placeholder="Строение"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  />
                  <input
                    {...addressForm.register('building')}
                    placeholder="Корпус"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  />
                  <input
                    {...addressForm.register('apartment')}
                    placeholder="Кв./Офис"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addAddressMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addAddressMutation.isPending ? 'Сохранение...' : 'Сохранить адрес'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddressForm(false); addressForm.reset() }}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 bg-white transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              // Кнопка показа формы добавления адреса
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить адрес
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}

// Главная страница профиля с двумя вкладками
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('personal')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Заголовок страницы */}
      <div className="flex items-center gap-3 mb-6">
        <User className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
      </div>

      {/* Вкладки */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'personal'
              ? 'border-blue-600 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Личные данные
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'contacts'
              ? 'border-blue-600 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Контакты
        </button>
      </div>

      {/* Содержимое активной вкладки */}
      <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-6">
        {activeTab === 'personal' ? <PersonalTab /> : <ContactsTab />}
      </div>
    </div>
  )
}

export default ProfilePage
