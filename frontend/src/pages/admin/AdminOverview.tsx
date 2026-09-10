import { OrderQueue } from '@/components/OrderQueue'
import { SeatGrid } from '@/components/SeatGrid'
import { useDiningTables } from '@/hooks/useDiningTables'
import { useOrderQueue } from '@/hooks/useOrderQueue'
import { checkoutTable, confirmPayment, markServed, mergeTables, moveTable } from '@/lib/adminActions'

export default function AdminOverview() {
  const { tables, loading: tablesLoading } = useDiningTables()
  const { orders, loading: ordersLoading } = useOrderQueue()

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <section className="min-w-0 flex-1 space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">좌석 현황</h2>
        {tablesLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <SeatGrid
            tables={tables}
            onCheckout={(table) => checkoutTable(table).catch((e) => alert(e.message))}
            onMove={(table, row, col) => moveTable(table, row, col).catch((e) => alert(e.message))}
            onMerge={(tables) => mergeTables(tables).catch((e) => alert(e.message))}
          />
        )}
      </section>

      <section className="space-y-2 md:sticky md:top-6 md:h-[calc(100vh-6rem)] md:w-1/3 md:shrink-0 md:overflow-y-auto md:border-l md:pl-6">
        <h2 className="text-sm font-medium text-muted-foreground">주문 큐</h2>
        {ordersLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <OrderQueue
            orders={orders}
            filterStatus={['PENDING_PAYMENT', 'COOKING', 'SERVED']}
            allowedActions={['confirmPayment', 'markServed']}
            onConfirmPayment={(orderId) => confirmPayment(orderId).catch((e) => alert(e.message))}
            onMarkServed={(itemId) => markServed(itemId).catch((e) => alert(e.message))}
          />
        )}
      </section>
    </div>
  )
}
