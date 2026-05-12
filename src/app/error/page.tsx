import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
        <h2 className="text-3xl font-extrabold text-red-600">
          Oops!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Si è verificato un errore durante l&apos;autenticazione. Le credenziali potrebbero essere errate oppure c&apos;è un problema di connessione col server.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Torna al Login
          </Link>
        </div>
      </div>
    </div>
  )
}
