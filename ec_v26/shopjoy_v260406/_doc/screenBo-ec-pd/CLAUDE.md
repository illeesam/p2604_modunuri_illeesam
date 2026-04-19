# screenBo-ec-pd/ 관리자 화면 — 상품(PD) 도메인

## 화면 목록
- `index.html` — 상품 도메인 화면 목록 인덱스
- `pd-category-mng.html` — 카테고리관리 (3단계 계층, 대/중/소)
- `pd-dliv-tmplt-mng.html` — 배송템플릿관리 (배송비/반품비/교환비/반품지)
- `pd-prod-mng.html` — 상품관리 (상품목록/상세/옵션/SKU/이미지/리뷰)
- `pd-review-mng.html` — 리뷰관리 (구매리뷰 목록/답변)

## 관련 관리자 컴포넌트
| pageId | 컴포넌트 | 파일 |
|---|---|---|
| `pdCategoryMng` | `ec-pd-category-mng` | `pages/admin/ec/pd/PdCategoryMng.js` |
| `pdProdMng` | `ec-pd-prod-mng` | `pages/admin/ec/pd/PdProdMng.js` |
| `pdProdDtl` | `ec-pd-prod-dtl` | `pages/admin/ec/pd/PdProdDtl.js` |
| `pdDlivTmpltMng` | `ec-pd-dliv-tmplt-mng` | `pages/admin/ec/pd/PdDlivTmpltMng.js` |
| `pdBundleMng` | `ec-pd-bundle-mng` | `pages/admin/ec/pd/PdBundleMng.js` |
| `pdSetMng` | `ec-pd-set-mng` | `pages/admin/ec/pd/PdSetMng.js` |

## 관련 DDL
- `_doc/ddlPgsql-ec-pd/` — 상품 도메인 전체 DDL

## 관련 정책서
- `_doc/정책서-ec-pd/` — 상품 도메인 정책
