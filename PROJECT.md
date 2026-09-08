# 학교 축제 주점 주문 웹 서비스 — 설계 문서

## 0. 아키텍처 변경 이력

- **2026-09-08: Spring Boot + EC2 → Vercel + Supabase로 전면 전환 결정.**
  - 기존 설계(Spring Boot 단일 jar + AWS EC2 상시 구동, STOMP/SockJS WebSocket, H2 파일 DB)는 도메인 엔티티(`DiningTable`/`MenuItem`/`Order`/`OrderItem`/`Admin`)까지 구현된 상태였음.
  - 전환 이유: 서버 직접 관리(EC2 인스턴스, systemd, 배포) 부담을 없애고, Supabase의 관계형 DB(Postgres)·내장 Realtime·Auth를 활용하면 지금 설계한 관계형 스키마와 실시간 동기화 요구사항을 더 적은 인프라로 해결할 수 있다고 판단.
  - 트레이드오프로 감수하는 것: 서비스 로직 위치가 Java 서비스 레이어 → Postgres 함수(RPC) 또는 Supabase Edge Function으로 바뀌고, 인가 방식도 Spring Security 세션 → Row Level Security(RLS) 기반으로 바뀜. 기존 `backend/`(Spring Boot) 코드는 이 전환과 함께 정리됨 — 과거 코드는 git 히스토리에 남아있음(이 커밋 이전 참고).
  - 이 문서의 이후 섹션은 전환 완료 후 Vercel + Supabase 기준으로 다시 작성됨.

---

## 1. 개요

- 결제 기능 없음 (현금/계좌이체 확인은 운영자가 수동으로 체크)
- 고객 화면은 로그인 불필요, 관리자 화면(`/admin/**`)은 로그인 필요 (계정은 스태프별로 여러 개 발급, 역할 구분 없이 "관리자 여부"만 판별)
- 배포: 프론트는 Vercel, 백엔드는 별도 서버 없이 Supabase(Postgres + Auth + Realtime + Edge Function) 사용
- 실시간 동기화: Supabase Realtime (Postgres 변경사항 구독)
- DB: Supabase Postgres (관리형, 별도 DB 서버 구축 불필요)
- 프론트: React, 클라이언트에서 Supabase JS SDK로 직접 데이터 조회/구독. 상태 변경(입금확인, 조리완료, 퇴석 등)은 클라이언트가 테이블을 직접 건드리지 않고 Postgres RPC 함수를 호출

---

## 2. 아키텍처

```
[고객 폰] ─┐
           ├─ HTTPS ─→ [Vercel: React 정적 배포] ─┐
[운영자 디바이스들] ─┘                              │
                                                    ├─ Supabase JS SDK ─→ [Supabase: Postgres + Auth + Realtime + Edge Function]
                                                    ┘
```

- 프론트엔드(React)만 Vercel에 정적 사이트로 배포하고, 별도 백엔드 서버는 두지 않음
- 브라우저(고객/운영자 모두)가 Supabase JS SDK로 Postgres에 직접 읽고, Realtime으로 변경사항을 구독
- 상태를 바꾸는 동작(입금확인, 조리완료, 퇴석, 주문 생성)은 클라이언트가 테이블을 직접 INSERT/UPDATE하지 않고 **Postgres RPC 함수**를 호출해서 서버 사이드(DB 내부)에서 원자적으로 처리 — 클라이언트가 상태를 임의로 조작(예: 입금확인 없이 조리중으로 바꾸기)하는 걸 막기 위함
- 역할(총괄/주문서버/주방) 구분은 기존과 동일하게 **URL 라우팅으로만** 분리. 관리자 화면은 Supabase Auth 로그인 세션으로 게이트

---

## 3. 데이터 모델 (Postgres)

### dining_table (좌석)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | bigint | PK |
| table_number | integer | 테이블 번호 (unique) |
| status | table_status enum | EMPTY / OCCUPIED |
| entered_at | timestamptz | 입장 시각 (최초 접속 시 기록) |

### menu_item (메뉴)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | bigint | PK |
| name | text | 메뉴명 |
| price | integer | 가격 |
| category | text | 안주 / 음료 / 사이드 등 |
| available | boolean | 품절 여부 (기본 true) |

### orders (주문)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | bigint | PK |
| table_id | bigint | FK → dining_table |
| created_at | timestamptz | 주문 시각 |
| payment_confirmed | boolean | 입금 확인 여부 |

### order_item (주문 항목)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | bigint | PK |
| order_id | bigint | FK → orders |
| menu_item_id | bigint | FK → menu_item |
| quantity | integer | 수량 |
| status | order_item_status enum | PENDING_PAYMENT / COOKING / SERVED |

### admins (관리자 표식)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK, FK → auth.users(id) |
| display_name | text | 표시 이름 (예: "주방-김민수") |

> 로그인 자격증명(아이디/비밀번호, 세션)은 **Supabase Auth**(`auth.users`)가 전담. `admins` 테이블은 "이 Supabase Auth 유저가 관리자다"라는 표식과 표시 이름만 저장 — 역할(총괄/주문서버/주방) 구분 없이 존재 여부만 판별. 계정은 행사 준비 단계에서 Supabase 대시보드/Admin API로 미리 발급(자체 가입 기능 없음).

