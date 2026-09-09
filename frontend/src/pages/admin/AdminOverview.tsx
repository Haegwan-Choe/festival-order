import { OrderQueue } from '@/components/OrderQueue'
import { SeatGrid } from '@/components/SeatGrid'
import { mockOrders, mockTables } from '@/lib/mockData'

export default function AdminOverview() {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <section className="min-w-0 flex-1 space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">좌석 현황</h2>
        <SeatGrid
          tables={mockTables}
          onCheckout={(table) => console.log('checkout', table)}
          onMove={(table, row, col) => console.log('move', table, row, col)}
          onMerge={(tables) => console.log('merge', tables)}
        />
      </section>

      <section className="space-y-2 md:sticky md:top-6 md:h-[calc(100vh-6rem)] md:w-1/3 md:shrink-0 md:overflow-y-auto md:border-l md:pl-6">
        <h2 className="text-sm font-medium text-muted-foreground">주문 큐</h2>
        <OrderQueue
          orders={mockOrders}
          filterStatus={['PENDING_PAYMENT', 'COOKING', 'SERVED']}
          allowedActions={['confirmPayment', 'markServed']}
          onConfirmPayment={(orderId) => console.log('confirmPayment', orderId)}
          onMarkServed={(itemId) => console.log('markServed', itemId)}
        />
      </section>
    </div>
  )
}
