# 315. 배송 관리 정책

## 목적
배송 프로세스 표준화 및 배송 추적 정책 정의

## 범위
- 배송 입출고 관리
- 배송 상태 추적
- 택배 정보 관리
- 배송료 정책

## 배송 구분 (DLIV_DIV)
| 구분 | 코드 | 설명 |
|------|------|------|
| 출고 | OUTBOUND | 고객에게 배송 |
| 입고 | INBOUND | 고객으로부터 반품 수거 |

## 배송 유형 (DLIV_TYPE)
| 유형 | 코드 | 설명 |
|------|------|------|
| 정상 | NORMAL | 정상 배송 |
| 반품 | RETURN | 반품 배송 |
| 교환 | EXCHANGE | 교환 배송 |
| 교환출고 | EXCHANGE_OUT | 교환상품 발송 |

## 배송 상태 (DLIV_STATUS)
| 상태 | 코드 | 설명 |
|------|------|------|
| 준비 | READY | 배송 준비 중 |
| 픽업 | PICKED | 택배사 픽업 |
| 운송중 | IN_TRANSIT | 배송 중 |
| 배송대기 | DELIVERY_READY | 배송 대기 |
| 배송중 | DELIVERING | 배송 시도 중 |
| 완료 | DELIVERED | 배송 완료 |
| 반송 | RETURNED | 반송됨 |

## 주요 정책

### 1. 출고 배송 (OUTBOUND)
- **시작**: 주문 결제 완료 후
- **준비기간**: 2~3 영업일
- **출고확인**: 판매자 수동 확인
- **택배사 선택**: 플랫폼 또는 판매자 선택
  - CJ대한통운, 한진, 롯데, 우체국, 경동, DHL 등
- **실시간조회**: 송장번호로 택배사 API 연동
- **배송료**: order당 기본료
  - 무료배송: 일정금액 이상
  - 추가요금: 도서산간 (+5,000원)

### 2. 반품 배송 (INBOUND - RETURN)
- **시작**: 반품 승인 시
- **수거택배사**: 클레임에서 지정
- **배송료**: 판매자 부담 (기본정책)
  - 상품 하자: 판매자 100%
  - 고객변심: 고객 50%, 판매자 50%
  - 사이즈/색상오류: 판매자 100%
- **수거기간**: 3~5 영업일

### 3. 교환 배송 (EXCHANGE)
- **첫번째**: 반품 수거 배송 (INBOUND)
- **두번째**: 교환상품 발송 배송 (OUTBOUND - EXCHANGE_OUT)
- **총배송료**: 수거료 + 발송료
  - 고객변심: 고객 50%, 판매자 50%
  - 상품하자: 판매자 100%

### 4. 부분배송
- **여러판매자**: 각 판매자별로 독립 배송
- **배송료**: 판매자별로 독립 계산
- **추적**: order_item별로 상태 추적
  - dliv_courier_cd, dliv_tracking_no 저장

### 5. 배송료 정산
- **배송료유형** (shipping_fee_type_cd):
  - OUTBOUND: 정상배송료
  - RETURN: 반품수거료
  - INBOUND: 반품입고료
  - EXCHANGE: 교환발송료
- **정산**: 월 1회 판매자 수수료와 함께 정산
- **기준**: 배송 완료 기준

### 6. 배송 불가 주소
- **도서산간**: 추가요금 부과
- **신규/미등록**: 직접 문의 필요
- **반입거부**: 통일로, 판문점 주변 등

### 7. 배송 확인
- **고객확인**: 배송 완료 후 구매확정
- **자동확정**: 배송완료 후 7일 미확정 시 자동
- **예외**: 클레임 진행 중이면 자동확정 미실행

## 주요 필드
| 필드 | 설명 | 규칙 |
|------|------|------|
| dliv_id | 배송ID | YYMMDDhhmmss+rand4 |
| order_id | 주문ID | 필수 FK |
| claim_id | 클레임ID | 반품배송시만 |
| dliv_div_cd | 구분 | OUTBOUND/INBOUND |
| dliv_type_cd | 유형 | NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT |
| dliv_status_cd | 상태 | DLIV_STATUS 코드 |
| dliv_status_cd_before | 변경전상태 | 상태변경 추적 |
| outbound_courier_cd | 출고택배사 | COURIER 코드 |
| outbound_tracking_no | 출고송장 | 택배사 송장번호 |
| inbound_courier_cd | 입고택배사 | COURIER 코드 |
| inbound_tracking_no | 입고송장 | 택배사 송장번호 |
| dliv_ship_date | 출고일시 | TIMESTAMP |
| dliv_date | 배송완료일시 | TIMESTAMP |
| shipping_fee | 배송료 | BIGINT 기본값 0 |
| shipping_fee_type_cd | 배송료유형 | SHIPPING_FEE_TYPE |
| recv_addr | 수령주소 | 배송지 |
| dliv_memo | 메모 | 배송지 추가안내 |

## 관련 테이블
- od_dliv: 배송 기본 정보
- od_dliv_item: 배송 상품 명세
- od_order: 주문과 배송 상태 연결
- od_claim: 반품/교환 배송 연결

## 제약사항
- 배송료 0원 설정은 무료배송만 해당
- 도서산간 추가요금은 수동 계산 후 입력
- 반품 미수거 시 자동 환불 제외

## 변경이력
- 2026-04-16: 초기 작성
