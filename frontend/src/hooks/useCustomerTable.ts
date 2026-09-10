import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { DiningTable, OrderItemStatus, OrderView, TableStatus } from '@/types/domain'

interface DiningTableRow {
  id: number
  zone: string
  seat_number: number
  status: TableStatus
  entered_at: string | null
  grid_row: number
  grid_col: number
  group_id: number | null
}

interface OrderRow {
  id: number
  created_at: string
  order_item: Array<{
    id: number
    quantity: number
    status: OrderItemStatus
    served_at: string | null
    menu_item: { name: string } | null
  }>
}

// 고객 화면 전용: 특정 테이블(zone+seatNumber) 하나의 상태와 그 테이블의 주문 내역만 조회.
// MVP 범위에서는 실시간 구독 없이 진입/액션 시점마다 다시 조회한다 (project.md 5장 참고).
export function useCustomerTable(zone: string, seatNumber: number) {
  const [table, setTable] = useState<DiningTable | null>(null)
  const [orders, setOrders] = useState<OrderView[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const { data: tableRow, error: tableError } = await supabase
      .from('dining_table')
      .select('id, zone, seat_number, status, entered_at, grid_row, grid_col, group_id')
      .eq('zone', zone)
      .eq('seat_number', seatNumber)
      .maybeSingle()

    if (tableError || !tableRow) {
      console.error('failed to load dining_table', tableError)
      setTable(null)
      setOrders([])
      setLoading(false)
      return
    }

    const row = tableRow as DiningTableRow
    setTable({
      id: row.id,
      zone: row.zone,
      seatNumber: row.seat_number,
      status: row.status,
      enteredAt: row.entered_at,
      gridRow: row.grid_row,
      gridCol: row.grid_col,
      groupId: row.group_id,
    })

    const { data: orderRows, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, order_item(id, quantity, status, served_at, menu_item(name))')
      .eq('table_id', row.id)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('failed to load orders', ordersError)
    } else {
      setOrders(
        (orderRows as unknown as OrderRow[]).map((order) => ({
          orderId: order.id,
          tableLabel: `${row.zone}-${row.seat_number}`,
          createdAt: order.created_at,
          items: order.order_item.map((item) => ({
            itemId: item.id,
            menuName: item.menu_item?.name ?? '(삭제된 메뉴)',
            quantity: item.quantity,
            status: item.status,
            servedAt: item.served_at,
          })),
        })),
      )
    }

    setLoading(false)
  }, [zone, seatNumber])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { table, orders, loading, refetch }
}
