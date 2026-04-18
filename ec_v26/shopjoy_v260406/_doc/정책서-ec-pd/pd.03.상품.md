# pd.03. 상품 관리 정책

## 목적
상품 등록, 관리, 상태 변경에 대한 정책 정의

## 범위
- 상품 기본 정보 관리
- 상품 가격 정책
- 상품 상태 관리
- 상품 재고 관리
- 판매기간 / 구매제한 / 혜택적용 설정

## 상품 상태 (PRODUCT_STATUS)
| 상태 | 코드 | 설명 |
|------|------|------|
| 활성 | ACTIVE | 판매 중인 상품 |
| 준비중 | DRAFT | 작성 중인 상품 |
| 중단 | STOPPED | 일시 판매 중단 |
| 단종 | DISCONTINUED | 판매 종료 |

## 주요 정책

### 1. 상품 등록
- **필수항목**:
  - 상품명 (200자 이내)
  - SKU/상품코드
  - 정가
  - 판매가
  - 카테고리
  - 상세설명 (HTML)
  - 상품이미지 (최소 1개)
- **초기상태**: DRAFT
- **브랜드**: 선택사항
- **업체**: 판매자/판매자 상품은 vendor_id 지정

### 2. 상품 가격 정책
- **정가**: 원래 정가 (변경 기록 유지)
- **판매가**: 실제 판매 가격
  - 정가 이하여야 함
  - 할인율 자동 계산
- **매입가(purchase_price)**: 내부 원가 관리용, 화면 미노출
- **마진율(margin_rate)**: 내부 관리용 (%)
- **할인**: 카테고리 할인, 개별 할인 가능
- **가격변경**: 최대 일 3회까지만 변경 가능

### 3. 상품 상태 관리
- **DRAFT**: 작성 중, 판매 불가
  - 임시저장 기능
  - 자동삭제: 30일 미저장 시
- **ACTIVE**: 판매 중
  - 재고 0이면 자동으로 품절 표시
- **STOPPED**: 일시 중단
  - 판매 불가, 카트에 담기 불가
  - 기간 지정 후 자동 복구 가능
- **DISCONTINUED**: 단종
  - 검색 결과에서 제외
  - 상세페이지 접근 불가

### 4. 재고 관리
- **재고단위**: SKU별 개별 관리
- **안전재고**: 5개 이하 시 관리자 알림
- **재고부족**: 주문 시 재고 부족 시 예약 주문 처리
- **재고확인**: 실시간 반영 (주문, 반품, 교환)
- **품절여부**: `sold_out_yn = Y` 설정 시 재고 있어도 품절 표시

### 5. 판매기간 설정
- `sale_start_date`: 판매 시작일시 (NULL = 등록 즉시 판매)
- `sale_end_date`: 판매 종료일시 (NULL = 무기한)
- 판매기간 외 접근 시 "판매 종료" 안내

### 6. 구매 제한
- `min_buy_qty`: 최소구매수량 (기본 1개)
- `max_buy_qty`: 1회 최대구매수량 (NULL = 무제한)
- `day_max_buy_qty`: 1일 최대구매수량 (NULL = 무제한)
- `id_max_buy_qty`: 회원 ID당 누적 최대구매수량 (NULL = 무제한)

### 7. 혜택 적용 여부
상품별로 혜택 적용 여부를 개별 제어:
- `coupon_use_yn`: 쿠폰 사용 가능 여부 (Y=사용가능, N=쿠폰적용불가)
- `save_use_yn`: 적립금 사용 가능 여부
- `discnt_use_yn`: 할인정책 적용 가능 여부

### 8. 기타 설정
- **성인상품** (`adlt_yn = Y`): 성인인증 회원만 구매 가능
- **당일배송** (`same_day_dliv_yn = Y`): 당일 배송 가능 상품 표시
- **배송템플릿** (`dliv_tmplt_id`): pd_dliv_tmplt 연결. 상품별 배송비·반품비·반품지 자동 적용
- **홍보문구** (`advrt_stmt`): 상품 목록·상세에 표시되는 짧은 홍보 문구
  - `advrt_start_date` / `advrt_end_date`: 문구 노출 기간 (기간 외 미노출)

### 9. 상품 정보 관리
- **상품이미지**: 최대 20개, 순서 지정
- **상세설명**: HTML 에디터 사용
- **옵션**: 색상, 사이즈 등 다중옵션 지원
- **검색키워드**: 최대 10개

