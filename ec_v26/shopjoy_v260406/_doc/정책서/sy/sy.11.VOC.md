# SY.11. 고객의소리(VOC) 분류 정책

## 목적
고객센터에서 접수되는 고객의소리(VOC)를 체계적으로 분류·관리하기 위한 분류 코드 테이블 운영 정책.

## 범위
- 관리자: 시스템 > VOC분류관리 (sy_voc 테이블 CRUD)
- 고객센터: 상담 접수 시 VOC 분류 코드 선택

## 주요 정책

### 1. VOC 분류 구조
- **2단계**: 마스터코드(voc_master_cd) → 세부코드(voc_detail_cd)
- 마스터코드 예시: DELIVERY(배송), PRODUCT(상품), PAYMENT(결제), SERVICE(서비스)
- 세부코드: 마스터코드 하위 구체적 항목

### 2. 분류 코드 관리
- UNIQUE: site_id + voc_master_cd + voc_detail_cd (동일 조합 중복 불가)
- 사용여부(use_yn): N으로 변경 시 신규 접수에 미노출, 기존 접수 데이터 유지
- 분류명 수정: 가능 (voc_nm, voc_content)
- 분류 삭제: 참조 데이터 없을 때만 가능

### 3. 사이트별 분리
- site_id 기준으로 사이트별 독립적인 VOC 분류 체계 운영 가능
- site_id=NULL: 전 사이트 공통 분류

## 주요 필드
| 필드 | 설명 |
|------|------|
| voc_id | VOCID (YYMMDDhhmmss+rand4) |
| site_id | 사이트ID (sy_site.site_id) |
| voc_master_cd | 마스터 분류 코드 (코드: VOC_MASTER) |
| voc_detail_cd | 세부 분류 코드 (코드: VOC_DETAIL) |
| voc_nm | 분류명 |
| voc_content | 분류 설명 |
| use_yn | 사용여부 Y/N |

## 관련 테이블
- sy_voc: VOC 분류 마스터

## 변경이력
- 2026-04-18: 초기 작성
