import { Button } from '@/components/ui/button'

interface EntryViewProps {
  tableLabel: string
  entering: boolean
  onEnter: () => void
}

export function EntryView({ tableLabel, entering, onEnter }: EntryViewProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 p-4 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">밈천지</h1>
        <p className="text-3xl font-semibold">{tableLabel} 테이블</p>
      </div>
      <Button
        size="lg"
        className="h-14 w-full max-w-sm text-lg"
        disabled={entering}
        onClick={onEnter}
      >
        {entering ? '입장 중...' : '주문하러 가기'}
      </Button>
    </div>
  )
}
