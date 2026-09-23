import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { STATUS_BLOCK_STYLE, STATUS_ICON } from '@/lib/orderStatusStyle'
import type { OrderItemStatus, OrderView } from '@/types/domain'

type OrderQueueAction = 'confirmPayment' | 'markServed' | 'dismissOrder'

interface OrderQueueProps {
  orders: OrderView[]
  filterStatus: OrderItemStatus[]
  allowedActions: OrderQueueAction[]
  onConfirmPayment?: (orderId: number) => void | Promise<void>
  onMarkServed?: (itemId: number) => void | Promise<void>
  onDismissOrder?: (orderId: number) => void | Promise<void>
  /** 카드에 메뉴 합산 금액을 표시할지 여부 (서빙/총괄 화면용) */
  showTotal?: boolean
  /** 노트북/태블릿처럼 넓은 화면에서 크게 보여줄 때 (주방 화면용) */
  size?: 'default' | 'lg'
}

const HIDE_AFTER_SERVED_MS = 3 * 60_000

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function formatWon(amount: number) {
  return `${amount.toLocaleString()}원`
}

export function OrderQueue({
  orders,
  filterStatus,
  allowedActions,
  onConfirmPayment,
  onMarkServed,
  onDismissOrder,
  showTotal = false,
  size = 'default',
}: OrderQueueProps) {
  const large = size === 'lg'
  // 브라우저 로컬 타이머 대신 서버에 기록된 served_at을 기준으로 계산 —
  // 그래야 새로고침하거나 다른 화면으로 갔다 와도 "완료된 지 얼마나 됐는지"가 유지된다.
  const [now, setNow] = useState(() => Date.now())
  const [pendingDismiss, setPendingDismiss] = useState<{ orderId: number; tableLabel: string } | null>(null)
  // 연타 방지: 요청이 진행 중인 항목/주문 id를 담아뒀다가 버튼을 잠시 비활성화한다.
  const [pendingItemIds, setPendingItemIds] = useState<Set<number>>(new Set())
  const [pendingOrderIds, setPendingOrderIds] = useState<Set<number>>(new Set())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000)
    return () => clearInterval(id)
  }, [])

  function runOnce(id: number, pendingIds: Set<number>, setPendingIds: typeof setPendingItemIds, action?: (id: number) => void | Promise<void>) {
    if (!action || pendingIds.has(id)) return
    setPendingIds((prev) => new Set(prev).add(id))
    Promise.resolve(action(id)).finally(() => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    })
  }

  function isFullyServed(order: OrderView) {
    return order.items.length > 0 && order.items.every((item) => item.status === 'SERVED')
  }

  function isFullyServedAndExpired(order: OrderView) {
    if (!isFullyServed(order)) return false
    const servedTimes = order.items.map((item) => (item.servedAt ? new Date(item.servedAt).getTime() : 0))
    const lastServedAt = Math.max(...servedTimes)
    if (!lastServedAt) return false
    return now - lastServedAt > HIDE_AFTER_SERVED_MS
  }

  const visibleOrders = orders
    .filter((order) => order.dismissedAt === null && !isFullyServedAndExpired(order))
    .map((order) => ({
      ...order,
      fullyServed: isFullyServed(order),
      items: order.items.filter((item) => filterStatus.includes(item.status)),
    }))
    .filter((order) => order.items.length > 0)
    .sort((a, b) => {
      const aPending = a.items.some((item) => item.status === 'PENDING_PAYMENT')
      const bPending = b.items.some((item) => item.status === 'PENDING_PAYMENT')
      if (aPending !== bPending) return aPending ? -1 : 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

  if (visibleOrders.length === 0) {
    return <p className="text-sm text-muted-foreground">표시할 주문이 없습니다.</p>
  }

  return (
    <div className={cn(large ? 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3' : 'space-y-3')}>
      {visibleOrders.map((order) => {
        const hasPending = order.items.some((item) => item.status === 'PENDING_PAYMENT')
        const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

        return (
          <Card key={order.orderId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={cn(large && 'text-2xl')}>{order.tableLabel} 테이블</CardTitle>
              <div className="flex items-center gap-2">
                {showTotal && (
                  <span className="text-sm font-semibold">{formatWon(orderTotal)}</span>
                )}
                <span className={cn('text-xs text-muted-foreground', large && 'text-sm')}>
                  {formatTime(order.createdAt)}
                </span>
                {allowedActions.includes('dismissOrder') && order.fullyServed && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="목록에서 지우기"
                    onClick={() => setPendingDismiss({ orderId: order.orderId, tableLabel: order.tableLabel })}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {order.items.map((item) => (
                  <li
                    key={item.itemId}
                    className={cn(
                      'flex items-center justify-between rounded-md border px-3 py-2 text-sm',
                      large && 'px-4 py-3 text-xl',
                      STATUS_BLOCK_STYLE[item.status],
                    )}
                  >
                    <span>
                      {STATUS_ICON[item.status]} {item.menuName} x{item.quantity}
                    </span>
                    {allowedActions.includes('markServed') && item.status === 'COOKING' && (
                      <Button
                        size="lg"
                        variant="outline"
                        className={cn(large && 'h-12 px-5 text-lg')}
                        disabled={pendingItemIds.has(item.itemId)}
                        onClick={() => runOnce(item.itemId, pendingItemIds, setPendingItemIds, onMarkServed)}
                      >
                        {pendingItemIds.has(item.itemId) ? '처리 중...' : '조리완료'}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {allowedActions.includes('confirmPayment') && hasPending && (
                <Button
                  size="lg"
                  className="w-full"
                  disabled={pendingOrderIds.has(order.orderId)}
                  onClick={() => runOnce(order.orderId, pendingOrderIds, setPendingOrderIds, onConfirmPayment)}
                >
                  {pendingOrderIds.has(order.orderId) ? '처리 중...' : '입금 확인'}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}

      <AlertDialog open={pendingDismiss !== null} onOpenChange={(open) => !open && setPendingDismiss(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingDismiss?.tableLabel} 테이블 주문을 목록에서 지울까요?</AlertDialogTitle>
            <AlertDialogDescription>
              모든 화면의 주문 목록에서 사라집니다. 주문 기록 자체는 퇴석 처리 전까지 남아있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDismiss) onDismissOrder?.(pendingDismiss.orderId)
                setPendingDismiss(null)
              }}
            >
              지우기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
