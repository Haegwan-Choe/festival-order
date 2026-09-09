export type TableStatus = 'EMPTY' | 'OCCUPIED'
export type OrderItemStatus = 'PENDING_PAYMENT' | 'COOKING' | 'SERVED'

export interface DiningTable {
  id: number
  zone: string
  seatNumber: number
  status: TableStatus
  enteredAt: string | null
  gridRow: number
  gridCol: number
  groupId: number | null
}

export interface OrderItemView {
  itemId: number
  menuName: string
  quantity: number
  status: OrderItemStatus
}

export interface OrderView {
  orderId: number
  tableLabel: string
  createdAt: string
  items: OrderItemView[]
}

export function formatTableLabel(zone: string, seatNumber: number): string {
  return `${zone}-${seatNumber}`
}

export function parseTableLabel(label: string): { zone: string; seatNumber: number } | null {
  const match = /^([A-Za-z0-9]+)-(\d+)$/.exec(label)
  if (!match) return null
  return { zone: match[1], seatNumber: Number(match[2]) }
}
