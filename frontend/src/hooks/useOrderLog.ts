import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface LoggedItem {
  menu_name: string
  price: number
  quantity: number
  status: string
  served_at: string | null
}

export interface OrderLogEntry {
  id: number
  zone: string
  seatNumber: number
  tableEnteredAt: string | null
  checkedOutAt: string
  orderId: number
  orderedAt: string
  paymentConfirmed: boolean
  items: LoggedItem[]
  totalAmount: number
}

interface OrderLogRow {
  id: number
  zone: string
  seat_number: number
  table_entered_at: string | null
  checked_out_at: string
  order_id: number
  ordered_at: string
  payment_confirmed: boolean
  items: LoggedItem[]
  total_amount: number
}

// 퇴석 기록(order_log) 조회 — 관리자만 RLS로 조회 가능. 조회는 이 훅이 마운트될 때(탭을 열 때)
// 또는 새로고침 시에만 한다.
export function useOrderLog() {
  const [entries, setEntries] = useState<OrderLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('order_log')
      .select('*')
      .order('checked_out_at', { ascending: false })
      .order('order_id', { ascending: true })

    if (error) {
      console.error('failed to load order_log', error)
    } else {
      setEntries(
        (data as OrderLogRow[]).map((row) => ({
          id: row.id,
          zone: row.zone,
          seatNumber: row.seat_number,
          tableEnteredAt: row.table_entered_at,
          checkedOutAt: row.checked_out_at,
          orderId: row.order_id,
          orderedAt: row.ordered_at,
          paymentConfirmed: row.payment_confirmed,
          items: row.items,
          totalAmount: row.total_amount,
        })),
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { entries, loading, refetch }
}
