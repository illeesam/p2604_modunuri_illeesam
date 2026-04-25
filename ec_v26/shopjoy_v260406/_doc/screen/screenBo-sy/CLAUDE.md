# screenBo-sy/ 관리자 화면 — 시스템(SY) 도메인

## 화면 목록
- `index.html` — 시스템 도메인 화면 목록 인덱스
- `sy-site-mng.html` — 사이트관리 (멀티사이트 설정, 도메인/연락처/사업자)
- `sy-code-mng.html` — 공통코드관리 (코드그룹/코드 CRUD)
- `sy-dept-mng.html` — 부서관리 (조직도 트리, 부서 계층)
- `sy-role-mng.html` — 권한관리 (RBAC 역할 정의, 메뉴/기능 권한 할당)
- `sy-menu-mng.html` — 메뉴관리 (관리자 시스템 메뉴 계층 구조)
- `sy-user-mng.html` — 사용자관리 (관리자 계정, 비밀번호 정책, 로그인 이력)
- `sy-vendor-mng.html` — 업체관리 (판매업체/배송업체 기본정보, 계약 상태)

## 관련 관리자 컴포넌트
| pageId | 컴포넌트 | 파일 |
|---|---|---|
| `sySiteMng` | `sy-site-mng` | `pages/admin/sy/SySiteMng.js` |
| `syCodeMng` | `sy-code-mng` | `pages/admin/sy/SyCodeMng.js` |
| `syDeptMng` | `sy-dept-mng` | `pages/admin/sy/SyDeptMng.js` |
| `syRoleMng` | `sy-role-mng` | `pages/admin/sy/SyRoleMng.js` |
| `syMenuMng` | `sy-menu-mng` | `pages/admin/sy/SyMenuMng.js` |
| `syUserMng` | `sy-user-mng` | `pages/admin/sy/SyUserMng.js` |
| `syVendorMng` | `sy-vendor-mng` | `pages/admin/sy/SyVendorMng.js` |

## 관련 DDL
- `_doc/ddlPgsql-sy/` — 시스템 도메인 전체 DDL
