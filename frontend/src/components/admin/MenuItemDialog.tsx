import { ImageIcon } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createMenuItem, deleteMenuItem, updateMenuItem } from '@/lib/adminActions'
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
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setPrice(item ? String(item.price) : '')
    setCategory(item?.category ?? '')
    setAvailable(item?.available ?? true)
    setImageUrl(item?.imageUrl ?? null)
    setImageFile(null)
    setConfirmDeleteOpen(false)
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

  async function handleDelete() {
    if (!item) return
    setDeleting(true)
    try {
      await deleteMenuItem(item.id)
      setConfirmDeleteOpen(false)
      onSaved()
    } catch (err) {
      const message = (err as Error).message ?? ''
      if (message.includes('foreign key') || message.includes('violates')) {
        alert('진행 중인 주문에 이 메뉴가 걸려있어서 삭제할 수 없어요. 대신 "판매중"을 꺼서 품절 처리해주세요.')
      } else {
        alert(message)
      }
    } finally {
      setDeleting(false)
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

          <div className="flex gap-2">
            {item && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={saving || deleting}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                삭제
              </Button>
            )}
            <Button type="submit" className="flex-1" size="lg" disabled={saving || deleting}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>'{item?.name}' 메뉴를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              되돌릴 수 없습니다. 진행 중인 주문에 걸려있는 메뉴는 삭제되지 않아요 — 그럴 땐 "판매중"을 꺼서 품절
              처리해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
