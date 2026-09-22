import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type OrderLogEntry, useOrderLog } from '@/hooks/useOrderLog'
import { formatTableLabel } from '@/types/domain'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const won = (amount: number) => `${amount.toLocaleString()}원`

export function CheckoutLog() {
  const { entries, loading, refetch } = useOrderLog()

  // 같은 테이블이 같은 시각에 퇴석한 주문들을 하나의 "이용 기록"으로 묶는다.
  const sessions = new Map<string, OrderLogEntry[]>()
  for (const entry of entries) {
    const key = `${entry.zone}-${entry.seatNumber}|${entry.checkedOutAt}`
    sessions.set(key, [...(sessions.get(key) ?? []), entry])
  }

  const paidTotal = entries.filter((e) => e.paymentConfirmed).reduce((sum, e) => sum + e.totalAmount, 0)
  const unpaidTotal = entries.filter((e) => !e.paymentConfirmed).reduce((sum, e) => sum + e.totalAmount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <p>
            입금확인 매출 합계 <span className="font-semibold">{won(paidTotal)}</span>
          </p>
          {unpaidTotal > 0 && (
            <p className="text-muted-foreground">입금 미확인 상태로 퇴석한 주문 {won(unpaidTotal)}</p>
          )}
        </div>
        <Button variant="outline" disabled={loading} onClick={refetch}>
          {loading ? '불러오는 중...' : '새로고침'}
        </Button>
      </div>

      {!loading && sessions.size === 0 && (
        <p className="text-sm text-muted-foreground">퇴석 기록이 없습니다.</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...sessions.entries()].map(([key, group]) => {
          const first = group[0]
          const sessionTotal = group.reduce((sum, e) => sum + e.totalAmount, 0)
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{formatTableLabel(first.zone, first.seatNumber)} 테이블</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {first.tableEnteredAt ? `${formatTime(first.tableEnteredAt)} ~ ` : ''}
                  {formatDateTime(first.checkedOutAt)} 퇴석
                </span>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2">
                  {group.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <span className="mr-2 text-xs text-muted-foreground">{formatTime(entry.orderedAt)}</span>
                      {entry.items.map((item) => `${item.menu_name} x${item.quantity}`).join(', ')}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {won(entry.totalAmount)}
                        {!entry.paymentConfirmed && ' · 입금 미확인'}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="border-t pt-2 text-right text-sm font-semibold">합계 {won(sessionTotal)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
