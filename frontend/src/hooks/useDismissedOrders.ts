import { useCallback, useEffect, useState } from 'react'
import { mapOrderRows, ORDER_SELECT } from '@/lib/orderQuery'
import { supabase } from '@/lib/supabaseClient'
import type { OrderView } from '@/types/domain'

// "주문 내역" 탭 전용: X로 지운 주문만, 탭을 열 때(또는 새로고침 버튼) 한 번 조회한다.
// 실시간 구독은 하지 않는다.
export function useDismissedOrders() {
  const [orders, setOrders] = useState<OrderView[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .not('dismissed_at', 'is', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('failed to load dismissed orders', error)
    } else {
      setOrders(mapOrderRows(data))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { orders, loading, refetch }
}
