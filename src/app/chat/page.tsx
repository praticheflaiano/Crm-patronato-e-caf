'use client'

import { useChat } from '@ai-sdk/react'
import { Send, Bot, User as UserIcon, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ChatPart = { type: string; text?: string }
type ChatMessage = { id: string; role: string; parts?: ChatPart[] }

// Conversation history is persisted in localStorage so it survives navigating
// away from the page or reloading. It is per-browser only (no server storage),
// which keeps potentially sensitive case context off the backend.
const STORAGE_KEY = 'caf-assistant-chat-v1'

// AI SDK v6 messages carry their text in a `parts` array rather than a single
// `content` string; concatenate the text parts for display.
function messageText(message: ChatMessage): string {
  if (!Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')
}

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : []
  } catch {
    return []
  }
}

export default function ChatPage() {
  // Read the saved history once, before the chat hook initializes, so it seeds
  // the initial messages. useState initializer runs only on the first render.
  const [initialMessages] = useState<ChatMessage[]>(() => loadStoredMessages())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages, sendMessage, status, error, setMessages } = useChat({ messages: initialMessages as any })
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const isLoading = status === 'submitted' || status === 'streaming'
  const errorMessage = error?.message || null

  // Persist the conversation whenever it settles (not mid-stream), so reloads
  // and navigation restore the full exchange.
  useEffect(() => {
    if (isLoading) return
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      }
    } catch {
      // Storage may be unavailable (private mode / quota); degrade gracefully.
    }
  }, [messages, isLoading])

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInput('')
  }

  function handleClear() {
    setMessages([])
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col md:h-[calc(100dvh-8rem)]">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Assistente AI CAF</h1>
          <p className="mt-1 text-sm text-slate-500">Supporto operativo su pratiche, documenti e normative.</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Trash2 size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Nuova chat</span>
          </button>
        )}
      </div>

      {errorMessage && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>}

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-t-lg border border-slate-200 bg-white p-3 shadow-sm sm:space-y-4 sm:p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-slate-500">
            <div className="text-center">
              <Bot size={48} className="mx-auto mb-4 text-slate-300" aria-hidden="true" />
              <p className="text-sm">Fai una domanda all&apos;assistente sulle normative o sulle pratiche in corso.</p>
            </div>
          </div>
        ) : messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-lg px-3 py-2.5 sm:max-w-[75%] sm:px-4 sm:py-3 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-slate-100 text-slate-900'}`}>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                {m.role === 'user' ? <><UserIcon size={14} aria-hidden="true" /><span>Tu</span></> : <><Bot size={14} aria-hidden="true" /><span>Assistente AI</span></>}
              </div>
              <div className="whitespace-pre-wrap break-words text-sm">{messageText(m)}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[92%] items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 sm:max-w-[75%] sm:px-4 sm:py-3">
              <span className="animate-pulse">●</span>
              L&apos;assistente sta scrivendo...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 rounded-b-lg border-x border-b border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-sm sm:p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chiedi qualcosa..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-0 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:px-4"
        >
          <Send size={16} aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Invia</span>
        </button>
      </form>
    </div>
  )
}
