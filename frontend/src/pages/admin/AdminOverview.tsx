import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminOverview() {
  return (
    <div className="min-h-dvh space-y-6 p-6">
      <h1 className="text-lg font-semibold">총괄 (준비 중 — 디자인 시스템 미리보기)</h1>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">🟠 입금대기</Badge>
        <Badge className="bg-orange-500 text-white">🔥 조리중</Badge>
        <Badge className="bg-green-600 text-white">✅ 완료</Badge>
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>5번 테이블</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">떡볶이 x2, 순대 x1</p>
          <Button size="sm">입금 확인</Button>
        </CardContent>
      </Card>
    </div>
  )
}
