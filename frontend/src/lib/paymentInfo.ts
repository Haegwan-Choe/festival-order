// 입금 안내에 쓰이는 계좌 정보. 결제 연동 없이 수동 계좌이체 확인 방식이라(PROJECT.md 1장 참고) 고정값으로 둔다.
export const PAYMENT_INFO = {
  bank: '카카오뱅크',
  accountNumber: '7942-36-83652',
  holder: '박수연',
} as const
