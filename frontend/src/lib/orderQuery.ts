import { formatTableLabel, type OrderItemStatus, type OrderView } from '@/types/domain'

export const ORDER_SELECT =
  'id, created_at, dismissed_at, dining_table(zone, seat_number), order_item(id, quantity, status, served_at, menu_item(name, price))'

interface OrderRow {
  id: number
  created_at: string
  dismissed_at: string | null
  dining_table: { zone: string; seat_number: number } | null
  order_item: Array<{
    id: number
    quantity: number
    status: OrderItemStatus
    served_at: string | null
    menu_item: { name: string; price: number } | null
  }>
}

function mapOrderRow(row: OrderRow): OrderView | null {
  if (!row.dining_table) return null

  return {
    orderId: row.id,
    tableLabel: formatTableLabel(row.dining_table.zone, row.dining_table.seat_number),
    createdAt: row.created_at,
    dismissedAt: row.dismissed_at,
    items: row.order_item.map((item) => ({
      itemId: item.id,
      menuName: item.menu_item?.name ?? '(삭제된 메뉴)',
      price: item.menu_item?.price ?? 0,
      quantity: item.quantity,
      status: item.status,
      servedAt: item.served_at,
    })),
  }
}

export function mapOrderRows(data: unknown): OrderView[] {
  return (data as OrderRow[]).map(mapOrderRow).filter((order): order is OrderView => order !== null)
}
