export type TableStatus = 'EMPTY' | 'OCCUPIED'
export type OrderItemStatus = 'PENDING_PAYMENT' | 'COOKING' | 'SERVED'

export interface DiningTable {
  id: number
  tableNumber: number
  status: TableStatus
  enteredAt: string | null
}

export interface OrderItemView {
  itemId: number
  menuName: string
  quantity: number
  status: OrderItemStatus
}

export interface OrderView {
  orderId: number
  tableNumber: number
  createdAt: string
  items: OrderItemView[]
}
