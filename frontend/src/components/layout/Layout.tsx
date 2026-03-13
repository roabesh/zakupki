import { Outlet } from 'react-router-dom'
import Header from './Header'
import { Toaster } from 'react-hot-toast'

// Базовый layout: шапка + контент + тосты
const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { style: { background: '#22c55e' } },
          error: { style: { background: '#ef4444' } },
        }}
      />
    </div>
  )
}

export default Layout
