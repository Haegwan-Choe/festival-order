// 손님 화면(주문/입장 등)에서 Supabase/Postgres 원본 에러 메시지(영어 기술 용어)를 그대로
// 보여주지 않기 위한 최소한의 안전망. 세세한 에러코드 분기는 하지 않고, 콘솔에 원본을 남긴 뒤
// 손님에게는 뭉뚱그린 한국어 메시지만 보여준다. 관리자 화면은 스태프가 보는 거라 원본 메시지를
// 그대로 alert하는 기존 방식을 유지한다(디버깅에 오히려 도움).
export function friendlyErrorMessage(e: unknown): string {
  console.error(e)
  return '문제가 발생했어요. 잠시 후 다시 시도해주세요.'
}
