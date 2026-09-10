import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatTableLabel, type OrderItemStatus, type OrderView } from '@/types/domain'

interface OrderRow {
  id: number
  created_at: string
  dining_table: { zone: string; seat_number: number } | null
  order_item: Array<{
    id: number
    quantity: number
    status: OrderItemStatus
    served_at: string | null
    menu_item: { name: string } | null
  }>
}

function mapRow(row: OrderRow): OrderView | null {
  if (!row.dining_table) return null

  return {
    orderId: row.id,
    tableLabel: formatTableLabel(row.dining_table.zone, row.dining_table.seat_number),
    createdAt: row.created_at,
    items: row.order_item.map((item) => ({
      itemId: item.id,
      menuName: item.menu_item?.name ?? '(삭제된 메뉴)',
      quantity: item.quantity,
      status: item.status,
      servedAt: item.served_at,
    })),
  }
}

export function useOrderQueue() {
  const [orders, setOrders] = useState<OrderView[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, created_at, dining_table(zone, seat_number), order_item(id, quantity, status, served_at, menu_item(name))',
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('failed to load orders', error)
    } else {
      setOrders((data as unknown as OrderRow[]).map(mapRow).filter((o): o is OrderView => o !== null))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()

    const channel = supabase
      .channel('order_queue_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_item' }, () => refetch())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch])

  return { orders, loading, refetch }
}
