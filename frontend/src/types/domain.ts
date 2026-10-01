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

// 구역 표시 순서 = 현장 배치 순서 (C구역은 A와 B 사이에 있음). 여기 없는 구역은 뒤에 알파벳순.
export const ZONE_ORDER = ['A', 'C', 'B']

export function compareZones(a: string, b: string): number {
  const rank = (zone: string) => {
    const index = ZONE_ORDER.indexOf(zone)
    return index === -1 ? ZONE_ORDER.length : index
  }
  return rank(a) - rank(b) || a.localeCompare(b)
}

export function parseTableLabel(label: string): { zone: string; seatNumber: number } | null {
  const match = /^([A-Za-z0-9]+)-(\d+)$/.exec(label)
  if (!match) return null
  return { zone: match[1], seatNumber: Number(match[2]) }
}
