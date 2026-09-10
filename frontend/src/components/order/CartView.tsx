import { Button } from '@/components/ui/button'
import type { MenuItem } from '@/types/domain'

interface CartViewProps {
  menu: MenuItem[]
  cart: Record<number, number>
  submitting: boolean
  onIncrement: (menuItemId: number) => void
  onDecrement: (menuItemId: number) => void
  onBack: () => void
  onSubmit: () => void
}

export function CartView({ menu, cart, submitting, onIncrement, onDecrement, onBack, onSubmit }: CartViewProps) {
  const items = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ item: menu.find((m) => m.id === Number(id)), quantity }))
    .filter((entry): entry is { item: MenuItem; quantity: number } => entry.item !== undefined)

  const total = items.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0)

  return (
    <div className="min-h-dvh p-4 pb-32">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 메뉴로
        </Button>
        <h1 className="text-lg font-semibold">장바구니</h1>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">담은 메뉴가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ item, quantity }) => (
            <li key={item.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{(item.price * quantity).toLocaleString()}원</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={() => onDecrement(item.id)}>
                  −
                </Button>
                <span className="w-4 text-center">{quantity}</span>
                <Button size="icon" variant="outline" onClick={() => onIncrement(item.id)}>
                  +
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>합계</span>
          <span className="font-semibold">{total.toLocaleString()}원</span>
        </div>
        <Button className="w-full" size="lg" disabled={items.length === 0 || submitting} onClick={onSubmit}>
          {submitting ? '주문 중...' : '주문하기'}
        </Button>
      </div>
    </div>
  )
}
