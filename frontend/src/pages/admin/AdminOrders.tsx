import { OrderQueue } from '@/components/OrderQueue'
import { useOrderQueue } from '@/hooks/useOrderQueue'
import { confirmPayment } from '@/lib/adminActions'

export default function AdminOrders() {
  const { orders, loading } = useOrderQueue()

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <OrderQueue
      orders={orders}
      filterStatus={['PENDING_PAYMENT', 'COOKING', 'SERVED']}
      allowedActions={['confirmPayment']}
      onConfirmPayment={(orderId) => confirmPayment(orderId).catch((e) => alert(e.message))}
    />
  )
}
