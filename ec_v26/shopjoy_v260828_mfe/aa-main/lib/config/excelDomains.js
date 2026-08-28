/* ShopJoy — config/excelDomains.js
 * ─────────────────────────────────────────────────────────────────────
 * 엑셀 다운로드/업로드 가능한 도메인 카탈로그.
 * BoExcelUploadModal 이 이 목록을 읽어 select 옵션으로 표시한다.
 *
 * 새 도메인 추가 시 항목 하나만 추가하면 끝 — 모달 코드 수정 불필요.
 *
 * 각 항목:
 *   key      — 식별자 (default-domain prop 으로 전달되는 값)
 *   label    — select 옵션에 표시될 한글명
 *   baseUrl  — 백엔드 base URL (`${baseUrl}/excel`, `/exists-check`, `/upsert-list` 자동 도출)
 *   group    — (선택) 그룹 라벨. select 의 optgroup 으로 표시
 *
 * 권한 체크: 백엔드 컨트롤러에서 처리. 프론트는 select 목록 노출만.
 * ───────────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  /* 모든 도메인의 baseUrl 은 `/bo/excel/{key}` 통합 패턴.
   * 백엔드 도메인 추가 = ExcelDomainHandler 빈 등록 + 이 배열에 한 줄 추가. */
  global.BO_EXCEL_DOMAINS = [
    /* ── 시스템 ──────────────────────────────────────────────── */
    { key: 'user',  label: '사용자',      baseUrl: '/bo/excel/user',  group: '시스템' },
    { key: 'role',  label: '역할(권한)',  baseUrl: '/bo/excel/role',  group: '시스템' },
    /* 향후 추가 예시 (백엔드에 SyXxxExcelHandler 추가 후 활성화):
    { key: 'dept',    label: '부서',     baseUrl: '/bo/excel/dept',    group: '시스템' },
    { key: 'menu',    label: '메뉴',     baseUrl: '/bo/excel/menu',    group: '시스템' },
    { key: 'brand',   label: '브랜드',   baseUrl: '/bo/excel/brand',   group: '시스템' },
    { key: 'vendor',  label: '판매업체',  baseUrl: '/bo/excel/vendor',  group: '시스템' },
    { key: 'member',  label: '회원',     baseUrl: '/bo/excel/member',  group: 'EC' },
    { key: 'product', label: '상품',     baseUrl: '/bo/excel/product', group: 'EC' },
    { key: 'order',   label: '주문',     baseUrl: '/bo/excel/order',   group: 'EC' },
    */
  ];

  /** key 로 도메인 메타 조회 */
  global.boGetExcelDomain = function (key) {
    if (!key) return null;
    return (global.BO_EXCEL_DOMAINS || []).find(d => d.key === key) || null;
  };
})(typeof window !== 'undefined' ? window : this);
