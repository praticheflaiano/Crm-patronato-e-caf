import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CAF & Patronato CRM',
  description: 'Gestione pratiche e contatti per CAF e Patronato',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-blue-600">Centro Flaiano</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              <Link href="/" className="block px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium">Dashboard</Link>
              <Link href="/contacts" className="block px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium">Contatti</Link>
              <Link href="/cases" className="block px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium">Pratiche</Link>
              <Link href="/chat" className="block px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium">Assistente AI</Link>
            </nav>
            <div className="p-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">Utente Connesso</div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
              <h2 className="text-lg font-medium">CRM System</h2>
              <div>
                {/* User menu or actions */}
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
