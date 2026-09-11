import { ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
        <h1 className="text-2xl font-black tracking-tight">밈천지</h1>
        <p className="text-sm text-muted-foreground">메뉴</p>
      </div>

      <Tabs defaultValue={categories[0]} className="px-4">
        <TabsList className="w-full">
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
                  <Card key={item.id} className={cn('overflow-hidden py-0', !item.available && 'opacity-50')}>
                    <div className="flex h-28">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="aspect-square h-full shrink-0 object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square h-full shrink-0 items-center justify-center bg-muted text-muted-foreground">
                          <ImageIcon className="size-7" />
                        </div>
                      )}
                      <div className="flex flex-1 items-center justify-between gap-2 px-3">
                        <div>
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
                            <Button size="lg" onClick={() => onAdd(item.id)}>
                              담기
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button size="icon-lg" variant="outline" onClick={() => onRemove(item.id)}>
                                −
                              </Button>
                              <span className="w-5 text-center">{quantity}</span>
                              <Button size="icon-lg" variant="outline" onClick={() => onAdd(item.id)}>
                                +
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
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
