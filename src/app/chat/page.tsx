'use client'

import { useChat } from '@ai-sdk/react'

export default function ChatPage() {
  const chat = useChat({} as any  ) as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  const messages: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ = chat.messages || []
  const input: string = chat.input || ''
  const handleInputChange = chat.handleInputChange
  const handleSubmit = chat.handleSubmit
  const isLoading = chat.isLoading

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assistente AI CAF</h1>
      </div>

      <div className="flex-1 bg-white rounded-t-lg shadow-sm border border-gray-200 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Fai una domanda all&apos;assistente sulle normative o sulle pratiche in corso.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {m.role === 'user' ? 'Tu' : 'Assistente AI'}
                </div>
                <div className="whitespace-pre-wrap text-sm">{m.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-[75%] rounded-lg px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 text-sm">
                L&apos;assistente sta scrivendo...
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-b-lg shadow-sm border-x border-b border-gray-200 flex space-x-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Chiedi qualcosa..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input?.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Invia
        </button>
      </form>
    </div>
  )
}
