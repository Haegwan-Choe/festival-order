import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { MenuItem } from '@/types/domain'

interface CartViewProps {
  menu: MenuItem[]
  cart: Record<number, number>
  drinkOptions: MenuItem[]
  selectedDrinkId: number | null
  submitting: boolean
  onIncrement: (menuItemId: number) => void
  onDecrement: (menuItemId: number) => void
  onSelectDrink: (menuItemId: number | null) => void
  onBack: () => void
  onSubmit: () => void
}

export function CartView({
  menu,
  cart,
  drinkOptions,
  selectedDrinkId,
  submitting,
  onIncrement,
  onDecrement,
  onSelectDrink,
  onBack,
  onSubmit,
}: CartViewProps) {
  const items = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ item: menu.find((m) => m.id === Number(id)), quantity }))
    .filter((entry): entry is { item: MenuItem; quantity: number } => entry.item !== undefined)

  const selectedDrink = drinkOptions.find((d) => d.id === selectedDrinkId) ?? null
  const total = items.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0) + (selectedDrink?.price ?? 0)

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

      {drinkOptions.length > 0 && (
        <div className="mt-4 space-y-2 rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">밈 추가하기</p>
          <RadioGroup
            value={selectedDrinkId !== null ? String(selectedDrinkId) : 'none'}
            onValueChange={(value) => onSelectDrink(value === 'none' ? null : Number(value))}
          >
            <label htmlFor="drink-none" className="flex cursor-pointer items-center gap-2 py-1">
              <RadioGroupItem value="none" id="drink-none" />
              <Label htmlFor="drink-none" className="font-normal text-amber-900">
                선택 안 함
              </Label>
            </label>
            {drinkOptions.map((drink) => (
              <label
                key={drink.id}
                htmlFor={`drink-${drink.id}`}
                className="flex cursor-pointer items-center justify-between gap-2 py-1"
              >
                <span className="flex items-center gap-2">
                  <RadioGroupItem value={String(drink.id)} id={`drink-${drink.id}`} />
                  <Label htmlFor={`drink-${drink.id}`} className="font-normal text-amber-900">
                    {drink.name}
                  </Label>
                </span>
                <span className="text-sm font-medium text-amber-900">+{drink.price.toLocaleString()}원</span>
              </label>
            ))}
          </RadioGroup>
        </div>
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
