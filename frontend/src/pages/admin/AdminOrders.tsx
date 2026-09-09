import { OrderQueue } from '@/components/OrderQueue'
import { mockOrders } from '@/lib/mockData'

export default function AdminOrders() {
  return (
    <OrderQueue
      orders={mockOrders}
      filterStatus={['PENDING_PAYMENT', 'COOKING']}
      allowedActions={['confirmPayment']}
      onConfirmPayment={(orderId) => console.log('confirmPayment', orderId)}
    />
  )
}