### 10. 품질 관리
- **리뷰**: 5점 만점
  - 평균 3점 이상 유지 권장
  - 부정적 리뷰에 판매자 답변 권장
- **반품율**: 5% 이상 시 판매자 주의

## 주요 필드
| 필드 | 설명 | 규칙 |
|------|------|------|
| prod_id | 상품ID | YYMMDDhhmmss+rand4 |
| prod_nm | 상품명 | 200자 이내 필수 |
| prod_code | SKU | 50자 이내 필수 |
| list_price | 정가 | BIGINT 필수 |
| sale_price | 판매가 | BIGINT ≤ list_price |
| purchase_price | 매입가(원가) | BIGINT 내부용 |
| margin_rate | 마진율 | DECIMAL(5,2) 내부용 |
| prod_stock | 재고 | INTEGER 기본값 0 |
| prod_status_cd | 상태 | PRODUCT_STATUS 코드 |
| prod_status_cd_before | 변경전상태 | 상태변경 추적 |
| category_id | 카테고리 | 소분류만 허용 |
| vendor_id | 업체 | 판매자 상품 시 필수 |
| dliv_tmplt_id | 배송템플릿 | pd_dliv_tmplt FK |
| sale_start_date | 판매시작일 | NULL=즉시 |
| sale_end_date | 판매종료일 | NULL=무기한 |
| min_buy_qty | 최소구매수량 | INTEGER 기본값 1 |
| max_buy_qty | 최대구매수량 | NULL=무제한 |
| day_max_buy_qty | 1일 최대구매수량 | NULL=무제한 |
| id_max_buy_qty | ID당 최대구매수량 | NULL=무제한 |
| adlt_yn | 성인여부 | Y/N 기본 N |
| same_day_dliv_yn | 당일배송여부 | Y/N 기본 N |
| sold_out_yn | 품절여부 | Y/N 기본 N |
| coupon_use_yn | 쿠폰사용가능여부 | Y/N 기본 Y |
| save_use_yn | 적립금사용가능여부 | Y/N 기본 Y |
| discnt_use_yn | 할인적용가능여부 | Y/N 기본 Y |
| advrt_stmt | 홍보문구 | VARCHAR(500) |
| view_count | 조회수 | INTEGER 기본값 0 |
| sale_count | 판매수 | INTEGER 기본값 0 |

### 11. 상품문의 (pd_prod_qna)
- 회원이 상품 페이지에서 문의 등록
- **비밀글** (scrt_yn=Y): 작성자 본인 + 관리자만 열람
- **답변** (answ_yn, answ_date, answ_user_id): 관리자/판매자 답변
- 문의유형 코드: PROD_QNA_TYPE (SIZE/QUALITY/DLIV/ETC)
- 노출여부 (disp_yn): 관리자가 부적절한 문의 숨김 가능

### 12. 배송템플릿 (pd_dliv_tmplt)
- 업체(vendor_id)별로 배송 정책을 템플릿으로 관리
- 상품 등록 시 배송템플릿 선택 → 배송비/반품비/교환비 자동 적용
- **배송방법** (dliv_method_cd): COURIER(택배)/DIRECT(직배송)/PICKUP(방문수령)
- **배송비 결제** (dliv_pay_type_cd): PREPAY(선결제)/COD(착불)
- 반품지 주소 (return_addr_*): 반품 접수 시 자동 안내
- 기본배송지 (base_dliv_yn): 업체당 1개만 Y 가능

### 13. 재입고알림 (pd_restock_noti)
- 품절 상품에 회원이 재입고 알림 신청
- UNIQUE: prod_id + sku_id + member_id (중복 신청 불가)
- noti_yn=Y, noti_date: 재입고 시 발송 처리 후 갱신
- 재입고 발생 시 배치 또는 이벤트로 noti_yn=N 목록 조회 후 발송

### 14. 상품이미지 (pd_prod_img)

상품 1개에 이미지 N개. 옵션 값과 연동하여 옵션 선택 시 해당 이미지로 자동 교체.

