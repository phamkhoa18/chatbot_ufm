'use client'

import { toast } from 'sonner'

export const showToast = {
  success(message: string, description?: string) {
    toast.success(message, { description, duration: 3000 })
  },
  error(message: string, description?: string) {
    toast.error(message, { description, duration: 5000 })
  },
  warning(message: string, description?: string) {
    toast.warning(message, { description, duration: 4000 })
  },
  info(message: string, description?: string) {
    toast.info(message, { description, duration: 3000 })
  },
  promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string | ((err: any) => string) }
  ) {
    return toast.promise(promise, messages)
  },
  dismiss() {
    toast.dismiss()
  },
}
