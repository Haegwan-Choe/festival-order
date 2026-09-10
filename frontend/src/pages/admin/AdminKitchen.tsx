import { OrderQueue } from '@/components/OrderQueue'
import { useOrderQueue } from '@/hooks/useOrderQueue'
import { markServed } from '@/lib/adminActions'

export default function AdminKitchen() {
  const { orders, loading } = useOrderQueue()

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <OrderQueue
      orders={orders}
      filterStatus={['COOKING']}
      allowedActions={['markServed']}
      onMarkServed={(itemId) => markServed(itemId).catch((e) => alert(e.message))}
    />
  )
}