#### 주요 필드
| 필드 | 설명 |
|---|---|
| `prod_img_id` | 이미지ID |
| `prod_id` | 상품ID |
| `opt_id_1` | 옵션1 값ID (NULL=공통) |
| `opt_id_2` | 옵션2 값ID (NULL=옵션1 전체 공통) |
| `attach_id` | 원본 파일 ID (sy_attach 연계) |
| `cdn_img_url` | CDN 원본 이미지 URL (상세 페이지용) |
| `cdn_thumb_url` | CDN 썸네일 URL (목록·검색용) |
| `img_alt_text` | 이미지 대체텍스트 (SEO/접근성) |
| `sort_ord` | 정렬순서 |
| `is_thumb` | 대표이미지 여부 (Y=1개만) |

#### 이미지 범위 규칙
| opt_id_1 | opt_id_2 | 적용 범위 |
|---|---|---|
| NULL | NULL | 상품 전체 공통 대표이미지 |
| 색상값 | NULL | 해당 색상의 모든 사이즈 공통 |
| 색상값 | 사이즈값 | 특정 색상+사이즈 전용 이미지 |

#### 운영 규칙
- 대표이미지(`is_thumb = 'Y'`): 상품당 1개만 허용
- 최대 이미지 수: 상품당 20개 권장 (제한은 운영 정책으로 결정)
- 이미지 삭제 시 대표이미지가 삭제되면 다음 `sort_ord` 이미지가 자동 대표로 승격
- `cdn_img_url` / `cdn_thumb_url` 동시 등록 권장 (목록 성능)

---

### 15. 상세설정

상품 등록 시 기본 정보 외 부가 설정 항목.

#### 상품 표시 설정
| 필드 | 설명 | 기본값 |
|---|---|---|
| `is_new` | 신상품 여부 | N |
| `is_best` | 베스트 여부 | N |
| `adlt_yn` | 성인상품 여부 (성인인증 회원만 구매 가능) | N |
| `same_day_dliv_yn` | 당일배송 가능 여부 | N |
| `sold_out_yn` | 강제 품절 설정 (재고 있어도 품절 표시) | N |

#### 상품 사양 정보
| 필드 | 설명 |
|---|---|
| `weight` | 무게 (kg, NUMERIC(10,2)) — 배송비 계산 참조 |
| `size_info_cd` | 사이즈 표기 코드 (PRODUCT_SIZE) |

#### 홍보문구
| 필드 | 설명 |
|---|---|
| `advrt_stmt` | 홍보문구 (500자 이내) |
| `advrt_start_date` | 노출 시작일시 (NULL=즉시) |
| `advrt_end_date` | 노출 종료일시 (NULL=무기한) |

> 홍보문구는 `advrt_start_date` ~ `advrt_end_date` 기간 내에만 상품 목록·상세에 표시.
> 기간 외에는 문구 미노출 (상품은 정상 판매 유지).

#### 상품 상세 컨텐츠 (pd_prod_content)
HTML 에디터로 관리하는 다중 컨텐츠 탭. `content_type_cd`로 구분:

| content_type_cd | 설명 |
|---|---|
| 상세설명 | 상품 주요 특징, 성분, 사용 방법 등 |
| 사용설명 | 사용 순서, 주의사항 |
| 배송정보 | 배송 불가 지역, 제주도 추가배송비 안내 등 |
| AS정보 | AS 접수처, 교환·반품 기간 안내 |
| 반품정책 | 반품 불가 조건, 고객 귀책 기준 |

> `pd_prod.content_html` (단일 필드)과 `pd_prod_content` (다중 탭) 두 방식 지원.
> 상세설명 탭이 많은 경우 `pd_prod_content`로 분리 관리 권장.

## 관련 테이블
- pd_prod: 상품 기본 정보
- pd_prod_opt_sku: 상품 옵션/SKU
- pd_prod_content: 상품 상세 콘텐츠
- pd_prod_view_log: 상품 조회 로그
- pd_prod_qna: 상품문의
- pd_dliv_tmplt: 배송템플릿
- pd_restock_noti: 재입고알림 신청

## 제약사항
- 판매가는 정가보다 클 수 없음
- 단종 상품은 다시 활성화 불가
- 브랜드 삭제는 해당 상품 없을 때만 가능
- 배송템플릿 삭제는 참조 상품이 없을 때만 가능
- `self_cdiv_rate + seller_cdiv_rate = 100`%가 되어야 함 (프로모션 분담율 기준)

## 변경이력
- 2026-04-18: 상품문의, 배송템플릿, 재입고알림 정책 추가
- 2026-04-18: 판매기간, 구매제한, 혜택적용여부, 홍보문구, 매입가, 마진율 필드 추가
- 2026-04-16: 초기 작성
