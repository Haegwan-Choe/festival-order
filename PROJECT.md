# 학교 축제 주점 주문 웹 서비스 — 설계 문서

## 1. 개요

- 결제 기능 없음 (현금/계좌이체 확인은 운영자가 수동으로 체크)
- 배포: 무료 클라우드(Railway/Render 등) 단일 서비스
- 실시간 동기화: WebSocket (STOMP + SockJS)
- DB: H2 또는 SQLite 파일 기반 (별도 DB 서버 없음)
- 백엔드: Spring Boot, 프론트: React (빌드 결과물을 Spring Boot static 리소스로 통합해 단일 jar 배포)

---

## 2. 아키텍처

```
[고객 폰] ─┐
           ├─ HTTPS/WSS ─→ [Spring Boot 단일 앱] ─→ [H2/SQLite 파일 DB]
[운영자 디바이스들] ─┘
```

- 역할 구분은 로그인 없이 **URL 라우팅으로만** 분리 (당일 각 디바이스에 해당 URL을 미리 열어두고 시작)
- 모든 화면은 하나의 WebSocket 데이터(주문 큐 스냅샷)를 공유하며, **화면별로 필터와 허용 액션만 다르게** 렌더링

---

## 3. 도메인 모델

### Table (좌석)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Long | PK |
| tableNumber | Integer | 테이블 번호 |
| status | Enum | EMPTY / OCCUPIED |
| enteredAt | DateTime | 입장 시각 (최초 접속 시 기록) |

### MenuItem (메뉴)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Long | PK |
| name | String | 메뉴명 |
| price | Integer | 가격 |
| category | String | 안주 / 음료 / 사이드 등 |
| available | Boolean | 품절 여부 |

### Order (주문)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Long | PK |
| tableId | Long | FK → Table |
| createdAt | DateTime | 주문 시각 |
| paymentConfirmed | Boolean | 입금 확인 여부 |
| items | OrderItem[] | 주문 항목 |

### OrderItem (주문 항목)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Long | PK |
| orderId | Long | FK → Order |
| menuItemId | Long | FK → MenuItem |
| quantity | Integer | 수량 |
| status | Enum | PENDING_PAYMENT / COOKING / SERVED |

> 상태는 Order가 아니라 **OrderItem 단위**로 관리. 한 테이블이 추가 주문을 여러 번 할 수 있고, 메뉴별로 조리/서빙 타이밍이 다르기 때문.

### 상태 흐름
```
PENDING_PAYMENT --(입금확인)--> COOKING --(조리완료 체크)--> SERVED
```
- `PENDING_PAYMENT`: 주문 접수됨, 입금 미확인 → 주방에는 노출 안 됨
- `COOKING`: 입금 확인됨, 조리 대상 → 주방 화면에 노출
- `SERVED`: 서빙 완료 → 큐에서 제거(또는 잠깐 표시 후 사라짐)

---

## 4. REST API