> 상태는 Order가 아니라 **order_item 단위**로 관리. 한 테이블이 추가 주문을 여러 번 할 수 있고, 메뉴별로 조리/서빙 타이밍이 다르기 때문.

### 상태 흐름
```
PENDING_PAYMENT --(입금확인)--> COOKING --(조리완료 체크)--> SERVED
```
- `PENDING_PAYMENT`: 주문 접수됨, 입금 미확인 → 주방에는 노출 안 됨
- `COOKING`: 입금 확인됨, 조리 대상 → 주방 화면에 노출
- `SERVED`: 서빙 완료 → 큐에서 제거(또는 잠깐 표시 후 사라짐)

---

## 4. 데이터 접근 방식 (Supabase Client Query + RPC)

REST 엔드포인트를 직접 만드는 대신, 클라이언트가 Supabase JS SDK로 테이블을 조회하고 상태 변경은 Postgres RPC 함수(`supabase.rpc(...)`)를 호출하는 방식으로 대체한다.

### 고객용 (anon key, 로그인 불필요)
| 동작 | 방식 | 설명 |
|---|---|---|
| 테이블 진입 | RPC `enter_table(table_number)` | 최초 접속 시 status→OCCUPIED, entered_at 기록 (직접 UPDATE 금지, 동시 접속 경쟁 방지 위해 RPC로 원자 처리) |
| 메뉴 조회 | `menu_item` SELECT | RLS로 anon 조회 허용 |
| 주문 생성 | RPC `create_order(table_number, items[])` | order + order_item을 한 트랜잭션으로 생성, status는 서버가 강제로 PENDING_PAYMENT로 설정 (클라이언트가 임의 상태로 주문 생성 불가) |
| 주문 내역 조회 | `orders` + `order_item` + `menu_item` SELECT (table_number 필터) | RLS로 anon 조회 허용 (민감정보 아님) |

### 관리자용 (Supabase Auth 로그인 필요)
| 동작 | 방식 | 설명 |
|---|---|---|
| 좌석 현황 조회 | `dining_table` SELECT | 총괄 |
| 주문 큐 조회 | `orders`+`order_item`+`menu_item` SELECT | 총괄, 주문서버, 주방 |
| 입금 확인 | RPC `confirm_payment(order_id)` | `admins` 등록 여부 체크 후 order.payment_confirmed=true + 하위 order_item 전체 PENDING_PAYMENT→COOKING |
| 조리 완료 | RPC `serve_item(item_id)` | COOKING→SERVED |
| 퇴석 처리 | RPC `checkout_table(table_number)` | 주문 정리 + dining_table.status→EMPTY, entered_at→null (총괄 전용, 함수 내부에서 추가 권한 체크) |
| 메뉴 추가 | RPC `create_menu_item(name, price, category)` | 새 메뉴 등록 (available=true로 시작) |
| 메뉴 수정 | RPC `update_menu_item(id, name, price, category, available)` | 가격 변경, 품절 처리(available=false) 등 |
| 테이블 추가 | RPC `add_dining_table(table_number)` | 행사 중 좌석을 늘려야 할 때 |

> 상태를 바꾸는 모든 동작은 RPC 함수로만 가능하며, 해당 테이블에 대한 직접 INSERT/UPDATE/DELETE는 RLS로 차단한다 (5장 참고). 메뉴/테이블 삭제 RPC는 의도적으로 만들지 않음 — 메뉴는 `available=false`로 감추고, 이미 주문 이력이 걸린 데이터를 삭제하면 FK 무결성이 깨지기 때문.

---

## 5. 실시간 동기화 설계 (Supabase Realtime)

- 기존 STOMP/SockJS 대신 **Supabase Realtime의 `postgres_changes`** 구독을 사용
- 관리자 화면은 `dining_table`, `orders`, `order_item` 테이블 변경 이벤트를 구독해서 로컬 상태를 갱신
- 최초 진입 시에는 SELECT로 전체 스냅샷을 한 번 가져오고, 이후에는 변경 이벤트로 증분 갱신 (재연결 시에는 다시 전체 SELECT로 정합성을 맞춘 뒤 구독 재개)
- 고객용 개별 알림은 MVP 범위에서는 제외 — 고객은 자기 테이블 주문 내역을 폴링 또는 동일한 Realtime 구독(테이블 필터)으로 확인 가능하도록 추후 확장 여지 있음

---

## 6. 인증/보안 설계 (Supabase Auth + RLS)

