import { OrderQueue } from '@/components/OrderQueue'
import { mockOrders } from '@/lib/mockData'

export default function AdminOrders() {
  return (
    <div className="min-h-dvh space-y-4 p-6">
      <h1 className="text-lg font-semibold">주문받는 서버</h1>
      <OrderQueue
        orders={mockOrders}
        filterStatus={['PENDING_PAYMENT', 'COOKING']}
        allowedActions={['confirmPayment']}
        onConfirmPayment={(orderId) => console.log('confirmPayment', orderId)}
      />
    </div>
  )
}
