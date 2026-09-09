import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrderItemStatus, OrderView } from '@/types/domain'

type OrderQueueAction = 'confirmPayment' | 'markServed'

interface OrderQueueProps {
  orders: OrderView[]
  filterStatus: OrderItemStatus[]
  allowedActions: OrderQueueAction[]
  onConfirmPayment?: (orderId: number) => void
  onMarkServed?: (itemId: number) => void
}

const STATUS_ICON: Record<OrderItemStatus, string> = {
  PENDING_PAYMENT: '🟠',
  COOKING: '🔥',
  SERVED: '✅',
}

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
  const visibleOrders = orders
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
              <CardTitle className="text-base">{order.tableNumber}번 테이블</CardTitle>
              <span className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {order.items.map((item) => (
                  <li key={item.itemId} className="flex items-center justify-between text-sm">
                    <span>
                      {STATUS_ICON[item.status]} {item.menuName} x{item.quantity}
                    </span>
                    {allowedActions.includes('markServed') && item.status === 'COOKING' && (
                      <Button size="sm" variant="outline" onClick={() => onMarkServed?.(item.itemId)}>
                        조리완료
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {allowedActions.includes('confirmPayment') && hasPending && (
                <Button size="sm" onClick={() => onConfirmPayment?.(order.orderId)}>
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
