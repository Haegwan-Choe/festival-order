import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CartView } from '@/components/order/CartView'
import { EntryView } from '@/components/order/EntryView'
import { MenuView } from '@/components/order/MenuView'
import { StatusView } from '@/components/order/StatusView'
import { useCustomerTable } from '@/hooks/useCustomerTable'
import { useMenu } from '@/hooks/useMenu'
import { enterTable, submitOrder } from '@/lib/customerActions'
import { formatTableLabel, parseTableLabel } from '@/types/domain'

export default function OrderPage() {
  const { tableLabel: rawLabel } = useParams<{ tableLabel: string }>()
  const parsed = rawLabel ? parseTableLabel(rawLabel) : null

  if (!parsed) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-lg">잘못된 테이블 주소입니다.</p>
      </div>
    )
  }

  return <OrderPageInner key={rawLabel} zone={parsed.zone} seatNumber={parsed.seatNumber} />
}

type View = 'entry' | 'menu' | 'cart' | 'status'

function OrderPageInner({ zone, seatNumber }: { zone: string; seatNumber: number }) {
  const { menu, loading: menuLoading } = useMenu()
  const { table, orders, loading: tableLoading, refetch } = useCustomerTable(zone, seatNumber)

  const [view, setView] = useState<View | null>(null)
  const [cart, setCart] = useState<Record<number, number>>({})
  const [entering, setEntering] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (view !== null || tableLoading || !table) return
    if (table.status === 'EMPTY') {
      setView('entry')
    } else if (orders.length > 0) {
      setView('status')
    } else {
      setView('menu')
    }
  }, [view, tableLoading, table, orders])

  if (tableLoading || menuLoading || view === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (!table) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-lg">존재하지 않는 테이블입니다.</p>
      </div>
    )
  }

  const tableLabel = formatTableLabel(zone, seatNumber)

  async function handleEnter() {
    setEntering(true)
    try {
      await enterTable(zone, seatNumber)
      await refetch()
      setView('menu')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setEntering(false)
    }
  }

  function handleAdd(menuItemId: number) {
    setCart((prev) => ({ ...prev, [menuItemId]: (prev[menuItemId] ?? 0) + 1 }))
  }

  function handleRemove(menuItemId: number) {
    setCart((prev) => {
      const next = { ...prev }
      const quantity = (next[menuItemId] ?? 0) - 1
      if (quantity <= 0) delete next[menuItemId]
      else next[menuItemId] = quantity
      return next
    })
  }

  async function handleSubmit() {
    const items = Object.entries(cart).map(([id, quantity]) => ({ menuItemId: Number(id), quantity }))
    if (items.length === 0) return

    setSubmitting(true)
    try {
      await submitOrder(zone, seatNumber, items)
      setCart({})
      await refetch()
      setView('status')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (view === 'entry') {
    return <EntryView tableLabel={tableLabel} entering={entering} onEnter={handleEnter} />
  }

  if (view === 'menu') {
    return (
      <MenuView menu={menu} cart={cart} onAdd={handleAdd} onRemove={handleRemove} onViewCart={() => setView('cart')} />
    )
  }

  if (view === 'cart') {
    return (
      <CartView
        menu={menu}
        cart={cart}
        submitting={submitting}
        onIncrement={handleAdd}
        onDecrement={handleRemove}
        onBack={() => setView('menu')}
        onSubmit={handleSubmit}
      />
    )
  }

  return (
    <StatusView
      tableLabel={tableLabel}
      orders={orders}
      refreshing={refreshing}
      onAddMore={() => setView('menu')}
      onRefresh={handleRefresh}
    />
  )
}
