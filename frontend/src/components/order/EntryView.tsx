import { Button } from '@/components/ui/button'

interface EntryViewProps {
  tableLabel: string
  entering: boolean
  onEnter: () => void
}

export function EntryView({ tableLabel, entering, onEnter }: EntryViewProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">밈천지</p>
        <h1 className="text-2xl font-bold">{tableLabel} 테이블</h1>
      </div>
      <Button size="lg" disabled={entering} onClick={onEnter}>
        {entering ? '입장 중...' : '주문하러 가기'}
      </Button>
    </div>
  )
}
