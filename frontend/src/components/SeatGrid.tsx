import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { DiningTable } from '@/types/domain'

interface SeatGridProps {
  tables: DiningTable[]
  onTableClick?: (table: DiningTable) => void
}

function formatElapsed(enteredAt: string, now: Date) {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(enteredAt).getTime()) / 60000))
  if (minutes < 60) return `${minutes}분`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}

export function SeatGrid({ tables, onTableClick }: SeatGridProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
      {tables.map((table) => {
        const occupied = table.status === 'OCCUPIED'
        return (
          <button
            key={table.id}
            type="button"
            onClick={() => onTableClick?.(table)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-md border p-2 text-sm transition-colors',
              occupied
                ? 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
            )}
          >
            <span className="font-semibold">{table.tableNumber}</span>
            <span className="text-[11px]">
              {occupied && table.enteredAt ? formatElapsed(table.enteredAt, now) : '빈자리'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
