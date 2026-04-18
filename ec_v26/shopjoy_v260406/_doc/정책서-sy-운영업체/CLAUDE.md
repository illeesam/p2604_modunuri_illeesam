# SY 운영업체 정책서

플랫폼과 계약하여 운영 역할을 수행하는 외부 업체 정책 문서 모음.
모든 업체는 `sy_vendor` 테이블 공용, `vendor_class_cd`로 유형 구분.
업체 사용자는 `sy_vendor_user` 테이블 공용, `role_id`로 접근 범위 구분.

## 파일 목록 (업체·사용자·권한 통합 파일)

| 파일 | 내용 |
|------|------|
| `sy.11.사이트운영업체-사용자-권한.md` | 사이트 위탁운영 업체 등록·계약·상태 + 담당자 계정 + SITE_ 역할 접근 제어 통합 |
| `sy.12.판매업체-사용자-권한.md` | 상품 판매 업체 등록·수수료·정산 + 담당자 계정 + SALE_ 역할 접근 제어 통합 |
| `sy.13.고객상담-사용자-권한.md` | CS 대행 업체 등록·업무 범위 + 상담사 계정 + CS_ 역할 접근 제어 통합 |
| `sy.14.배송업체-사용자-권한.md` | 택배사·물류사 등록·정산 + 담당자 계정 + DLIV_ 역할 접근 제어 통합 |
| `sy.15.프로그램관리업체-사용자-권한.md` | SI·유지보수·감리 업체 보안계약 + 개발자 계정(보안서약 필수) + PROG_ 역할 접근 제어 통합 |

## 공통 DDL
| 테이블 | 설명 | 모든 업체 유형 공용 |
|--------|------|-------------------|
| `sy_vendor` | 업체 마스터 | `vendor_class_cd`로 유형 구분 |
| `sy_vendor_user` | 업체사용자 | `role_id`(역할 트리)로 접근 범위 구분 |
| `sy_vendor_content` | 업체 소개 내용 | |
| `sy_vendor_brand` | 업체-브랜드 연결 | 판매업체만 해당 |

## 역할 트리 접두어 요약
| 접두어 | 대상 | 예시 |
|--------|------|------|
| `SITE_` | 사이트운영업체 | SITE_ADMIN, SITE_OPER, SITE_CONTENT, SITE_READ |
| `SALE_` | 판매업체 | SALE_ADMIN, SALE_ORDER, SALE_PRODUCT, SALE_SETTLE, SALE_READ |
| `CS_` | 고객상담업체 | CS_ADMIN, CS_SENIOR, CS_AGENT, CS_READ |
| `DLIV_` | 배송업체 | DLIV_ADMIN, DLIV_TRACKING, DLIV_PICKUP, DLIV_SETTLE, DLIV_READ |
| `PROG_` | 프로그램관리업체 | PROG_ADMIN, PROG_DEV, PROG_SUPPORT, PROG_AUDIT |

## 수정 규칙
- 새 업체 유형 추가 시 통합 파일 1개(업체+사용자+권한) 신규 생성
- 역할 트리 변경 시 해당 업체 통합 파일 섹션 3 + `sy_role` DDL 함께 수정
- 공통 DDL(sy_vendor, sy_vendor_user) 변경 시 모든 업체 정책서 섹션 1·2 검토
