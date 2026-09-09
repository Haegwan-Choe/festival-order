import { OrderQueue } from '@/components/OrderQueue'
import { mockOrders } from '@/lib/mockData'

export default function AdminKitchen() {
  return (
    <div className="min-h-dvh space-y-4 p-6">
      <h1 className="text-lg font-semibold">주방</h1>
      <OrderQueue
        orders={mockOrders}
        filterStatus={['COOKING']}
        allowedActions={['markServed']}
        onMarkServed={(itemId) => console.log('markServed', itemId)}
      />
    </div>
  )
}
