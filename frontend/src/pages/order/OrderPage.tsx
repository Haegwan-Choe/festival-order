import { useParams } from 'react-router-dom'
import { parseTableLabel } from '@/types/domain'

export default function OrderPage() {
  const { tableLabel } = useParams<{ tableLabel: string }>()
  const parsed = tableLabel ? parseTableLabel(tableLabel) : null

  if (!parsed) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-lg">잘못된 테이블 주소입니다.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <p className="text-lg">테이블 {tableLabel} — 주문 화면 (준비 중)</p>
    </div>
  )
}
