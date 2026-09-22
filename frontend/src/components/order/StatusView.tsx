import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { STATUS_BLOCK_STYLE, STATUS_ICON } from '@/lib/orderStatusStyle'
import { PAYMENT_INFO } from '@/lib/paymentInfo'
import { cn } from '@/lib/utils'
import type { OrderView } from '@/types/domain'

interface StatusViewProps {
  tableLabel: string
  orders: OrderView[]
  refreshing: boolean
  onAddMore: () => void
  onRefresh: () => void
}

function formatWon(amount: number) {
  return `${amount.toLocaleString()}원`
}

function orderTotal(order: OrderView) {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function StatusView({ tableLabel, orders, refreshing, onAddMore, onRefresh }: StatusViewProps) {
  const [copied, setCopied] = useState(false)

  // 아직 입금 확인 전인 항목들의 합계 — 손님이 지금 보내야 할 금액
  const pendingTotal = orders
    .flatMap((order) => order.items)
    .filter((item) => item.status === 'PENDING_PAYMENT')
    .reduce((sum, item) => sum + item.price * item.quantity, 0)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PAYMENT_INFO.accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 API를 못 쓰는 환경이면 조용히 무시 — 계좌번호는 화면에 그대로 보이니 직접 복사하면 된다.
    }
  }

  return (
    <div className="min-h-dvh space-y-4 p-4 pb-28">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">밈천지</p>
          <h1 className="text-lg font-semibold">{tableLabel} 테이블 주문 현황</h1>
        </div>
        <Button variant="ghost" size="sm" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? '새로고침 중...' : '새로고침'}
        </Button>
      </div>

      {pendingTotal > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">🟠 입금해주세요</p>
          <p className="text-sm">
            {PAYMENT_INFO.bank} {PAYMENT_INFO.accountNumber} ({PAYMENT_INFO.holder})
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold">{formatWon(pendingTotal)}</span>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? '복사됨' : '계좌번호 복사'}
            </Button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 주문 내역이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.orderId} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>주문 내역</span>
                <span>{formatWon(orderTotal(order))}</span>
              </div>
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
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4">
        <Button className="w-full" size="lg" onClick={onAddMore}>
          메뉴 추가 주문
        </Button>
      </div>
    </div>
  )
}
