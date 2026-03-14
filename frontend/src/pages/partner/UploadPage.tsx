import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, ArrowLeft, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { importPriceByUrl, importPriceByFile } from '@/api/partner'

// Типы вкладок
type Tab = 'url' | 'file'

// Форматирование размера файла
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

// Страница загрузки прайса партнёра
const UploadPage = () => {
  const navigate = useNavigate()

  // Активная вкладка
  const [activeTab, setActiveTab] = useState<Tab>('url')

  // Состояние вкладки "По URL"
  const [url, setUrl] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)

  // Состояние вкладки "Загрузить файл"
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)

  // Ссылка на скрытый input для выбора файла
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Обработка отправки по URL
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      toast.error('Введите URL прайса')
      return
    }

    setUrlLoading(true)
    try {
      const result = await importPriceByUrl(trimmed)
      if (result.task_id) {
        // Асинхронный импорт (202)
        toast.success('Импорт запущен! Товары появятся в каталоге в течение минуты.')
      } else {
        // Синхронный импорт (200)
        toast.success(
          `Импортировано: ${result.created} новых, ${result.updated} обновлено`
        )
      }
      setUrl('')
    } catch {
      toast.error('Не удалось выполнить импорт по URL')
    } finally {
      setUrlLoading(false)
    }
  }

  // Проверка допустимого расширения файла
  const isValidFile = (file: File): boolean => {
    return file.name.endsWith('.yaml') || file.name.endsWith('.yml')
  }

  // Выбор файла через диалог
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isValidFile(file)) {
      toast.error('Допустимы только файлы .yaml и .yml')
      return
    }
    setSelectedFile(file)
  }

  // Открытие диалога выбора файла
  const handleZoneClick = () => {
    fileInputRef.current?.click()
  }

  // Обработчики drag-and-drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!isValidFile(file)) {
      toast.error('Допустимы только файлы .yaml и .yml')
      return
    }
    setSelectedFile(file)
  }, [])

  // Загрузка файла на сервер
  const handleFileUpload = async () => {
    if (!selectedFile) return

    setFileLoading(true)
    try {
      const result = await importPriceByFile(selectedFile)
      toast.success(
        `Успешно! Магазин: ${result.shop}. Создано: ${result.created}, обновлено: ${result.updated}`
      )
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      toast.error('Не удалось загрузить файл')
    } finally {
      setFileLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/partner')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Назад"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <UploadCloud className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Загрузить прайс</h1>
      </div>

      {/* Вкладки */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-6">
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          По URL
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'file'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Загрузить файл
        </button>
      </div>

      {/* Содержимое вкладки "По URL" */}
      {activeTab === 'url' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="price-url"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Ссылка на прайс-лист
              </label>
              <input
                id="price-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/price.yaml"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={urlLoading || !url.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {urlLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Загружается...
                </>
              ) : (
                'Загрузить'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Содержимое вкладки "Загрузить файл" */}
      {activeTab === 'file' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          {/* Зона drag-and-drop */}
          <div
            onClick={handleZoneClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }`}
          >
            {/* Скрытый input для выбора файла */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileChange}
              className="hidden"
            />

            <UploadCloud
              className={`w-10 h-10 mx-auto mb-3 ${
                isDragOver
                  ? 'text-blue-400'
                  : selectedFile
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`}
            />

            {isDragOver ? (
              <p className="text-blue-600 font-medium">Отпустите файл</p>
            ) : selectedFile ? (
              <div>
                <p className="text-green-700 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 font-medium">
                  Перетащите YAML-файл или нажмите для выбора
                </p>
                <p className="text-sm text-gray-400 mt-1">Поддерживаются .yaml и .yml</p>
              </div>
            )}
          </div>

          {/* Кнопка загрузки файла */}
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || fileLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {fileLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Загружается...
              </>
            ) : (
              'Загрузить прайс'
            )}
          </button>

          {/* Пример формата файла */}
          <div className="flex gap-2.5 rounded-lg bg-blue-50 border border-blue-100 p-3.5">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Формат файла: YAML. Структура:</p>
              <pre className="font-mono text-xs bg-blue-100 rounded p-2 whitespace-pre-wrap">
{`shop: Название магазина
categories:
  - id: 1
    name: Категория
goods:
  - id: 1
    category: 1
    model: Название модели
    name: Название товара
    price: 1000
    price_rrc: 1200
    quantity: 10
    parameters:
      Параметр: Значение`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadPage
