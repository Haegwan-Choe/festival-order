import { useParams } from 'react-router-dom'

export default function OrderPage() {
  const { tableNumber } = useParams<{ tableNumber: string }>()

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <p className="text-lg">테이블 {tableNumber}번 — 주문 화면 (준비 중)</p>
    </div>
  )
}
