import { formatTableLabel, type DiningTable, type OrderView } from '@/types/domain'

// 컴포넌트 미리보기/개발용 목데이터. 실제 Supabase 연동으로 교체 예정.
// 테이블 배치는 1차 시안 기준(확정 아님) — supabase/seed.sql과 동일한 좌표.

const now = Date.now()
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString()

const LAYOUT: Array<[zone: string, seatNumber: number, gridRow: number, gridCol: number]> = [
  // A구역: 블록1(1-4 / 13-16), 블록2(5-8 / 17-20), 블록3(9-12 / 21-24)
  ['A', 1, 0, 0], ['A', 2, 0, 1], ['A', 3, 0, 2], ['A', 4, 0, 3],
  ['A', 5, 0, 5], ['A', 6, 0, 6], ['A', 7, 0, 7], ['A', 8, 0, 8],
  ['A', 9, 0, 10], ['A', 10, 0, 11], ['A', 11, 0, 12], ['A', 12, 0, 13],
  ['A', 13, 1, 0], ['A', 14, 1, 1], ['A', 15, 1, 2], ['A', 16, 1, 3],
  ['A', 17, 1, 5], ['A', 18, 1, 6], ['A', 19, 1, 7], ['A', 20, 1, 8],
  ['A', 21, 1, 10], ['A', 22, 1, 11], ['A', 23, 1, 12], ['A', 24, 1, 13],
  // B구역: 왼쪽 블록(1-4 / 9-12), 오른쪽 블록(5-8 / 13-16)
  ['B', 1, 1, 0], ['B', 2, 1, 1], ['B', 3, 1, 2], ['B', 4, 1, 3],
  ['B', 5, 1, 5], ['B', 6, 1, 6], ['B', 7, 1, 7], ['B', 8, 1, 8],
  ['B', 9, 0, 0], ['B', 10, 0, 1], ['B', 11, 0, 2], ['B', 12, 0, 3],
  ['B', 13, 0, 5], ['B', 14, 0, 6], ['B', 15, 0, 7], ['B', 16, 0, 8],
]

export const mockTables: DiningTable[] = LAYOUT.map(([zone, seatNumber, gridRow, gridCol], index) => ({
  id: index + 1,
  zone,
  seatNumber,
  status: 'EMPTY',
  enteredAt: null,
  gridRow,
  gridCol,
  groupId: null,
}))

// 데모용: 몇 자리를 사용중/합석 상태로 표시
function setTable(zone: string, seatNumber: number, patch: Partial<DiningTable>) {
  const table = mockTables.find((t) => t.zone === zone && t.seatNumber === seatNumber)
  if (table) Object.assign(table, patch)
}

setTable('A', 2, { status: 'OCCUPIED', enteredAt: minutesAgo(12), groupId: 2 }) // 합석 기준(anchor)
setTable('A', 3, { status: 'OCCUPIED', enteredAt: minutesAgo(12), groupId: 2 }) // anchor 시각을 따라감
setTable('B', 5, { status: 'OCCUPIED', enteredAt: minutesAgo(3) })

export const mockOrders: OrderView[] = [
  {
    orderId: 101,
    tableLabel: formatTableLabel('B', 5),
    createdAt: minutesAgo(2),
    items: [
      { itemId: 501, menuName: '떡볶이', quantity: 2, status: 'PENDING_PAYMENT' },
      { itemId: 502, menuName: '순대', quantity: 1, status: 'PENDING_PAYMENT' },
    ],
  },
  {
    orderId: 98,
    tableLabel: formatTableLabel('A', 3),
    createdAt: minutesAgo(20),
    items: [
      { itemId: 480, menuName: '튀김모듬', quantity: 1, status: 'COOKING' },
      { itemId: 481, menuName: '사이다', quantity: 2, status: 'SERVED' },
    ],
  },
  {
    orderId: 95,
    tableLabel: formatTableLabel('A', 2),
    createdAt: minutesAgo(35),
    items: [{ itemId: 470, menuName: '치킨', quantity: 1, status: 'COOKING' }],
  },
  {
    orderId: 90,
    tableLabel: formatTableLabel('A', 6),
    createdAt: minutesAgo(45),
    items: [{ itemId: 460, menuName: '감자튀김', quantity: 1, status: 'SERVED' }],
  },
]
