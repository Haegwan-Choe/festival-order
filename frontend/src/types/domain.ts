export type TableStatus = 'EMPTY' | 'OCCUPIED'
export type TableType = 'NORMAL' | 'DURA'
export type OrderItemStatus = 'PENDING_PAYMENT' | 'COOKING' | 'SERVED'

export interface DiningTable {
  id: number
  zone: string
  seatNumber: number
  status: TableStatus
  tableType: TableType
  enteredAt: string | null
  gridRow: number
  gridCol: number
  groupId: number | null
}

export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  available: boolean
  imageUrl: string | null
}

export interface OrderItemView {
  itemId: number
  menuName: string
  price: number
  quantity: number
  status: OrderItemStatus
  servedAt: string | null
}

export interface OrderView {
  orderId: number
  tableLabel: string
  createdAt: string
  dismissedAt: string | null
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
