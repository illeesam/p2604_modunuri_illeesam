# 911. 시스템 공통 정책

## 목적
시스템 전반의 기본 정책 및 운영 기준 정의

## 범위
- 데이터 표준 및 규칙
- 로깅 및 감시
- 보안 정책
- 성능 기준

## 주요 정책

### 1. ID 생성 규칙

#### 포맷
`{테이블prefix}{yyMMddHHmmss}{rand4자리}`

- **prefix**: 테이블명에서 추출한 2~4자 소문자 이니셜
- **timestamp**: `yyMMddHHmmss` (12자리)
- **random**: 0000~9999 (4자리, 0-padded)
- **전체 길이**: 18~20자 (VARCHAR)
- **용도**: 모든 엔티티의 Primary Key

#### prefix 산출 규칙

1. **첫 번째 세그먼트(도메인: cm/od/sy 등) 제외**
2. **두 번째 세그먼트(엔티티명) 앞 2자** 사용
3. **세 번째 이후 각 세그먼트의 첫 글자** 추가 (최대 prefix 4자)

| 테이블명 | prefix 산출 | prefix |
|---|---|---|
| `cm_bltn_cate` | BL(bltn) + C(cate) | `BLC` |
| `cm_bltn` | BL(bltn) | `BL` |
| `od_order` | OR(order) | `OR` |
| `od_order_item` | OR(order) + I(item) | `ORI` |
| `cm_order_item_hist` | OR(order) + I(item) + H(hist) | `ORIH` |
| `pd_prod_sku` | PR(prod) + S(sku) | `PRS` |
| `sy_user` | US(user) | `US` |

#### 예시

```
BLC2604201530421234   ← cm_bltn_cate 의 ID
ORIH2604201530425678  ← cm_order_item_hist 의 ID
```

#### 구현 참조

- `AutoRestService.generateId(table)` — 테이블명을 받아 prefix 자동 산출
- `CmBltnCateService.generateId()` — prefix 하드코딩(`blc`)으로 동일 규칙 적용

### 2. 코드 관리
- **포맷**: 대문자 영문 + 언더스코어 조합
  - 예: PAY_STATUS, PRODUCT_CATEGORY
- **길이**: 최대 30자
- **중복금지**: 코드명 UNIQUE
- **변경제한**: 사용중인 코드는 삭제 불가

### 3. 데이터 무결성
- **Foreign Key**: 모든 참조는 FK 설정
- **Constraint**: NOT NULL, UNIQUE 명시
- **Cascade**: 부모 삭제 시 자식도 삭제
- **Audit**: 모든 변경사항 reg_by, upd_by 추적

### 4. 타임스탬프
- **Format**: TIMESTAMP with timezone
- **기본값**: CURRENT_TIMESTAMP
- **필드**:
  - reg_date: 생성일 (변경 불가)
  - upd_date: 수정일 (매 수정시 갱신)
  - *_date: 프로세스별 날짜
- **시간대**: 한국시간 (KST, UTC+9)

### 5. 상태코드 관리
- **형식**: *_status_cd, *_*_status_cd
- **추적**: *_status_cd_before로 변경전 상태 기록
- **상태이력테이블**: *_status_hist로 모든 변경 기록

### 6. 로깅 정책
- **대상**: 모든 중요 거래 (결제, 배송, 환불 등)
- **내용**: 
  - 거래금액
  - 상태변경
  - 변경자
  - 변경사유
- **보관기간**: 7년 (세법 기준)

### 7. 보안 기준
- **암호화**: 민감정보(PW, 카드번호 등) 암호화 저장
- **마스킹**: 조회시 마스킹 (1234-****-****-5678)
- **접근제어**: 권한에 따른 접근 제한
- **감사로그**: 모든 관리자 작업 기록

### 8. 성능 기준
- **응답시간**: 2초 이내
- **데이터베이스**: 
  - 인덱스: 자주 조회되는 컬럼에 설정
  - 파티셔닝: 대용량 테이블 분할
- **캐싱**: 자주 조회되는 정보는 캐싱

### 9. 데이터 정책
- **backup**: 매일 1회 (자동)
- **retention**: 운영데이터 5년, 로그 7년
- **compliance**: GDPR, 개인정보보호법 준수

### 10. 변경관리
- **Change Request**: 모든 스키마 변경은 승인 필수
- **Rollback Plan**: 변경 시 롤백 계획 수립
- **Test**: 운영 반영 전 테스트 환경 검증
- **Schedule**: 운영시간 외 변경 (평일 야간)

## 관련 테이블
- sy_code: 공통코드
- sy_api_log: API 호출 로그
- sy_user_login_log: 로그인 로그

## 제약사항
- 모든 거래는 감시자(로그) 남김
- 코드는 삭제 불가능 (비활성화만)
- 개인정보는 항상 암호화 저장

## 변경이력
- 2026-04-16: 초기 작성
