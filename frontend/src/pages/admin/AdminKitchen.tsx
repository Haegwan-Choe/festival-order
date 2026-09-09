import { OrderQueue } from '@/components/OrderQueue'
import { mockOrders } from '@/lib/mockData'

export default function AdminKitchen() {
  return (
    <OrderQueue
      orders={mockOrders}
      filterStatus={['COOKING']}
      allowedActions={['markServed']}
      onMarkServed={(itemId) => console.log('markServed', itemId)}
    />
  )
}
