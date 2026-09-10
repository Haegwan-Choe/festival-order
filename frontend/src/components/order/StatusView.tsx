import { Button } from '@/components/ui/button'
import { STATUS_BLOCK_STYLE, STATUS_ICON } from '@/lib/orderStatusStyle'
import { cn } from '@/lib/utils'
import type { OrderView } from '@/types/domain'

interface StatusViewProps {
  tableLabel: string
  orders: OrderView[]
  refreshing: boolean
  onAddMore: () => void
  onRefresh: () => void
}

export function StatusView({ tableLabel, orders, refreshing, onAddMore, onRefresh }: StatusViewProps) {
  const items = orders.flatMap((order) => order.items)

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

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 주문 내역이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
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
      )}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4">
        <Button className="w-full" size="lg" onClick={onAddMore}>
          메뉴 추가 주문
        </Button>
      </div>
    </div>
  )
}
