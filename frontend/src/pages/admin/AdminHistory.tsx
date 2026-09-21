import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDismissedOrders } from '@/hooks/useDismissedOrders'
import type { OrderView } from '@/types/domain'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminHistory() {
  const { orders, loading, refetch } = useDismissedOrders()

  const byTable = new Map<string, OrderView[]>()
  for (const order of orders) {
    byTable.set(order.tableLabel, [...(byTable.get(order.tableLabel) ?? []), order])
  }
  const tableLabels = [...byTable.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          목록에서 지운 주문 (퇴석 처리 전까지 테이블별로 보관)
        </h2>
        <Button variant="outline" disabled={loading} onClick={refetch}>
          {loading ? '불러오는 중...' : '새로고침'}
        </Button>
      </div>

      {!loading && tableLabels.length === 0 && (
        <p className="text-sm text-muted-foreground">지운 주문이 없습니다.</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tableLabels.map((label) => {
          const tableOrders = byTable.get(label) ?? []
          return (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{label} 테이블</CardTitle>
                <span className="text-xs text-muted-foreground">주문 {tableOrders.length}건</span>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tableOrders.map((order) => (
                    <li key={order.orderId} className="text-sm">
                      <span className="mr-2 text-xs text-muted-foreground">{formatTime(order.createdAt)}</span>
                      {order.items.map((item) => `${item.menuName} x${item.quantity}`).join(', ')}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
