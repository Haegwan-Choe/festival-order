import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MenuItemDialog } from '@/components/admin/MenuItemDialog'
import { useMenu } from '@/hooks/useMenu'
import type { MenuItem } from '@/types/domain'

export default function AdminMenu() {
  const { menu, loading, refetch } = useMenu()
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [creating, setCreating] = useState(false)

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">메뉴 관리</h2>
        <Button onClick={() => setCreating(true)}>메뉴 추가</Button>
      </div>

      <div className="space-y-2">
        {menu.map((item) => (
          <Card key={item.id} className="overflow-hidden py-0">
            <div className="flex items-center gap-3 p-3">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="size-14 shrink-0 rounded-md object-cover" />
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
                <p className="text-sm text-muted-foreground">
                  {item.category} · {item.price.toLocaleString()}원
                </p>
              </div>
              <Button variant="outline" onClick={() => setEditing(item)}>
                수정
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <MenuItemDialog
        open={creating}
        item={null}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false)
          refetch()
        }}
      />

      <MenuItemDialog
        open={editing !== null}
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          refetch()
        }}
      />
    </div>
  )
}
