'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, { ring: string; icon: React.ReactNode }> = {
  success: { ring: 'ring-emerald-200', icon: <CheckCircle2 size={18} className="text-emerald-600" aria-hidden="true" /> },
  error: { ring: 'ring-red-200', icon: <XCircle size={18} className="text-red-600" aria-hidden="true" /> },
  warning: { ring: 'ring-amber-200', icon: <AlertTriangle size={18} className="text-amber-600" aria-hidden="true" /> },
  info: { ring: 'ring-blue-200', icon: <Info size={18} className="text-blue-600" aria-hidden="true" /> },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, variant }])
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:left-auto sm:right-4 sm:top-auto sm:items-end"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const style = variantStyles[toast.variant]

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg ring-1 ring-inset ${style.ring}`}
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <p className="min-w-0 flex-1 break-words text-sm font-medium text-slate-800">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Chiudi notifica"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve essere usato dentro <ToastProvider>')
  }
  return context.toast
}
