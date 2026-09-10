import type { OrderItemStatus } from '@/types/domain'

export const STATUS_ICON: Record<OrderItemStatus, string> = {
  PENDING_PAYMENT: '🟠',
  COOKING: '🔥',
  SERVED: '✅',
}

export const STATUS_BLOCK_STYLE: Record<OrderItemStatus, string> = {
  PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-900',
  COOKING: 'border-orange-200 bg-orange-50 text-orange-900',
  SERVED: 'border-emerald-200 bg-emerald-50 text-emerald-900',
}
