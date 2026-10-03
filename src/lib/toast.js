let toastId = 0
export const listeners = new Set()
export let toasts = []

export function notify(updates) {
  toasts = updates
  listeners.forEach((fn) => fn(toasts))
}

export function toast(message, type = 'info', duration = 4000) {
  const id = ++toastId

  let resolvedDuration = duration
  if (typeof duration === 'object' && duration !== null) {
    resolvedDuration = typeof duration.autoClose === 'number' ? duration.autoClose : 4000
  }

  const newToast = { id, message, type, duration: resolvedDuration }
  notify([...toasts, newToast])

  if (resolvedDuration > 0) {
    setTimeout(() => {
      notify(toasts.filter((t) => t.id !== id))
    }, resolvedDuration)
  }

  return id
}

toast.success = (msg, duration) => toast(msg, 'success', duration)
toast.error = (msg, duration) => toast(msg, 'error', duration)
toast.warning = (msg, duration) => toast(msg, 'warning', duration)
toast.info = (msg, duration) => toast(msg, 'info', duration)
