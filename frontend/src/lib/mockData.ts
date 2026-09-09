import type { DiningTable, OrderView } from '@/types/domain'

// 컴포넌트 미리보기/개발용 목데이터. 실제 Supabase 연동으로 교체 예정.

const now = Date.now()
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString()

export const mockTables: DiningTable[] = [
  { id: 1, tableNumber: 1, status: 'EMPTY', enteredAt: null },
  { id: 2, tableNumber: 2, status: 'OCCUPIED', enteredAt: minutesAgo(12) },
  { id: 3, tableNumber: 3, status: 'OCCUPIED', enteredAt: minutesAgo(75) },
  { id: 4, tableNumber: 4, status: 'EMPTY', enteredAt: null },
  { id: 5, tableNumber: 5, status: 'OCCUPIED', enteredAt: minutesAgo(3) },
  { id: 6, tableNumber: 6, status: 'EMPTY', enteredAt: null },
]

export const mockOrders: OrderView[] = [
  {
    orderId: 101,
    tableNumber: 5,
    createdAt: minutesAgo(2),
    items: [
      { itemId: 501, menuName: '떡볶이', quantity: 2, status: 'PENDING_PAYMENT' },
      { itemId: 502, menuName: '순대', quantity: 1, status: 'PENDING_PAYMENT' },
    ],
  },
  {
    orderId: 98,
    tableNumber: 3,
    createdAt: minutesAgo(20),
    items: [
      { itemId: 480, menuName: '튀김모듬', quantity: 1, status: 'COOKING' },
      { itemId: 481, menuName: '사이다', quantity: 2, status: 'SERVED' },
    ],
  },
  {
    orderId: 95,
    tableNumber: 2,
    createdAt: minutesAgo(35),
    items: [{ itemId: 470, menuName: '치킨', quantity: 1, status: 'COOKING' }],
  },
]
