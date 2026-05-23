'use client'

import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import { Send, Bot, User as UserIcon } from 'lucide-react'

export default function ChatPage() {
  const [error, setError] = useState<string | null>(null)
  
  const chat = useChat({} as any) as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  const messages: any[] = chat.messages || [] /* eslint-disable-line @typescript-eslint/no-explicit-any */
  const input: string = chat.input || ''
  const handleInputChange = chat.handleInputChange
  const handleSubmit = chat.handleSubmit
  const isLoading = chat.isLoading

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Assistente AI CAF</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 bg-white rounded-t-lg shadow-sm border border-slate-200 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            <div className="text-center">
              <Bot size={48} className="mx-auto mb-4 text-slate-300" aria-hidden="true" />
              <p className="text-sm">Fai una domanda all&apos;assistente sulle normative o sulle pratiche in corso.</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900 border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                  {m.role === 'user' ? (
                    <>
                      <UserIcon size={14} aria-hidden="true" />
                      <span>Tu</span>
                    </>
                  ) : (
                    <>
                      <Bot size={14} aria-hidden="true" />
                      <span>Assistente AI</span>
                    </>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-sm">{m.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-[75%] rounded-lg px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200 text-sm flex items-center gap-2">
                <span className="animate-pulse">●</span>
                L&apos;assistente sta scrivendo...
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-b-lg shadow-sm border-x border-b border-slate-200 flex space-x-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Chiedi qualcosa..."
          className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input?.trim()}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} aria-hidden="true" />
          <span className="sr-only">Invia</span>
        </button>
      </form>
    </div>
  )
}
