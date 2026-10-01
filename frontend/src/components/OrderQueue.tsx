import { Trash2, X } from 'lucide-react'
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

type OrderQueueAction = 'confirmPayment' | 'markServed' | 'dismissOrder' | 'cancelPending'

interface OrderQueueProps {
  orders: OrderView[]
  filterStatus: OrderItemStatus[]
  allowedActions: OrderQueueAction[]
  onConfirmPayment?: (orderId: number) => void | Promise<void>
  onMarkServed?: (itemId: number) => void | Promise<void>
  onDismissOrder?: (orderId: number) => void | Promise<void>
  /** 입금 확인 전 주문 전체 취소 */
  onCancelOrder?: (orderId: number) => void | Promise<void>
  /** 입금 확인 전 메뉴 한 줄 취소 */
  onCancelOrderItem?: (itemId: number) => void | Promise<void>
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
  onCancelOrder,
  onCancelOrderItem,
  showTotal = false,
  size = 'default',
}: OrderQueueProps) {
  const large = size === 'lg'
  // 브라우저 로컬 타이머 대신 서버에 기록된 served_at을 기준으로 계산 —
  // 그래야 새로고침하거나 다른 화면으로 갔다 와도 "완료된 지 얼마나 됐는지"가 유지된다.
  const [now, setNow] = useState(() => Date.now())
  const [pendingDismiss, setPendingDismiss] = useState<{ orderId: number; tableLabel: string } | null>(null)
  const [pendingCancel, setPendingCancel] = useState<
    | { kind: 'order'; orderId: number; tableLabel: string }
    | { kind: 'item'; itemId: number; tableLabel: string; menuName: string; quantity: number }
    | null
  >(null)
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
        const canCancel = allowedActions.includes('cancelPending') && hasPending
        const orderBusy = pendingOrderIds.has(order.orderId)

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
                    {canCancel && item.status === 'PENDING_PAYMENT' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="이 메뉴 취소"
                        disabled={orderBusy || pendingItemIds.has(item.itemId)}
                        onClick={() =>
                          setPendingCancel({
                            kind: 'item',
                            itemId: item.itemId,
                            tableLabel: order.tableLabel,
                            menuName: item.menuName,
                            quantity: item.quantity,
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
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
              {(allowedActions.includes('confirmPayment') || canCancel) && hasPending && (
                <div className="flex gap-2">
                  {canCancel && (
                    <Button
                      size="lg"
                      variant="destructive"
                      disabled={orderBusy}
                      onClick={() =>
                        setPendingCancel({ kind: 'order', orderId: order.orderId, tableLabel: order.tableLabel })
                      }
                    >
                      주문 취소
                    </Button>
                  )}
                  {allowedActions.includes('confirmPayment') && (
                    <Button
                      size="lg"
                      className="flex-1"
                      disabled={orderBusy}
                      onClick={() => runOnce(order.orderId, pendingOrderIds, setPendingOrderIds, onConfirmPayment)}
                    >
                      {orderBusy ? '처리 중...' : '입금 확인'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <AlertDialog open={pendingCancel !== null} onOpenChange={(open) => !open && setPendingCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCancel?.kind === 'item'
                ? `${pendingCancel.tableLabel} 테이블의 "${pendingCancel.menuName} x${pendingCancel.quantity}"를 취소할까요?`
                : `${pendingCancel?.tableLabel} 테이블 주문을 취소할까요?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCancel?.kind === 'order'
                ? '입금 확인 전 주문이 통째로 삭제되고 손님 화면에서도 사라집니다. 되돌릴 수 없어요.'
                : '이 메뉴만 주문에서 삭제됩니다. 마지막 메뉴였다면 주문 자체가 삭제돼요. 되돌릴 수 없어요.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingCancel?.kind === 'order') {
                  runOnce(pendingCancel.orderId, pendingOrderIds, setPendingOrderIds, onCancelOrder)
                } else if (pendingCancel?.kind === 'item') {
                  runOnce(pendingCancel.itemId, pendingItemIds, setPendingItemIds, onCancelOrderItem)
                }
                setPendingCancel(null)
              }}
            >
              취소하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
