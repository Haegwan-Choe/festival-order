import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CATEGORY_ORDER, HIDDEN_CATEGORY } from '@/lib/menuCategories'
import type { MenuItem, OrderView } from '@/types/domain'

interface MenuDemandSidebarProps {
  menu: MenuItem[]
  orders: OrderView[]
}

// 주방 화면 사이드바: 조리중(입금 확인된) 수량만 메뉴별로 합산해서 보여준다.
// 입금대기중은 아직 주방에 안 넘어온 주문이라 제외 — OrderQueue의 filterStatus=['COOKING']와 동일한 기준.
// 순서는 손님 메뉴판(MenuView)과 동일하게 — 단, 자릿세는 음식이 아니라서 제외.
// 지금 주문이 없는 메뉴도 0으로 표시(재고/품절과는 무관, 순수 큐 집계용).
const EXCLUDED_CATEGORIES = new Set(['자릿세', HIDDEN_CATEGORY])

export function MenuDemandSidebar({ menu, orders }: MenuDemandSidebarProps) {
  const counts = new Map<string, number>()
  for (const order of orders) {
    for (const item of order.items) {
      if (item.status === 'COOKING') {
        counts.set(item.menuName, (counts.get(item.menuName) ?? 0) + item.quantity)
      }
    }
  }

  const rows = menu
    .filter((item) => !EXCLUDED_CATEGORIES.has(item.category))
    .sort((a, b) => {
      const orderDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
      return orderDiff !== 0 ? orderDiff : a.name.localeCompare(b.name, 'ko')
    })
    .map((item) => ({ name: item.name, count: counts.get(item.name) ?? 0 }))

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-lg">메뉴별 조리중 수량</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">표시할 메뉴가 없습니다.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map(({ name, count }) => (
              <li key={name} className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0">
                <span className="text-lg">{name}</span>
                <span className="text-2xl font-bold tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
