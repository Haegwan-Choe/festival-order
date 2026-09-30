import { MenuDemandSidebar } from '@/components/admin/MenuDemandSidebar'
import { OrderQueue } from '@/components/OrderQueue'
import { useMenu } from '@/hooks/useMenu'
import { useOrderQueue } from '@/hooks/useOrderQueue'
import { markServed } from '@/lib/adminActions'

export default function AdminKitchen() {
  const { orders, loading: ordersLoading } = useOrderQueue()
  const { menu, loading: menuLoading } = useMenu()

  if (ordersLoading || menuLoading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <OrderQueue
          orders={orders}
          filterStatus={['COOKING']}
          allowedActions={['markServed']}
          size="lg"
          onMarkServed={(itemId) => markServed(itemId).catch((e) => alert(e.message))}
        />
      </div>
      <div className="w-full shrink-0 lg:w-72">
        <MenuDemandSidebar menu={menu} orders={orders} />
      </div>
    </div>
  )
}