### 고객용
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/tables/{tableNumber}` | 테이블 진입 처리 (최초 접속 시 status→OCCUPIED, enteredAt 기록) |
| GET | `/api/menu` | 메뉴 목록 조회 |
| POST | `/api/orders` | 주문 생성 `{ tableNumber, items: [{ menuItemId, quantity }] }` |
| GET | `/api/orders/table/{tableNumber}` | 해당 테이블의 주문 내역 조회 |

### 운영자용
| Method | Path | 설명 | 사용 화면 |
|---|---|---|---|
| GET | `/api/tables` | 전체 좌석 현황 | 총괄 |
| GET | `/api/orders` | 전체 주문 큐 조회 (상태 필터 가능: `?status=`) | 총괄, 주문서버, 주방 |
| PATCH | `/api/orders/{orderId}/payment` | 입금 확인 → 하위 OrderItem 전체 `PENDING_PAYMENT → COOKING` | 총괄, 주문서버 |
| PATCH | `/api/order-items/{itemId}/serve` | 개별 항목 조리 완료 → `COOKING → SERVED` | 총괄, 주방 |
| POST | `/api/tables/{tableNumber}/checkout` | 퇴석 처리 (주문 내역 정리, 좌석 EMPTY로 초기화) | 총괄 전용 |

> 모든 상태 변경 API는 처리 후 WebSocket으로 최신 스냅샷을 브로드캐스트한다.

---

## 5. WebSocket 설계

- 프로토콜: STOMP + SockJS
- 토픽: `/topic/admin` 단일 채널 (좌석 + 주문 큐 스냅샷을 하나로 묶어서 push)
- 이벤트 발생(주문 생성/입금확인/조리완료/퇴석) 시마다 **전체 스냅샷을 재계산해서 통째로 전송** → 클라이언트는 받은 대로 갈아끼우기만 하면 됨 (부분 업데이트 로직 불필요)

### 스냅샷 JSON 예시
```json
{
  "tables": [
    { "tableNumber": 1, "status": "EMPTY", "enteredAt": null },
    { "tableNumber": 5, "status": "OCCUPIED", "enteredAt": "2026-09-08T13:20:00" }
  ],
  "orders": [
    {
      "orderId": 101,
      "tableNumber": 5,
      "createdAt": "2026-09-08T13:41:00",
      "paymentConfirmed": false,
      "items": [
        { "itemId": 501, "menuName": "떡볶이", "quantity": 2, "status": "PENDING_PAYMENT" },
        { "itemId": 502, "menuName": "순대", "quantity": 1, "status": "PENDING_PAYMENT" }
      ]
    },
    {
      "orderId": 98,
      "tableNumber": 7,
      "createdAt": "2026-09-08T13:38:00",
      "paymentConfirmed": true,
      "items": [
        { "itemId": 480, "menuName": "튀김", "quantity": 1, "status": "COOKING" }
      ]
    }
  ]
}
```

- 고객용 개별 알림(`/topic/table/{tableNumber}`)은 MVP 범위에서는 제외, 필요 시 추후 추가

---

## 6. 라우팅 & 화면 구조

```
/order/{tableNumber}   → 고객 (모바일)
/admin/overview          → 총괄 (노트북, 반응형)
/admin/orders            → 주문받는 서버 (폰)
/admin/kitchen            → 주방 (폰)
```

역할별 로그인 없이, 각 디바이스가 행사 시작 전 해당 URL을 미리 열어두는 방식.

### 6-1. 고객 화면 (`/order/{tableNumber}`)
1. **입장 화면**: 테이블 번호 확인 → "주문하러 가기" (재접속 시 스킵)
2. **메뉴 화면**: 카테고리 탭 + 메뉴 리스트 + 담기, 하단 고정 "장바구니 보기" CTA
3. **장바구니/주문확인**: 수량 조절 → "주문하기"
4. **주문 현황**: 담은 메뉴별 상태(대기중/조리중/완료) 표시, "메뉴 추가 주문" 가능

### 6-2. 운영자 공통 컴포넌트
모든 관리자 화면은 아래 2개 컴포넌트의 조합으로 구성 (재사용성 확보):

- **`SeatGrid`**: 좌석 번호 + 상태(빈자리/사용중) + 경과시간 그리드. 셀 클릭 시 해당 테이블 상세/퇴석 처리.
- **`OrderQueue`**: 주문 큐 리스트. `filterStatus`, `allowedActions` props로 화면별 동작 제어.
  ```
  <OrderQueue
    filterStatus={['PENDING_PAYMENT', 'COOKING']}   // 화면별로 다르게
    allowedActions={['confirmPayment', 'markServed']} // 화면별로 다르게
  />
  ```

| 화면 | 구성 | filterStatus | allowedActions |
|---|---|---|---|
| 총괄 `/admin/overview` | `SeatGrid` + `OrderQueue` (3열 배치, 좁은 화면에선 세로 아코디언) | 전체 | 입금확인, 조리완료, 퇴석 |
| 주문서버 `/admin/orders` | `OrderQueue`만 | 전체 (확인용) | 입금확인만 |
| 주방 `/admin/kitchen` | `OrderQueue`만 | `COOKING`만 | 조리완료(항목 체크)만 |

### 6-3. 총괄 화면 반응형 규칙
- **넓은 화면**: `SeatGrid` / `OrderQueue` 3열(좌석·주문큐 2열 구조 + 필요시 확장) 그리드로 동시 노출
- **좁은 화면**: 세로 스택 + 아코디언(섹션별 접기/펼치기), 기본은 펼침 상태
- 브레이크포인트 1개만 사용 (미디어쿼리로 레이아웃만 전환, 로직 분기 없음)

### 6-4. 큐 카드 표시 규칙
- 상태별 아이콘: 🟠 입금대기 → 🔥 조리중 → ✅ 완료(짧게 표시 후 자동 제거)
- 🟠 입금대기 항목은 항상 최상단 고정, 그 외는 최신순

---

## 7. 확장성 메모 (추후 반영 가능하도록 남겨둔 여지)

- `boothId` 필드를 Table/MenuItem에 미리 추가해두면, 여러 부스가 같은 시스템을 재사용할 때 확장 쉬움 (지금은 단일 부스 고정값)
- Order 상태 enum은 지금은 `paymentConfirmed(boolean) + OrderItem.status`로 단순화했지만, 추후 실제 결제 붙일 경우 `PAID`, `REFUNDED` 등 상태 추가 여지 있음
- Service Layer에 비즈니스 로직(퇴석 시 정리, 스냅샷 계산 등) 캡슐화, Controller는 얇게 유지

---

## 8. 배포 참고사항

- Railway/Render 무료 플랜은 파일시스템이 비영구적일 수 있음 → H2/SQLite 파일 DB 사용 시 **Volume(영구 디스크) 부착 권장**
- Volume 미부착 시: 배포 후 재배포/재시작 금지, 사전 리허설로 안정성 확인 필수
- 프론트 빌드 결과물은 Spring Boot `static` 리소스로 통합 배포 (서비스 1개로 관리, CORS 이슈 없음)
- SPA 라우팅 새로고침 대응을 위한 fallback controller 필요 (`/order/**`, `/admin/**` → `index.html`)