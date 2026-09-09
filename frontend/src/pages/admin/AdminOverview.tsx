import { OrderQueue } from '@/components/OrderQueue'
import { SeatGrid } from '@/components/SeatGrid'
import { mockOrders, mockTables } from '@/lib/mockData'

export default function AdminOverview() {
  return (
    <div className="min-h-dvh space-y-6 p-6">
      <h1 className="text-lg font-semibold">총괄</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr]">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">좌석 현황</h2>
          <SeatGrid tables={mockTables} onTableClick={(table) => console.log('checkout?', table)} />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">주문 큐</h2>
          <OrderQueue
            orders={mockOrders}
            filterStatus={['PENDING_PAYMENT', 'COOKING']}
            allowedActions={['confirmPayment', 'markServed']}
            onConfirmPayment={(orderId) => console.log('confirmPayment', orderId)}
            onMarkServed={(itemId) => console.log('markServed', itemId)}
          />
        </section>
      </div>
    </div>
  )
}
