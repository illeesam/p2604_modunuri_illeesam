# 정책서ec-pd — 상품(PD) 도메인

## 파일 목록

| 파일 | 내용 |
|---|---|
| `pd.01.상품상태표.md` | 상품·카테고리·옵션 상태 코드 표 + 클레임 가능 여부 매트릭스 (참조 전용) |
| `pd.02.카테고리.md` | 3단계 계층(대/중/소) 카테고리 |
| `pd.03.상품.md` | 상품 기본정보, 상세설정, 상품이미지, 상품문의, 재입고알림 |
| `pd.04.배송템플릿.md` | 업체별 배송비 템플릿, 반품지, 배송비 계산 규칙 |
| `pd.05.묶음상품.md` | 묶음상품(GROUP) 구성·재고·배송·가격 안분 정책 |
| `pd.06.세트상품.md` | 세트상품(SET) 구성·단일배송·전체 단위 클레임 정책 |
| `pd.07.사은상품.md` | 사은상품 관점 (재고·주문행·클레임 연동) |
| `pd.08.상품옵션.md` | 옵션 그룹·값·SKU 구조, 1단/2단 옵션, 이미지 연동 |
| `pd.09.상품가격-재고.md` | 가격 체계(정가·판매가·매입가·추가금액), 재고 관리·이력 |

## 관련 테이블 (ec-pd/)
- `pd_category` — 카테고리
- `pd_prod` — 상품 마스터 (prod_type_cd: SINGLE/GROUP/SET)
- `pd_prod_opt_item`, `pd_prod_opt_item`, `pd_prod_sku` — 옵션/SKU
- `pd_prod_bundle` — 묶음상품 구성품
- `pd_prod_set_item` — 세트상품 구성 목록
- `pd_dliv_tmplt` — 배송템플릿
- `pd_review` — 리뷰
- `pd_prod_qna` — 상품문의
- `pd_restock_noti` — 재입고알림

## 관리자 화면
| pageId | 라벨 |
|---|---|
| `pdCategoryMng` | 상품관리 > 카테고리관리 |
| `pdProdMng` | 상품관리 > 상품관리 |
| `pdDlivTmpltMng` | 상품관리 > 배송템플릿관리 |
| `pdBundleMng` | 상품관리 > 묶음상품관리 |
| `pdSetMng` | 상품관리 > 세트상품관리 |