- 관리자 계정은 **Supabase Auth**로 이메일/비밀번호 생성 (자체 회원가입 화면 없음, 행사 전 Supabase 대시보드/Admin API로 스태프별 계정 미리 발급)
- 로그인에 성공한 Auth 유저 중 `admins` 테이블에 등록된 유저만 "관리자"로 인정 — 역할(총괄/주문서버/주방) 구분은 기존과 동일하게 URL로만 유지
- **RLS(Row Level Security) 정책 원칙**
  - SELECT: `dining_table`/`orders`/`order_item`/`menu_item`은 anon 포함 누구나 조회 가능 (민감정보 아님)
  - INSERT/UPDATE/DELETE: 테이블에 대한 직접 쓰기는 전부 차단, 오직 RPC 함수(SECURITY DEFINER)를 통해서만 상태 변경 허용
  - RPC 함수 내부에서 관리자 전용 동작(`confirm_payment`, `serve_item`, `checkout_table`)은 `auth.uid()`가 `admins` 테이블에 존재하는지 확인 후 처리, 아니면 예외 발생
- 미인증 상태로 관리자 화면(`/admin/**`) 접근 시 프론트 라우팅 가드가 로그인 화면으로 리다이렉트, RPC 호출 시에도 서버(DB) 단에서 이중으로 권한 체크
- 고객 화면(`/order/**`)과 고객용 RPC/조회는 인증 예외 대상 유지
- 세부 RLS 정책/RPC 함수 SQL은 별도 `supabase/` 마이그레이션 작업에서 구체화 예정

---

## 7. 라우팅 & 화면 구조

```
/order/{tableNumber}   → 고객 (모바일, 로그인 불필요)
/admin/login              → 관리자 로그인
/admin/overview          → 총괄 (노트북, 반응형, 로그인 필요)
/admin/orders            → 주문받는 서버 (폰, 로그인 필요)
/admin/kitchen            → 주방 (폰, 로그인 필요)
```

역할별(총괄/주문서버/주방) 구분은 기존대로 URL로만 하되, `/admin/**` 진입 시 Supabase Auth 세션이 없으면 `/admin/login`으로 리다이렉트. 로그인 후에는 각 디바이스가 원래 열어두려던 URL로 이동해 그대로 사용.

### 7-1. 고객 화면 (`/order/{tableNumber}`)
1. **입장 화면**: 테이블 번호 확인 → "주문하러 가기" (재접속 시 스킵)
2. **메뉴 화면**: 카테고리 탭 + 메뉴 리스트 + 담기, 하단 고정 "장바구니 보기" CTA
3. **장바구니/주문확인**: 수량 조절 → "주문하기"
4. **주문 현황**: 담은 메뉴별 상태(대기중/조리중/완료) 표시, "메뉴 추가 주문" 가능

### 7-2. 운영자 공통 컴포넌트
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

### 7-3. 총괄 화면 반응형 규칙
- **넓은 화면**: `SeatGrid` / `OrderQueue` 3열(좌석·주문큐 2열 구조 + 필요시 확장) 그리드로 동시 노출
- **좁은 화면**: 세로 스택 + 아코디언(섹션별 접기/펼치기), 기본은 펼침 상태
- 브레이크포인트 1개만 사용 (미디어쿼리로 레이아웃만 전환, 로직 분기 없음)

### 7-4. 큐 카드 표시 규칙
- 상태별 아이콘: 🟠 입금대기 → 🔥 조리중 → ✅ 완료(짧게 표시 후 자동 제거)
- 🟠 입금대기 항목은 항상 최상단 고정, 그 외는 최신순

---

## 8. 확장성 메모 (추후 반영 가능하도록 남겨둔 여지)

- `booth_id` 필드를 dining_table/menu_item에 미리 추가해두면, 여러 부스가 같은 시스템을 재사용할 때 확장 쉬움 (지금은 단일 부스 고정값)
- Order 상태는 지금은 `payment_confirmed(boolean) + order_item.status`로 단순화했지만, 추후 실제 결제 붙일 경우 `PAID`, `REFUNDED` 등 상태 추가 여지 있음
- 상태 변경 로직은 Postgres RPC 함수에 캡슐화, 프론트는 RPC 호출만 하는 얇은 클라이언트로 유지
- `admins` 테이블에 역할 필드(예: `role`)를 추가하면, 추후 화면별 세부 권한 분리(예: 주방 계정은 총괄 화면 접근 불가)로 확장 가능 (지금은 "관리자 여부"만 판별)

---

## 9. 배포 참고사항

- **프론트: Vercel** — React 프로젝트를 GitHub 연동해 git push 시 자동 배포, 무료 플랜으로 충분
- **백엔드: Supabase** — Postgres + Auth + Realtime + Edge Function을 프로젝트 하나로 커버, 별도 서버 관리 없음
- Supabase 무료 플랜은 **7일간 API 요청이 없으면 프로젝트가 일시정지**됨 → 행사 며칠 전부터 미리 요청을 보내 깨어있는 상태를 유지하고, 행사 당일 아침에도 한 번 더 확인
- 환경변수(`SUPABASE_URL`, `SUPABASE_ANON_KEY`)는 Vercel 프로젝트 설정에 등록, 코드에 하드코딩 금지
- SPA 라우팅 새로고침 대응은 Vercel이 기본 지원 (필요 시 `vercel.json`에서 rewrites 설정)
- 행사 당일에는 배포 변경을 최소화하고, 사전 리허설로 안정성 확인
