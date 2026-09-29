import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CartView } from '@/components/order/CartView'
import { EntryView } from '@/components/order/EntryView'
import { MenuView } from '@/components/order/MenuView'
import { StatusView } from '@/components/order/StatusView'
import { useCustomerTable } from '@/hooks/useCustomerTable'
import { useMenu } from '@/hooks/useMenu'
import { enterTable, submitOrder } from '@/lib/customerActions'
import { friendlyErrorMessage } from '@/lib/friendlyError'
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

  // 밈(음료)은 개별 메뉴가 아니라 장바구니당 하나 고르는 라디오 옵션
  const [selectedDrinkId, setSelectedDrinkId] = useState<number | null>(null)
  const drinkOptions = menu.filter((item) => item.category === '밈' && item.available)

  // 자동으로 골라주지 않음 — 선택지가 사라졌을 때(품절 등)만 무효화
  useEffect(() => {
    if (selectedDrinkId !== null && !drinkOptions.some((d) => d.id === selectedDrinkId)) {
      setSelectedDrinkId(null)
    }
  }, [drinkOptions, selectedDrinkId])

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
    } catch (e) {
      alert(friendlyErrorMessage(e))
      setEntering(false)
      return
    }
    // 입장 자체는 성공했으니, 새로고침이 실패해도 화면은 넘어가야 한다 (안 그러면
    // 손님이 "안 됐나?" 하고 다시 누르게 됨 — enter_table은 멱등이라 위험하진 않지만 헷갈림).
    setView('menu')
    setEntering(false)
    refetch().catch((e) => console.error('입장 후 새로고침 실패', e))
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

    const finalItems = selectedDrinkId !== null ? [...items, { menuItemId: selectedDrinkId, quantity: 1 }] : items

    setSubmitting(true)
    try {
      await submitOrder(zone, seatNumber, finalItems)
    } catch (e) {
      alert(friendlyErrorMessage(e))
      setSubmitting(false)
      return
    }
    // 주문 생성 자체는 성공했으니, 새로고침이 실패해도 반드시 주문 현황 화면으로 넘어가야 한다.
    // 안 그러면 장바구니는 비워졌는데 에러만 뜨는 꼴이라 손님이 "주문 안 됐나?" 하고
    // 중복 주문을 시도할 수 있음.
    setCart({})
    setSelectedDrinkId(null)
    setView('status')
    setSubmitting(false)
    refetch().catch((e) => console.error('주문 후 새로고침 실패', e))
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
        drinkOptions={drinkOptions}
        selectedDrinkId={selectedDrinkId}
        submitting={submitting}
        onIncrement={handleAdd}
        onDecrement={handleRemove}
        onSelectDrink={setSelectedDrinkId}
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
