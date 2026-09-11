import { useEffect, useMemo, useState } from 'react'
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
import { GROUP_COLOR_PALETTE } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import { formatTableLabel, type DiningTable } from '@/types/domain'

interface SeatGridProps {
  tables: DiningTable[]
  onCheckout?: (table: DiningTable) => void
  onMove?: (table: DiningTable, newRow: number, newCol: number) => void
  onMerge?: (tables: DiningTable[]) => void
}

const GRID_ROW_BUFFER = 2
const GRID_COL_BUFFER = 2

function formatElapsed(enteredAt: string, now: Date) {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(enteredAt).getTime()) / 60000))
  if (minutes < 60) return `${minutes}분`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}

export function SeatGrid({ tables, onCheckout, onMove, onMerge }: SeatGridProps) {
  const [now, setNow] = useState(() => new Date())
  const [actionTable, setActionTable] = useState<DiningTable | null>(null)
  const [pendingCheckout, setPendingCheckout] = useState<DiningTable | null>(null)
  const [mergeMode, setMergeMode] = useState(false)
  const [selectedForMerge, setSelectedForMerge] = useState<DiningTable[]>([])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const groupIds = useMemo(
    () =>
      [...new Set(tables.map((table) => table.groupId).filter((id): id is number => id !== null))].sort(
        (a, b) => a - b,
      ),
    [tables],
  )

  function colorForGroup(groupId: number) {
    return GROUP_COLOR_PALETTE[groupIds.indexOf(groupId) % GROUP_COLOR_PALETTE.length]
  }

  function toggleMergeSelection(table: DiningTable) {
    setSelectedForMerge((prev) =>
      prev.some((t) => t.id === table.id) ? prev.filter((t) => t.id !== table.id) : [...prev, table],
    )
  }

  function handleCellClick(table: DiningTable) {
    if (mergeMode) {
      toggleMergeSelection(table)
      return
    }
    setActionTable(table)
  }

  function handleDrop(zone: string, row: number, col: number, draggedId: number) {
    const draggedTable = tables.find((table) => table.id === draggedId)
    if (draggedTable && draggedTable.zone === zone) {
      onMove?.(draggedTable, row, col)
    }
  }

  const zones = [...new Set(tables.map((table) => table.zone))].sort()

  return (
    <div className="space-y-6 overflow-x-auto pb-2">
      {zones.map((zone) => {
        const zoneTables = tables.filter((table) => table.zone === zone)
        const maxRow = Math.max(0, ...zoneTables.map((table) => table.gridRow))
        const maxCol = Math.max(0, ...zoneTables.map((table) => table.gridCol))
        const rows = maxRow + 1 + GRID_ROW_BUFFER
        const cols = maxCol + 1 + GRID_COL_BUFFER

        return (
          <div key={zone} className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">{zone}구역</h3>
            <div className="grid w-max gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 3rem)` }}>
              {Array.from({ length: rows * cols }).map((_, idx) => {
                const row = Math.floor(idx / cols)
                const col = idx % cols
                const table = zoneTables.find((t) => t.gridRow === row && t.gridCol === col)

                if (!table) {
                  return (
                    <div
                      key={`empty-${zone}-${row}-${col}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const draggedId = Number(e.dataTransfer.getData('text/plain'))
                        handleDrop(zone, row, col, draggedId)
                      }}
                      className="aspect-square rounded-md border border-dashed border-transparent"
                    />
                  )
                }

                const occupied = table.status === 'OCCUPIED'
                const group = table.groupId !== null ? colorForGroup(table.groupId) : null
                const selected = selectedForMerge.some((t) => t.id === table.id)

                return (
                  <button
                    key={table.id}
                    type="button"
                    draggable={!mergeMode}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', String(table.id))}
                    onClick={() => handleCellClick(table)}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border p-1 text-sm transition-colors',
                      group
                        ? cn(group.border, group.bg, group.text, group.hover)
                        : occupied
                          ? 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                      selected && 'ring-2 ring-primary ring-offset-1',
                    )}
                  >
                    <span className="font-semibold">{formatTableLabel(table.zone, table.seatNumber)}</span>
                    <span className="text-[11px]">
                      {occupied && table.enteredAt ? formatElapsed(table.enteredAt, now) : '빈자리'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <Dialog open={!!actionTable} onOpenChange={(open) => !open && setActionTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTable && formatTableLabel(actionTable.zone, actionTable.seatNumber)} 테이블
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {actionTable?.status === 'OCCUPIED' && (
              <Button
                variant="destructive"
                onClick={() => {
                  setPendingCheckout(actionTable)
                  setActionTable(null)
                }}
              >
                퇴석
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (actionTable) {
                  setMergeMode(true)
                  setSelectedForMerge([actionTable])
                }
                setActionTable(null)
              }}
            >
              합석
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingCheckout} onOpenChange={(open) => !open && setPendingCheckout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCheckout && formatTableLabel(pendingCheckout.zone, pendingCheckout.seatNumber)} 테이블을
              퇴석 처리할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>주문 내역이 정리되고 좌석이 빈자리로 바뀝니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingCheckout) onCheckout?.(pendingCheckout)
                setPendingCheckout(null)
              }}
            >
              퇴석
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {mergeMode && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
            <span className="text-sm">{selectedForMerge.length}개 선택됨</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMergeMode(false)
                setSelectedForMerge([])
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              disabled={selectedForMerge.length < 2}
              onClick={() => {
                onMerge?.(selectedForMerge)
                setMergeMode(false)
                setSelectedForMerge([])
              }}
            >
              합석 확인
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
