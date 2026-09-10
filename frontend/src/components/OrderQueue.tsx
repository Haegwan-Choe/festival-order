import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { STATUS_BLOCK_STYLE, STATUS_ICON } from '@/lib/orderStatusStyle'
import type { OrderItemStatus, OrderView } from '@/types/domain'

type OrderQueueAction = 'confirmPayment' | 'markServed'

interface OrderQueueProps {
  orders: OrderView[]
  filterStatus: OrderItemStatus[]
  allowedActions: OrderQueueAction[]
  onConfirmPayment?: (orderId: number) => void
  onMarkServed?: (itemId: number) => void
}

const HIDE_AFTER_SERVED_MS = 3 * 60_000

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function OrderQueue({
  orders,
  filterStatus,
  allowedActions,
  onConfirmPayment,
  onMarkServed,
}: OrderQueueProps) {
  // 브라우저 로컬 타이머 대신 서버에 기록된 served_at을 기준으로 계산 —
  // 그래야 새로고침하거나 다른 화면으로 갔다 와도 "완료된 지 얼마나 됐는지"가 유지된다.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000)
    return () => clearInterval(id)
  }, [])

  function isFullyServedAndExpired(order: OrderView) {
    if (order.items.length === 0 || !order.items.every((item) => item.status === 'SERVED')) return false
    const servedTimes = order.items.map((item) => (item.servedAt ? new Date(item.servedAt).getTime() : 0))
    const lastServedAt = Math.max(...servedTimes)
    if (!lastServedAt) return false
    return now - lastServedAt > HIDE_AFTER_SERVED_MS
  }

  const visibleOrders = orders
    .filter((order) => !isFullyServedAndExpired(order))
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => filterStatus.includes(item.status)),
    }))
    .filter((order) => order.items.length > 0)
    .sort((a, b) => {
      const aPending = a.items.some((item) => item.status === 'PENDING_PAYMENT')
      const bPending = b.items.some((item) => item.status === 'PENDING_PAYMENT')
      if (aPending !== bPending) return aPending ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  if (visibleOrders.length === 0) {
    return <p className="text-sm text-muted-foreground">표시할 주문이 없습니다.</p>
  }

  return (
    <div className="space-y-3">
      {visibleOrders.map((order) => {
        const hasPending = order.items.some((item) => item.status === 'PENDING_PAYMENT')

        return (
          <Card key={order.orderId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{order.tableLabel} 테이블</CardTitle>
              <span className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {order.items.map((item) => (
                  <li
                    key={item.itemId}
                    className={cn(
                      'flex items-center justify-between rounded-md border px-3 py-2 text-sm',
                      STATUS_BLOCK_STYLE[item.status],
                    )}
                  >
                    <span>
                      {STATUS_ICON[item.status]} {item.menuName} x{item.quantity}
                    </span>
                    {allowedActions.includes('markServed') && item.status === 'COOKING' && (
                      <Button size="lg" variant="outline" onClick={() => onMarkServed?.(item.itemId)}>
                        조리완료
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {allowedActions.includes('confirmPayment') && hasPending && (
                <Button size="lg" className="w-full" onClick={() => onConfirmPayment?.(order.orderId)}>
                  입금 확인
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
