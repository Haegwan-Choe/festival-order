import { ImageIcon } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createMenuItem, updateMenuItem } from '@/lib/adminActions'
import { uploadMenuImage } from '@/lib/menuImageUpload'
import type { MenuItem } from '@/types/domain'

interface MenuItemDialogProps {
  open: boolean
  item: MenuItem | null // null이면 새 메뉴 생성
  onClose: () => void
  onSaved: () => void
}

export function MenuItemDialog({ open, item, onClose, onSaved }: MenuItemDialogProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [available, setAvailable] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setPrice(item ? String(item.price) : '')
    setCategory(item?.category ?? '')
    setAvailable(item?.available ?? true)
    setImageUrl(item?.imageUrl ?? null)
    setImageFile(null)
  }, [open, item])

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const finalImageUrl = imageFile ? await uploadMenuImage(imageFile) : imageUrl
      const priceNumber = Number(price)

      if (item) {
        await updateMenuItem({
          id: item.id,
          name,
          price: priceNumber,
          category,
          available,
          imageUrl: finalImageUrl,
        })
      } else {
        await createMenuItem({ name, price: priceNumber, category, imageUrl: finalImageUrl })
      }
      onSaved()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-6" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-sm text-muted-foreground">탭해서 사진 선택</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="menu-name">이름</Label>
            <Input id="menu-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="menu-price">가격</Label>
            <Input
              id="menu-price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="menu-category">카테고리</Label>
            <Input
              id="menu-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="안주 / 사이드 / 밈"
              required
            />
          </div>

          {item && (
            <div className="flex items-center justify-between">
              <Label htmlFor="menu-available">판매중</Label>
              <Switch id="menu-available" checked={available} onCheckedChange={setAvailable} />
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
