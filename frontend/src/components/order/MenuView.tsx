import { ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/types/domain'

const CATEGORY_ORDER = ['안주', '사이드', '밈']

interface MenuViewProps {
  menu: MenuItem[]
  cart: Record<number, number>
  onAdd: (menuItemId: number) => void
  onRemove: (menuItemId: number) => void
  onViewCart: () => void
}

export function MenuView({ menu, cart, onAdd, onRemove, onViewCart }: MenuViewProps) {
  const categories = [...new Set(menu.map((item) => item.category))].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
  )
  const totalCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  if (categories.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">메뉴가 없습니다.</p>
  }

  return (
    <div className="min-h-dvh pb-28">
      <div className="p-4">
        <p className="text-sm text-muted-foreground">밈천지</p>
        <h1 className="text-lg font-semibold">메뉴</h1>
      </div>

      <Tabs defaultValue={categories[0]} className="px-4">
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-2">
            {menu
              .filter((item) => item.category === category)
              .map((item) => {
                const quantity = cart[item.id] ?? 0
                return (
                  <Card key={item.id} className={cn(!item.available && 'opacity-50')}>
                    <CardContent className="flex items-center gap-3 py-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="size-14 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.name}
                          {!item.available && (
                            <Badge variant="secondary" className="ml-2">
                              품절
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.price.toLocaleString()}원</p>
                      </div>
                      {item.available &&
                        (quantity === 0 ? (
                          <Button size="sm" onClick={() => onAdd(item.id)}>
                            담기
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" onClick={() => onRemove(item.id)}>
                              −
                            </Button>
                            <span className="w-4 text-center">{quantity}</span>
                            <Button size="icon" variant="outline" onClick={() => onAdd(item.id)}>
                              +
                            </Button>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )
              })}
          </TabsContent>
        ))}
      </Tabs>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4">
        <Button className="w-full" size="lg" disabled={totalCount === 0} onClick={onViewCart}>
          장바구니 보기{totalCount > 0 && ` (${totalCount})`}
        </Button>
      </div>
    </div>
  )
}
