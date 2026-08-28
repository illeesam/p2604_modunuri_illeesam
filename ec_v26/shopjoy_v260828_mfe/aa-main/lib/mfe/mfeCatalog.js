/* mfeCatalog.js — 지연로드용 "가벼운 목차". 실제 화면 코드는 전혀 안 싣고, 어떤
 * 대메뉴(menuKey)에 어떤 도메인 폴더가 어떤 소그룹(중메뉴, group)으로 기여하는지,
 * 그리고 그 안에 어떤 화면(id/label)이 있는지까지 미리 선언한다(2026-08-28 — 처음엔
 * 그룹명까지만 알았는데, "좌측 메뉴에 화면 이름까지 미리 보이면 좋겠다"는 요청으로
 * 화면 목록도 카탈로그에 포함시켰다). 각 manifest.js 의 register() 호출과 id/label이
 * 겹치는 게 유일한 단점인데, 이게 "메뉴 트리 모양은 미리 알아야 하지만 그 화면의
 * 실제 코드(comp)는 나중에 불러온다"는 지연로드 트리 방식의 근본적인 특성이다 —
 * 실제 사내 관리자 시스템도 메뉴는 DB/설정으로 미리 내려주고 화면 번들만 코드
 * 스플리팅하는 경우가 많다.
 *
 * mfe.html / mfe-*.html 이 이 파일 하나만 부팅 시 로드하면, 나머지 7개 도메인의
 * 실제 코드(화면 파일들)는 사용자가 그 "소그룹(중메뉴)" 이나 그 안의 특정 화면을
 * 처음 클릭할 때 window.MFE_REGISTRY.ensureFolderLoaded() 가 그때 가서 그 폴더
 * 하나만 동적으로 불러온다 — 로드 단위는 여전히 "폴더(소그룹) 하나"다(화면 하나만
 * 콕 집어 로드하진 않는다 — 같은 폴더 안의 화면들은 어차피 한 manifest.js 가
 * 한꺼번에 register() 하므로).
 *
 * 이 파일이 셸(mfe.html)이 아는 유일한 "도메인 목록"이다 — 새 도메인을 추가할 때
 * 손대는 곳이 여기 한 줄로 줄어든다.
 */
(function () {
  var R = window.MFE_REGISTRY;

  R.registerCatalog('home', '../ab-home/', null, [
    { id: 'dashboardBoEc01', label: 'EC 대시보드 1' },
    { id: 'dashboardBoEc02', label: 'EC 대시보드 2' },
  ]);
  R.registerCatalog('pd', '../pd-pd/', '상품', [
    { id: 'pdTagMng', label: '상품태그관리' },
    { id: 'pdRestockNotiMng', label: '재입고알림관리' },
  ]);
  R.registerCatalog('pd', '../pd-cate/', '카테고리', [
    { id: 'pdCategoryMng', label: '카테고리관리' },
    { id: 'pdCategoryProdMng', label: '카테고리상품관리' },
  ]);
  R.registerCatalog('cu', '../cu-ba/', '고객', [
    { id: 'cmNoticeMng', label: '공지사항관리' },
    { id: 'cmFaqMng', label: 'FAQ관리' },
  ]);
  R.registerCatalog('cu', '../cu-co/', '공통업무', [
    { id: 'cmNoticeMng_co', label: '공지사항관리' },
    { id: 'cmFaqMng_co', label: 'FAQ관리' },
  ]);
  R.registerCatalog('sy', '../sy-ba/', '기준정보', [
    { id: 'syBrandMng', label: '브랜드관리' },
    { id: 'syCodeMng', label: '공통코드관리' },
  ]);
  R.registerCatalog('sy', '../sy-org/', '조직', [
    { id: 'syUserMng', label: '사용자관리' },
    { id: 'syDeptMng', label: '부서관리' },
  ]);
})();
