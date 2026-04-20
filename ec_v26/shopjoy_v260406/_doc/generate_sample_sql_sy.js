'use strict';
const fs   = require('fs');
const path = require('path');

// ================================================================
// generate_sample_sql_sy.js
// sy_* / syh_* 시스템 도메인 샘플 데이터 생성
// 전제: generate_sample_sql.js 실행 완료 (sy_site/role/user/vendor/batch 기존 입력)
// ================================================================

const SCHEMA   = 'shopjoy_2604';
const SITE     = 'SITE000001';
const REG_BY   = 'SYSTEM';
const REG_DATE = '2026-01-01 00:00:00';

const mkId = (p, n) => p + String(n).padStart(6, '0');

// 기존 데이터 ID 매핑 (generate_sample_sql.js 기준)
// sy_user: US000001~US000052 (adminUserId 1-52)
// sy_role: RL000001~RL000048 (roleId 1-48 from AdminData.roles)
// sy_vendor: VN000001~VN000008
// sy_brand: BR000001~BR000012 (brandId 1-12)
// sy_batch: BT000001~BT000009
const RL = (roleId) => mkId('RL', roleId);
const US = (uid)    => mkId('US', uid);
const VN = (vid)    => mkId('VN', vid);
const BR = (bid)    => mkId('BR', bid);
const BT = (bid)    => mkId('BT', bid);

const lines = [];

function ins(tbl, cols, vals) {
  const vStr = vals.map(v => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return v;
    const s = String(v);
    if (s === 'NULL' || /^\d{4}-\d{2}-\d{2}.*::timestamp$/.test(s) || s.endsWith('::date')) return s;
    return `'${s.replace(/'/g, "''")}'`;
  }).join(', ');
  lines.push(`INSERT INTO ${SCHEMA}.${tbl} (${cols.join(', ')}) VALUES (${vStr}) ON CONFLICT DO NOTHING;`);
}

function sec(t) {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${t}`);
  lines.push('-- ================================================================');
}

// ================================================================
// 1. sy_menu — 전체 관리자 메뉴 계층
// ================================================================
sec('1. sy_menu — 관리자 메뉴');

const menuTypeMap = { '폴더':'FOLDER', '페이지':'PAGE', '링크':'LINK' };
const menus = [
  { menuId:  1, menuCode:'MEMBER',          menuNm:'회원관리',           parentId:null, menuUrl:'',                          menuType:'폴더',   sortOrd: 1, useYn:'Y' },
  { menuId:  2, menuCode:'EC_MEMBER',        menuNm:'회원관리',           parentId:1,    menuUrl:'#page=ecMemberMng',         menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 10, menuCode:'PRODUCT',          menuNm:'상품관리',           parentId:null, menuUrl:'',                          menuType:'폴더',   sortOrd: 2, useYn:'Y' },
  { menuId: 11, menuCode:'EC_CATEGORY',      menuNm:'카테고리관리',       parentId:10,   menuUrl:'#page=ecCategoryMng',       menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 12, menuCode:'EC_PROD',          menuNm:'상품관리',           parentId:10,   menuUrl:'#page=ecProdMng',           menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 20, menuCode:'ORDER',            menuNm:'주문관리',           parentId:null, menuUrl:'',                          menuType:'폴더',   sortOrd: 3, useYn:'Y' },
  { menuId: 21, menuCode:'EC_ORDER',         menuNm:'주문관리',           parentId:20,   menuUrl:'#page=ecOrderMng',          menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 22, menuCode:'EC_CLAIM',         menuNm:'클레임관리',         parentId:20,   menuUrl:'#page=ecClaimMng',          menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 23, menuCode:'EC_DLIV',          menuNm:'배송관리',           parentId:20,   menuUrl:'#page=ecDlivMng',           menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 30, menuCode:'PROMOTION',        menuNm:'프로모션',           parentId:null, menuUrl:'',                          menuType:'폴더',   sortOrd: 4, useYn:'Y' },
  { menuId: 31, menuCode:'EC_COUPON',        menuNm:'쿠폰관리',           parentId:30,   menuUrl:'#page=ecCouponMng',         menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 32, menuCode:'EC_CACHE',         menuNm:'캐쉬관리',           parentId:30,   menuUrl:'#page=ecCacheMng',          menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 33, menuCode:'EC_EVENT',         menuNm:'이벤트관리',         parentId:30,   menuUrl:'#page=ecEventMng',          menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 40, menuCode:'DISPLAY',          menuNm:'전시관리',           parentId:null, menuUrl:'',                          menuType:'폴더',   sortOrd: 5, useYn:'Y' },
  { menuId: 41, menuCode:'DISP_GRP_PREVIEW', menuNm:'미리보기',           parentId:40,   menuUrl:'',                          menuType:'폴더',   sortOrd: 1, useYn:'Y' },
  { menuId: 42, menuCode:'EC_DISP_UI_PV',    menuNm:'전시UI미리보기',     parentId:41,   menuUrl:'#page=ecDispUiPreview',     menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 43, menuCode:'EC_DISP_AREA_PV',  menuNm:'전시영역미리보기',   parentId:41,   menuUrl:'#page=ecDispAreaPreview',   menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 44, menuCode:'EC_DISP_PANEL_PV', menuNm:'전시패널미리보기',   parentId:41,   menuUrl:'#page=ecDispPanelPreview',  menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 45, menuCode:'EC_DISP_WGT_PV',   menuNm:'전시위젯미리보기',   parentId:41,   menuUrl:'#page=ecDispWidgetPreview', menuType:'페이지', sortOrd: 4, useYn:'Y' },
  { menuId: 46, menuCode:'EC_DISP_LIB_PV',   menuNm:'전시위젯Lib미리보기',parentId:41,   menuUrl:'#page=ecDispWidgetLibPreview',menuType:'페이지',sortOrd: 5, useYn:'Y' },
  { menuId: 47, menuCode:'DISP_GRP_MNG',     menuNm:'전시관리',           parentId:40,   menuUrl:'',                          menuType:'폴더',   sortOrd: 2, useYn:'Y' },
  { menuId: 48, menuCode:'EC_DISP_UI',       menuNm:'전시UI관리',         parentId:47,   menuUrl:'#page=ecDispUiMng',         menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 49, menuCode:'EC_DISP_AREA',     menuNm:'전시영역관리',       parentId:47,   menuUrl:'#page=ecDispAreaMng',       menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 50, menuCode:'EC_DISP_PANEL',    menuNm:'전시패널관리',       parentId:47,   menuUrl:'#page=ecDispPanelMng',      menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 51, menuCode:'EC_DISP_WIDGET',   menuNm:'전시위젯관리',       parentId:47,   menuUrl:'#page=ecDispWidgetMng',     menuType:'페이지', sortOrd: 4, useYn:'Y' },
  { menuId: 52, menuCode:'DISP_GRP_RES',     menuNm:'전시리소스',         parentId:40,   menuUrl:'',                          menuType:'폴더',   sortOrd: 3, useYn:'Y' },
  { menuId: 53, menuCode:'EC_DISP_WGT_LIB',  menuNm:'전시위젯Lib',        parentId:52,   menuUrl:'#page=ecDispWidgetLibMng',  menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 54, menuCode:'DISP_GRP_DEV',     menuNm:'개발지원',           parentId:40,   menuUrl:'',                          menuType:'폴더',   sortOrd: 4, useYn:'Y' },
  { menuId: 55, menuCode:'EC_DISP_UI_SIM',   menuNm:'전시UI시뮬레이션',   parentId:54,   menuUrl:'#page=ecDispUiSimul',       menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 60, menuCode:'CUSTOMER',         menuNm:'고객센터',           parentId:null, menuUrl:'',                          menuType:'폴더',   sortOrd: 6, useYn:'Y' },
  { menuId: 61, menuCode:'EC_CUST_INFO',     menuNm:'고객종합정보',       parentId:60,   menuUrl:'#page=ecCustInfoMng',       menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 62, menuCode:'SY_CONTACT',       menuNm:'문의관리',           parentId:60,   menuUrl:'#page=syContactMng',        menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 63, menuCode:'EC_CHATT',         menuNm:'채팅관리',           parentId:60,   menuUrl:'#page=ecChattMng',          menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 70, menuCode:'SYSTEM',           menuNm:'시스템',             parentId:null, menuUrl:'',                          menuType:'폴더',   sortOrd: 7, useYn:'Y' },
  { menuId: 71, menuCode:'SYS_GRP_BASE',     menuNm:'기준정보',           parentId:70,   menuUrl:'',                          menuType:'폴더',   sortOrd: 1, useYn:'Y' },
  { menuId: 72, menuCode:'SY_SITE',          menuNm:'사이트관리',         parentId:71,   menuUrl:'#page=sySiteMng',           menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 73, menuCode:'SY_CODE',          menuNm:'공통코드관리',       parentId:71,   menuUrl:'#page=syCodeMng',           menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 74, menuCode:'SY_BRAND',         menuNm:'브랜드관리',         parentId:71,   menuUrl:'#page=syBrandMng',          menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 75, menuCode:'SY_BIZ',           menuNm:'업체',               parentId:71,   menuUrl:'#page=syBizMng',            menuType:'페이지', sortOrd: 4, useYn:'Y' },
  { menuId: 76, menuCode:'SY_BIZ_USER',      menuNm:'업체사용자',         parentId:71,   menuUrl:'#page=syBizUserMng',        menuType:'페이지', sortOrd: 5, useYn:'Y' },
  { menuId: 77, menuCode:'SYS_GRP_COMMON',   menuNm:'공통업무',           parentId:70,   menuUrl:'',                          menuType:'폴더',   sortOrd: 2, useYn:'Y' },
  { menuId: 78, menuCode:'EC_NOTICE',        menuNm:'공지사항관리',       parentId:77,   menuUrl:'#page=ecNoticeMng',         menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 79, menuCode:'SY_BBM',           menuNm:'게시판관리',         parentId:77,   menuUrl:'#page=syBbmMng',            menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 80, menuCode:'SY_BBS',           menuNm:'게시글관리',         parentId:77,   menuUrl:'#page=syBbsMng',            menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 81, menuCode:'SYS_GRP_SYS',      menuNm:'시스템',             parentId:70,   menuUrl:'',                          menuType:'폴더',   sortOrd: 3, useYn:'Y' },
  { menuId: 82, menuCode:'SY_ATTACH',        menuNm:'첨부관리',           parentId:81,   menuUrl:'#page=syAttachMng',         menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 83, menuCode:'SY_TEMPLATE',      menuNm:'템플릿관리',         parentId:81,   menuUrl:'#page=syTemplateMng',       menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 84, menuCode:'SY_BATCH',         menuNm:'배치스케줄관리',     parentId:81,   menuUrl:'#page=syBatchMng',          menuType:'페이지', sortOrd: 3, useYn:'Y' },
  { menuId: 85, menuCode:'SY_ALARM',         menuNm:'알림관리',           parentId:81,   menuUrl:'#page=syAlarmMng',          menuType:'페이지', sortOrd: 4, useYn:'Y' },
  { menuId: 86, menuCode:'SY_PROP',          menuNm:'프로퍼티관리',       parentId:81,   menuUrl:'#page=syPropMng',           menuType:'페이지', sortOrd: 5, useYn:'Y' },
  { menuId: 87, menuCode:'SY_PATH',          menuNm:'표시경로',           parentId:81,   menuUrl:'#page=syPathMng',           menuType:'페이지', sortOrd: 6, useYn:'Y' },
  { menuId: 88, menuCode:'SYS_GRP_ORG',      menuNm:'조직',               parentId:70,   menuUrl:'',                          menuType:'폴더',   sortOrd: 4, useYn:'Y' },
  { menuId: 89, menuCode:'SY_USER',          menuNm:'사용자관리',         parentId:88,   menuUrl:'#page=syUserMng',           menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 90, menuCode:'SY_DEPT',          menuNm:'부서관리',           parentId:88,   menuUrl:'#page=syDeptMng',           menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 91, menuCode:'SYS_GRP_MENU',     menuNm:'메뉴',               parentId:70,   menuUrl:'',                          menuType:'폴더',   sortOrd: 5, useYn:'Y' },
  { menuId: 92, menuCode:'SY_MENU',          menuNm:'메뉴관리',           parentId:91,   menuUrl:'#page=syMenuMng',           menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 93, menuCode:'SY_ROLE',          menuNm:'역할관리',           parentId:91,   menuUrl:'#page=syRoleMng',           menuType:'페이지', sortOrd: 2, useYn:'Y' },
  { menuId: 94, menuCode:'SYS_GRP_HIST',     menuNm:'이력조회',           parentId:70,   menuUrl:'',                          menuType:'폴더',   sortOrd: 6, useYn:'Y' },
  { menuId: 95, menuCode:'SY_MEM_LOGIN',     menuNm:'회원로그인이력',     parentId:94,   menuUrl:'#page=syMemberLoginHist',   menuType:'페이지', sortOrd: 1, useYn:'Y' },
  { menuId: 96, menuCode:'SY_USR_LOGIN',     menuNm:'사용자로그인이력',   parentId:94,   menuUrl:'#page=syUserLoginHist',     menuType:'페이지', sortOrd: 2, useYn:'Y' },
];

// 1패스: ID 등록
const menuIdMap = {};
menus.forEach(m => { menuIdMap[m.menuId] = mkId('MN', m.menuId); });

// 2패스: INSERT
menus.forEach(m => {
  const menuId     = menuIdMap[m.menuId];
  const parentId   = m.parentId ? menuIdMap[m.parentId] : null;
  const menuTypeCd = menuTypeMap[m.menuType] || 'PAGE';
  ins('sy_menu',
    ['menu_id','site_id','menu_code','menu_nm','parent_menu_id','menu_url','menu_type_cd','sort_ord','use_yn','reg_by','reg_date'],
    [menuId, SITE, m.menuCode, m.menuNm, parentId, m.menuUrl || null, menuTypeCd, m.sortOrd, m.useYn, REG_BY, REG_DATE]
  );
});

// ================================================================
// 2. sy_user_role — 사용자-역할 매핑
// ================================================================
sec('2. sy_user_role — 사용자-역할 매핑');

const roleUsers = [
  { roleId: 1,  adminUserId: 1 }, { roleId: 17, adminUserId: 1 },
  { roleId: 2,  adminUserId: 2 }, { roleId: 12, adminUserId: 2 }, { roleId: 23, adminUserId: 2 },
  { roleId: 3,  adminUserId: 3 }, { roleId: 4,  adminUserId: 3 }, { roleId: 18, adminUserId: 3 },
  { roleId: 5,  adminUserId: 4 }, { roleId: 22, adminUserId: 4 },
  { roleId: 6,  adminUserId: 5 }, { roleId: 11, adminUserId: 5 }, { roleId: 17, adminUserId: 5 },
  { roleId: 7,  adminUserId: 6 }, { roleId: 13, adminUserId: 6 },
  { roleId: 8,  adminUserId: 7 }, { roleId: 21, adminUserId: 7 }, { roleId: 27, adminUserId: 7 },
  { roleId: 2,  adminUserId: 11 }, { roleId: 17, adminUserId: 11 }, { roleId: 18, adminUserId: 11 },
  { roleId: 3,  adminUserId: 11 }, { roleId: 4,  adminUserId: 11 }, { roleId: 5,  adminUserId: 11 },
  { roleId: 6,  adminUserId: 11 }, { roleId: 7,  adminUserId: 11 }, { roleId: 12, adminUserId: 11 },
  { roleId: 23, adminUserId: 11 },
  { roleId: 31, adminUserId: 12 },
  { roleId: 30, adminUserId: 13 },
  { roleId: 16, adminUserId: 14 }, { roleId: 17, adminUserId: 14 }, { roleId: 3,  adminUserId: 14 },
  { roleId: 17, adminUserId: 15 }, { roleId: 4,  adminUserId: 15 }, { roleId: 5,  adminUserId: 15 },
  { roleId: 18, adminUserId: 16 }, { roleId: 3,  adminUserId: 16 }, { roleId: 4,  adminUserId: 16 },
  { roleId: 3,  adminUserId: 17 }, { roleId: 17, adminUserId: 17 }, { roleId: 18, adminUserId: 17 },
  { roleId: 4,  adminUserId: 18 }, { roleId: 17, adminUserId: 18 }, { roleId: 5,  adminUserId: 18 },
  { roleId: 5,  adminUserId: 19 }, { roleId: 18, adminUserId: 19 }, { roleId: 4,  adminUserId: 19 },
  { roleId: 6,  adminUserId: 20 }, { roleId: 17, adminUserId: 20 }, { roleId: 18, adminUserId: 20 },
  { roleId: 27, adminUserId: 21 }, { roleId: 18, adminUserId: 21 }, { roleId: 5,  adminUserId: 21 },
  { roleId: 7,  adminUserId: 22 }, { roleId: 18, adminUserId: 22 }, { roleId: 27, adminUserId: 22 },
  { roleId: 8,  adminUserId: 23 }, { roleId: 7,  adminUserId: 23 }, { roleId: 27, adminUserId: 23 },
  { roleId: 10, adminUserId: 24 }, { roleId: 11, adminUserId: 24 },
  { roleId: 11, adminUserId: 25 }, { roleId: 12, adminUserId: 25 },
  { roleId: 12, adminUserId: 26 }, { roleId: 13, adminUserId: 26 },
  { roleId: 13, adminUserId: 27 }, { roleId: 28, adminUserId: 27 },
  { roleId: 28, adminUserId: 28 }, { roleId: 14, adminUserId: 28 },
  { roleId: 14, adminUserId: 29 },
  { roleId: 19, adminUserId: 30 },
  { roleId: 21, adminUserId: 31 }, { roleId: 22, adminUserId: 31 },
  { roleId: 22, adminUserId: 32 }, { roleId: 23, adminUserId: 32 },
  { roleId: 23, adminUserId: 33 }, { roleId: 24, adminUserId: 33 },
  { roleId: 24, adminUserId: 34 }, { roleId: 29, adminUserId: 34 },
  { roleId: 29, adminUserId: 35 }, { roleId: 25, adminUserId: 35 },
  { roleId: 25, adminUserId: 36 },
  { roleId: 26, adminUserId: 37 },
  { roleId: 33, adminUserId: 38 }, { roleId: 34, adminUserId: 38 },
  { roleId: 33, adminUserId: 39 }, { roleId: 35, adminUserId: 39 },
  { roleId: 34, adminUserId: 40 }, { roleId: 35, adminUserId: 40 },
  { roleId: 35, adminUserId: 41 },
  { roleId: 36, adminUserId: 42 },
  { roleId: 42, adminUserId: 43 },
  { roleId: 44, adminUserId: 44 }, { roleId: 45, adminUserId: 44 },
  { roleId: 44, adminUserId: 45 }, { roleId: 46, adminUserId: 45 },
  { roleId: 45, adminUserId: 46 },
  { roleId: 46, adminUserId: 47 },
  { roleId: 38, adminUserId: 48 }, { roleId: 39, adminUserId: 48 },
  { roleId: 39, adminUserId: 49 }, { roleId: 40, adminUserId: 49 },
  { roleId: 40, adminUserId: 50 },
  { roleId: 41, adminUserId: 51 },
  { roleId: 48, adminUserId: 52 },
];

let urSeq = 1;
roleUsers.forEach(ru => {
  ins('sy_user_role',
    ['user_role_id','user_id','role_id','grant_user_id','valid_from','reg_by','reg_date'],
    [mkId('UR', urSeq++), US(ru.adminUserId), RL(ru.roleId), US(1), '2025-01-01', REG_BY, REG_DATE]
  );
});

// ================================================================
// 3. sy_role_menu — 역할-메뉴 권한
// ================================================================
sec('3. sy_role_menu — 역할-메뉴 권한');

// perm_level: 1=조회, 2=수정, 3=삭제(관리)
const allMenuIds   = menus.map(m => m.menuId);
const memberMenus  = [1, 2];
const prodMenus    = [10, 11, 12];
const orderMenus   = [20, 21, 22, 23];
const promoMenus   = [30, 31, 32, 33];
const dispMenus    = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55];
const custMenus    = [60, 61, 62, 63];
const sysMenus     = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96];
const bizMenus     = [75, 76];
const orgMenus     = [88, 89, 90, 91, 92, 93];

let rmSeq = 1;
function addRoleMenus(roleId, menuIds, permLevel) {
  menuIds.forEach(mid => {
    ins('sy_role_menu',
      ['role_menu_id','site_id','role_id','menu_id','perm_level','reg_by','reg_date'],
      [mkId('RM', rmSeq++), SITE, RL(roleId), menuIdMap[mid], permLevel, REG_BY, REG_DATE]
    );
  });
}

// SUPER_ADMIN(1): 전체 관리
addRoleMenus(1, allMenuIds, 3);
// SYS_ADMIN(2): 시스템 + 기준정보 쓰기
addRoleMenus(2, [...sysMenus, ...orgMenus, 74, 75, 76], 2);
// SITE_GRP_REP(16): 전체 쓰기 (시스템관리 제외)
addRoleMenus(16, [...memberMenus, ...prodMenus, ...orderMenus, ...promoMenus, ...dispMenus, ...custMenus], 2);
// SITE_GRP_MGR(17): 상품/주문/전시/고객 관리
addRoleMenus(17, [...prodMenus, ...orderMenus, ...dispMenus, ...custMenus], 2);
// SITE_GRP_OPER(18): 상품/주문/전시 쓰기
addRoleMenus(18, [...prodMenus, ...orderMenus, ...dispMenus], 2);
// PRODUCT_MGR(3): 상품 관리
addRoleMenus(3, prodMenus, 2);
// ORDER_MGR(4): 주문 관리
addRoleMenus(4, orderMenus, 2);
// CS_MGR(5): 고객센터 관리
addRoleMenus(5, custMenus, 2);
// MARKETING_MGR(6): 프로모션 관리
addRoleMenus(6, promoMenus, 2);
// READONLY(7): 전체 조회
addRoleMenus(7, allMenuIds, 1);
// SITE_CALL(27): 고객센터 조회
addRoleMenus(27, custMenus, 1);
// 판매업체 REP(10): 상품/주문/프로모션 조회
addRoleMenus(10, [...prodMenus, ...orderMenus, ...promoMenus], 1);
// 판매업체 MGT(11): 상품/주문 조회
addRoleMenus(11, [...prodMenus, ...orderMenus], 1);
// SITE_ADMIN(12): 상품/주문 쓰기
addRoleMenus(12, [...prodMenus, ...orderMenus, ...dispMenus], 2);
// SITE_OPER(13): 상품/전시 쓰기
addRoleMenus(13, [...prodMenus, ...dispMenus], 2);
// STAFF(14): 상품/주문 조회
addRoleMenus(14, [...prodMenus, ...orderMenus], 1);
// SALES_CALL(28): 고객/주문 조회
addRoleMenus(28, [...custMenus, ...orderMenus], 1);
// 배송업체 REP(21): 배송/주문 조회
addRoleMenus(21, [20, 21, 22, 23], 1);
// DLIV_MGT(22): 배송 조회
addRoleMenus(22, [20, 23], 1);
// DLIV_SITE_ADMIN(23): 배송 쓰기
addRoleMenus(23, [20, 21, 22, 23], 2);
// DLIV_SITE_OPER(24): 배송 쓰기
addRoleMenus(24, [20, 23], 2);
// DLIV_STAFF(25): 배송 조회
addRoleMenus(25, [20, 23], 1);
// DLIV_CALL(29): 주문/배송 조회
addRoleMenus(29, [20, 21, 23], 1);
// CS_ADMIN(33): 고객 관리
addRoleMenus(33, custMenus, 2);
// CS_SENIOR(34): 고객 쓰기
addRoleMenus(34, custMenus, 2);
// CS_AGENT(35): 고객 쓰기
addRoleMenus(35, custMenus, 2);
// CS_READ(36): 고객 조회
addRoleMenus(36, custMenus, 1);
// SITE_OP_ADMIN(44): 전시/상품/공통 쓰기
addRoleMenus(44, [...dispMenus, ...prodMenus, 77, 78, 79, 80], 2);
// SITE_OP_OPER(45): 전시/상품 쓰기
addRoleMenus(45, [...dispMenus, ...prodMenus], 2);
// SITE_OP_CONTENT(46): 전시 쓰기
addRoleMenus(46, dispMenus, 2);
// SITE_OP_READ(47): 전시/상품 조회
addRoleMenus(47, [...dispMenus, ...prodMenus], 1);
// PROG_ADMIN(38): 전체 쓰기
addRoleMenus(38, allMenuIds, 2);
// PROG_DEV(39): 시스템 쓰기
addRoleMenus(39, sysMenus, 2);
// PROG_SUPPORT(40): 시스템 조회
addRoleMenus(40, sysMenus, 1);
// PROG_AUDIT(41): 이력 조회
addRoleMenus(41, [94, 95, 96], 1);

// ================================================================
// 4. sy_vendor (추가 업체 3개)
// ================================================================
sec('4. sy_vendor — 추가 업체 (CS/운영/유지보수)');

const extraVendors = [
  { id: 9,  no: '901-93-90123', nm: 'ShopJoy CS센터',      ceo: '박고객',  phone: '02-1234-5678', email: 'cs@shopjoycs.kr',  addr: '서울 서초구 서초대로 901', date: '2025-01-01', type: 'CS업체' },
  { id: 10, no: '101-11-11111', nm: 'ShopJoy 운영팀',      ceo: '김운영',  phone: '02-2345-6789', email: 'op@shopjoyop.kr',  addr: '서울 마포구 공덕동 102',   date: '2025-06-01', type: '운영업체' },
  { id: 11, no: '202-22-22222', nm: 'TechMagic IT',         ceo: '이기술',  phone: '02-3456-7890', email: 'tech@techmagic.kr',addr: '서울 강남구 역삼동 303',   date: '2025-09-01', type: '유지보수업체' },
];
extraVendors.forEach(v => {
  ins('sy_vendor',
    ['vendor_id','site_id','vendor_no','vendor_nm','ceo_nm','vendor_phone','vendor_email','vendor_addr','contract_date','vendor_status_cd','reg_by','reg_date'],
    [VN(v.id), SITE, v.no, v.nm, v.ceo, v.phone, v.email, v.addr, v.date, 'ACTIVE', REG_BY, REG_DATE]
  );
});

// ================================================================
// 5. sy_vendor_user — 업체 담당자
// ================================================================
sec('5. sy_vendor_user — 업체 담당자');

// 업체별 사용자 매핑: [vendorId, adminUserId, roleId, isMain, positionCd]
const vendorUserMap = [
  // 패션스타일 (VN000001) — 판매업체 유저 24-30
  [1, 24, 10, 'Y', 'CEO',  '판매대표'],
  [1, 25, 11, 'N', 'DIR',  '판매경영'],
  [1, 26, 12, 'N', 'MGR',  '판매사이트담당'],
  [1, 27, 13, 'N', 'STAFF','판매사이트운영'],
  [1, 28, 28, 'N', 'STAFF','판매콜센터'],
  [1, 29, 14, 'N', 'STAFF','판매뷰어'],
  [1, 30, 19, 'N', 'STAFF','판매차단(비활성)'],
  // 트렌드웨어 (VN000002) — 일부 유저 배정
  [2, 25, 11, 'Y', 'CEO',  '경영담당'],
  [2, 26, 12, 'N', 'MGR',  '사이트담당'],
  // 에코패션 (VN000003)
  [3, 26, 12, 'Y', 'CEO',  '사이트담당'],
  [3, 27, 13, 'N', 'STAFF','사이트운영'],
  // 럭셔리브랜드 (VN000004)
  [4, 24, 10, 'Y', 'CEO',  '대표'],
  [4, 29, 14, 'N', 'STAFF','뷰어'],
  // CJ대한통운 (VN000005) — 배송업체 유저 31-37
  [5, 31, 21, 'Y', 'CEO',  '배송대표'],
  [5, 32, 22, 'N', 'DIR',  '배송경영'],
  [5, 33, 23, 'N', 'MGR',  '배송사이트담당'],
  [5, 34, 24, 'N', 'STAFF','배송사이트운영'],
  [5, 35, 29, 'N', 'STAFF','배송콜센터'],
  [5, 36, 25, 'N', 'STAFF','배송뷰어'],
  [5, 37, 26, 'N', 'STAFF','배송차단(비활성)'],
  // 롯데택배 (VN000006)
  [6, 32, 22, 'Y', 'CEO',  '경영담당'],
  [6, 33, 23, 'N', 'MGR',  '사이트담당'],
  // 한진택배 (VN000007)
  [7, 34, 24, 'Y', 'CEO',  '사이트운영'],
  [7, 35, 29, 'N', 'STAFF','콜센터'],
  // 우체국택배 (VN000008) — 비활성
  [8, 36, 25, 'Y', 'STAFF','뷰어(비활성)'],
  // ShopJoy CS센터 (VN000009) — CS유저 38-43
  [9, 38, 33, 'Y', 'CEO',  'CS대표'],
  [9, 39, 33, 'N', 'MGR',  'CS관리자'],
  [9, 40, 34, 'N', 'STAFF','수석상담사'],
  [9, 41, 35, 'N', 'STAFF','상담사'],
  [9, 42, 36, 'N', 'STAFF','CS조회'],
  [9, 43, 42, 'N', 'STAFF','CS차단(비활성)'],
  // ShopJoy 운영팀 (VN000010) — 운영유저 44-47
  [10, 44, 44, 'Y', 'CEO', '운영대표'],
  [10, 45, 44, 'N', 'MGR', '운영관리자'],
  [10, 46, 45, 'N', 'STAFF','운영담당자'],
  [10, 47, 46, 'N', 'STAFF','콘텐츠담당'],
  // TechMagic IT (VN000011) — 유지보수유저 48-52
  [11, 48, 38, 'Y', 'CEO', '기술총괄'],
  [11, 49, 39, 'N', 'MGR', '개발자'],
  [11, 50, 40, 'N', 'STAFF','기술지원'],
  [11, 51, 41, 'N', 'STAFF','보안감리'],
  [11, 52, 48, 'N', 'STAFF','기술차단(비활성)'],
];

const adminUsersPhones = {
  24:'010-4000-0024',25:'010-4000-0025',26:'010-4000-0026',27:'010-4000-0027',
  28:'010-4000-0028',29:'010-4000-0029',30:'010-4000-0030',
  31:'010-5000-0031',32:'010-5000-0032',33:'010-5000-0033',34:'010-5000-0034',
  35:'010-5000-0035',36:'010-5000-0036',37:'010-5000-0037',
  38:'010-6000-0038',39:'010-6000-0039',40:'010-6000-0040',41:'010-6000-0041',
  42:'010-6000-0042',43:'010-6000-0043',
  44:'010-7000-0044',45:'010-7000-0045',46:'010-7000-0046',47:'010-7000-0047',
  48:'010-8000-0048',49:'010-8000-0049',50:'010-8000-0050',51:'010-8000-0051',52:'010-8000-0052',
};
const adminUsersEmails = {
  24:'salesrep@demo.com',25:'salesmgt@demo.com',26:'salesadmin@demo.com',27:'salesoper@demo.com',
  28:'salescall@demo.com',29:'salesview@demo.com',30:'salesblck@demo.com',
  31:'dlivrep@demo.com',32:'dlivmgt@demo.com',33:'dlivadmin@demo.com',34:'dlivoper@demo.com',
  35:'dlivcall@demo.com',36:'dlivview@demo.com',37:'dlivblck@demo.com',
  38:'csrep@demo.com',39:'csadmin@demo.com',40:'cssenior@demo.com',41:'csagent@demo.com',
  42:'csread@demo.com',43:'csblck@demo.com',
  44:'siteoprep@demo.com',45:'siteopadm@demo.com',46:'siteopoper@demo.com',47:'siteopcnt@demo.com',
  48:'progrep@demo.com',49:'progdev@demo.com',50:'progsupport@demo.com',51:'progaudit@demo.com',52:'progblck@demo.com',
};
const adminUsersNms = {
  24:'판매대표',25:'판매경영',26:'판매사이트담당',27:'판매사이트운영',28:'판매콜센터',29:'판매뷰어',30:'판매차단',
  31:'배송대표',32:'배송경영',33:'배송사이트담당',34:'배송사이트운영',35:'배송콜센터',36:'배송뷰어',37:'배송차단',
  38:'CS대표',39:'CS관리자',40:'수석상담사',41:'상담사',42:'CS조회',43:'CS차단',
  44:'운영대표',45:'운영관리자',46:'운영담당자',47:'콘텐츠담당',
  48:'기술총괄',49:'개발자',50:'기술지원',51:'보안감리',52:'기술차단',
};

let vuSeq = 1;
vendorUserMap.forEach(([vendorIdx, uid, roleId, isMain]) => {
  ins('sy_vendor_user',
    ['vendor_user_id','site_id','vendor_id','user_id','role_id','member_nm',
     'vendor_user_mobile','vendor_user_email','is_main','auth_yn','join_date','vendor_user_status_cd','reg_by','reg_date'],
    [mkId('VU', vuSeq++), SITE, VN(vendorIdx), US(uid), RL(roleId),
     adminUsersNms[uid] || '담당자',
     adminUsersPhones[uid] || '010-0000-0000',
     adminUsersEmails[uid] || `user${uid}@demo.com`,
     isMain, isMain === 'Y' ? 'Y' : 'N',
     '2025-01-01',
     [30,37,43,52].includes(uid) ? 'SUSPENDED' : 'ACTIVE',
     REG_BY, REG_DATE]
  );
});

// ================================================================
// 6. sy_vendor_brand — 업체-브랜드 매핑
// ================================================================
sec('6. sy_vendor_brand — 업체-브랜드 매핑');

const vendorBrands = [
  // 패션스타일(1): Nike, Adidas, Puma, NB (스포츠)
  [1,1,'Y',15.0],[1,2,'N',12.0],[1,3,'N',12.0],[1,4,'N',13.0],
  // 트렌드웨어(2): Uniqlo, Zara, H&M (SPA)
  [2,5,'Y',10.0],[2,6,'N',8.0],[2,7,'N',8.0],
  // 에코패션(3): MLB, Descente
  [3,9,'Y',14.0],[3,10,'N',13.0],
  // 럭셔리브랜드(4): ShopJoy OB (자체)
  [4,11,'Y',5.0],
];

let vbSeq = 1;
vendorBrands.forEach(([vid, bid, isMain, rate]) => {
  ins('sy_vendor_brand',
    ['vendor_brand_id','site_id','vendor_id','brand_id','is_main','contract_cd','start_date','commission_rate','use_yn','reg_by','reg_date'],
    [mkId('VB', vbSeq++), SITE, VN(vid), BR(bid), isMain, 'CONSIGN', '2025-01-01', rate, 'Y', REG_BY, REG_DATE]
  );
});

// ================================================================
// 7. sy_vendor_content — 업체 소개/약관
// ================================================================
sec('7. sy_vendor_content — 업체 콘텐츠');

const vendorContents = [
  [1,'INTRO','패션스타일 주식회사 소개','글로벌 스포츠 브랜드 공식 총판','<p>패션스타일 주식회사는 나이키, 아디다스 등 글로벌 스포츠 브랜드의 국내 공식 총판입니다.</p>'],
  [1,'TERMS','이용약관','서비스 이용 약관','<p>제1조 목적: 본 약관은 패션스타일 주식회사의 서비스 이용에 관한 조건을 정합니다.</p>'],
  [2,'INTRO','트렌드웨어 LLC 소개','SPA 브랜드 전문 판매','<p>트렌드웨어는 유니클로, 자라 등 SPA 브랜드를 전문으로 취급합니다.</p>'],
  [3,'INTRO','에코패션 Co. 소개','MLB·데상트 공식 파트너','<p>에코패션은 MLB와 데상트의 공식 파트너사입니다.</p>'],
  [5,'INTRO','CJ대한통운 소개','대한민국 1위 물류 기업','<p>CJ대한통운은 전국 배송망을 보유한 물류 전문 기업입니다.</p>'],
  [9,'INTRO','ShopJoy CS센터 소개','고객 만족 전문 콜센터','<p>ShopJoy CS센터는 24시간 고객 문의를 처리합니다.</p>'],
  [10,'INTRO','ShopJoy 운영팀 소개','쇼핑몰 전문 운영 파트너','<p>ShopJoy 운영팀은 사이트 콘텐츠 및 전시를 담당합니다.</p>'],
  [11,'INTRO','TechMagic IT 소개','IT 인프라 유지보수 전문','<p>TechMagic IT는 서버, 보안, API 연동 유지보수를 담당합니다.</p>'],
];

let vcSeq = 1;
vendorContents.forEach(([vid, typeCd, title, subtitle, html]) => {
  ins('sy_vendor_content',
    ['vendor_content_id','site_id','vendor_id','content_type_cd','vendor_content_title','vendor_content_subtitle',
     'content_html','lang_cd','vendor_content_status_cd','use_yn','sort_ord','reg_by','reg_date'],
    [mkId('VC', vcSeq++), SITE, VN(vid), typeCd, title, subtitle, html, 'ko', 'ACTIVE', 'Y', 0, REG_BY, REG_DATE]
  );
});

// ================================================================
// 8. sy_attach_grp — 첨부파일 그룹
// ================================================================
sec('8. sy_attach_grp — 첨부파일 그룹');

const attachGrps = [
  ['PROD_IMG',      '상품 이미지',    'jpg,jpeg,png,gif,webp', 10485760,  20, '/ec/products/images'],
  ['MEMBER_ID',     '회원 신분증',    'jpg,png,pdf',            5242880,    3, '/ec/members/id'],
  ['INQUIRY_FILE',  '고객문의 첨부',  'jpg,png,pdf,doc,docx',  52428800,   5, '/ec/inquiry'],
  ['CLAIM_EVIDENCE','클레임 증거',    'jpg,png,pdf,mp4,mov',  104857600,  10, '/ec/claims'],
  ['DLIV_PROOF',    '배송 증명',      'jpg,png,pdf',            5242880,    3, '/ec/delivery'],
  ['NOTICE_IMG',    '공지사항 이미지','jpg,png,gif',            5242880,    5, '/sy/notice'],
  ['VENDOR_DOC',    '업체 서류',      'jpg,png,pdf',           20971520,   10, '/sy/vendor/docs'],
  ['PROFILE_IMG',   '프로필 이미지',  'jpg,jpeg,png',           2097152,    1, '/sy/users/profile'],
];

const agIdMap = {};
attachGrps.forEach(([code, nm, ext, maxSize, maxCnt, storagePath], i) => {
  const id = mkId('AG', i + 1);
  agIdMap[code] = id;
  ins('sy_attach_grp',
    ['attach_grp_id','attach_grp_code','attach_grp_nm','file_ext_allow','max_file_size','max_file_count','storage_path','use_yn','sort_ord','reg_by','reg_date'],
    [id, code, nm, ext, maxSize, maxCnt, storagePath, 'Y', i + 1, REG_BY, REG_DATE]
  );
});

// ================================================================
// 9. sy_attach — 샘플 첨부파일
// ================================================================
sec('9. sy_attach — 샘플 첨부파일');

const sampleAttaches = [
  ['PROD_IMG',     'product_main_001.jpg',  320000,  'jpg', 'image/jpeg', '/ec/products/images/prod_main_001.jpg'],
  ['PROD_IMG',     'product_sub_001.jpg',   280000,  'jpg', 'image/jpeg', '/ec/products/images/prod_sub_001.jpg'],
  ['PROD_IMG',     'product_main_002.jpg',  350000,  'jpg', 'image/jpeg', '/ec/products/images/prod_main_002.jpg'],
  ['CLAIM_EVIDENCE','claim_photo_001.jpg',  1200000, 'jpg', 'image/jpeg', '/ec/claims/claim_001.jpg'],
  ['DLIV_PROOF',   'delivery_proof_001.jpg',500000,  'jpg', 'image/jpeg', '/ec/delivery/dliv_001.jpg'],
  ['NOTICE_IMG',   'notice_banner_001.jpg', 450000,  'jpg', 'image/jpeg', '/sy/notice/banner_001.jpg'],
  ['VENDOR_DOC',   'vendor_contract_001.pdf',1500000,'pdf', 'application/pdf','/sy/vendor/docs/contract_001.pdf'],
  ['PROFILE_IMG',  'profile_admin1.jpg',    120000,  'jpg', 'image/jpeg', '/sy/users/profile/admin1.jpg'],
];

sampleAttaches.forEach(([grpCode, fileNm, fileSize, ext, mimeType, url], i) => {
  ins('sy_attach',
    ['attach_id','site_id','attach_grp_id','file_nm','file_size','file_ext','mime_type_cd','attach_url','sort_ord','reg_by','reg_date'],
    [mkId('AT', i + 1), SITE, agIdMap[grpCode], fileNm, fileSize, ext, mimeType, url, i + 1, REG_BY, REG_DATE]
  );
});

// ================================================================
// 10. sy_alarm — 알림
// ================================================================
sec('10. sy_alarm — 알림');

const alarmData = [
  ['주문 접수 완료 알림',     'ORDER',    'KAKAO', 'ALL',    'SENT',    30, 0],
  ['배송 출발 안내',          'DELIVERY', 'KAKAO', 'ALL',    'SENT',    25, 0],
  ['배송 완료 안내',          'DELIVERY', 'SMS',   'ALL',    'SENT',    22, 0],
  ['클레임 접수 확인',        'CLAIM',    'EMAIL', 'ALL',    'SENT',    15, 1],
  ['쿠폰 발급 안내',          'MARKETING','EMAIL', 'GRADE',  'SENT',   200, 3],
  ['봄 시즌 이벤트 공지',     'MARKETING','PUSH',  'ALL',    'SENT',   500, 12],
  ['회원 등급 변경 안내',     'MARKETING','KAKAO', 'MEMBER', 'SENT',     1, 0],
  ['서비스 점검 예고',        'SYSTEM',   'EMAIL', 'ALL',    'PENDING',  0, 0],
  ['신규 결제수단 안내',      'MARKETING','SMS',   'ALL',    'PENDING',  0, 0],
  ['비밀번호 변경 권고',      'SYSTEM',   'EMAIL', 'ALL',    'FAILED',   0, 45],
];

const alarmIds = [];
alarmData.forEach(([title, type, channel, targetType, status, sent, fail], i) => {
  const id = mkId('AL', i + 1);
  alarmIds.push(id);
  ins('sy_alarm',
    ['alarm_id','site_id','alarm_title','alarm_type_cd','channel_cd','target_type_cd',
     'alarm_send_date','alarm_status_cd','alarm_send_count','alarm_fail_count','reg_by','reg_date'],
    [id, SITE, title, type, channel, targetType,
     '2026-04-10 09:00:00', status, sent, fail, US(1), REG_DATE]
  );
});

// ================================================================
// 11. syh_alarm_send_hist — 알림 발송 이력
// ================================================================
sec('11. syh_alarm_send_hist — 알림 발송 이력');

const memberIds = ['MB000001','MB000002','MB000003','MB000004','MB000005'];
let shSeq = 1;
[0,1,2,3,4,5,6].forEach(alarmIdx => {
  for (let m = 0; m < 3; m++) {
    const memberId = memberIds[m % memberIds.length];
    ins('syh_alarm_send_hist',
      ['send_hist_id','site_id','alarm_id','member_id','channel','send_to','send_date','send_hist_status_cd','reg_by','reg_date'],
      [mkId('SH', shSeq++), SITE, alarmIds[alarmIdx], memberId,
       ['KAKAO','SMS','EMAIL'][m % 3],
       ['test@member.com','010-1234-5678','010-9876-5432'][m % 3],
       '2026-04-10 09:00:00', 'SENT', REG_BY, REG_DATE]
    );
  }
});

// ================================================================
// 12. syh_batch_hist / syh_batch_log — 배치 이력
// ================================================================
sec('12. syh_batch_hist / syh_batch_log — 배치 이력');

const batchLogs = [
  [8,'DLIV_STATUS_SYNC',  '배송조회 상태 동기화', '2026-04-10 10:00:06','2026-04-10 10:00:10',  4,'RUNNING',  0, 0, '실행 중...'],
  [3,'EVENT_STATUS_SYNC', '이벤트 상태 동기화',   '2026-04-10 00:00:08','2026-04-10 00:00:16',  8,'SUCCESS',  3, 0, '이벤트 상태 3건 동기화 완료'],
  [9,'STATS_AGGREGATION', '통계 데이터 집계',     '2026-04-10 00:05:22','2026-04-10 00:10:44',322,'SUCCESS',178, 0, '일별 통계 집계 완료 (조회 178건)'],
  [1,'ORDER_AUTO_COMPLETE','주문 자동 완료 처리', '2026-04-10 02:00:05','2026-04-10 02:00:10',  5,'SUCCESS', 12, 0, '주문 자동완료 처리 12건'],
  [2,'COUPON_EXPIRE',     '쿠폰 만료 처리',       '2026-04-10 01:00:03','2026-04-10 01:00:06',  3,'SUCCESS',  7, 0, '만료 쿠폰 처리 7건'],
  [8,'DLIV_STATUS_SYNC',  '배송조회 상태 동기화', '2026-04-10 08:00:06','2026-04-10 08:00:12',  6,'SUCCESS', 34, 0, '배송 상태 업데이트 34건'],
  [8,'DLIV_STATUS_SYNC',  '배송조회 상태 동기화', '2026-04-10 06:00:04','2026-04-10 06:00:08',  4,'SUCCESS', 28, 0, '배송 상태 업데이트 28건'],
  [8,'DLIV_STATUS_SYNC',  '배송조회 상태 동기화', '2026-04-10 04:00:09','2026-04-10 04:00:18',  9,'FAILED',   0, 1, '[ERROR] 택배사 API 응답 시간 초과'],
  [8,'DLIV_STATUS_SYNC',  '배송조회 상태 동기화', '2026-04-10 02:00:05','2026-04-10 02:00:10',  5,'SUCCESS', 21, 0, '배송 상태 업데이트 21건'],
  [3,'EVENT_STATUS_SYNC', '이벤트 상태 동기화',   '2026-04-09 00:00:06','2026-04-09 00:00:12',  6,'SUCCESS',  2, 0, '이벤트 상태 2건 동기화 완료'],
  [1,'ORDER_AUTO_COMPLETE','주문 자동 완료 처리', '2026-04-09 02:00:04','2026-04-09 02:00:08',  4,'SUCCESS',  9, 0, '주문 자동완료 처리 9건'],
  [2,'COUPON_EXPIRE',     '쿠폰 만료 처리',       '2026-04-09 01:00:05','2026-04-09 01:00:10',  5,'SUCCESS',  3, 0, '만료 쿠폰 처리 3건'],
  [5,'ATTACH_CLEANUP',    '미사용 첨부파일 정리', '2026-04-06 03:00:07','2026-04-06 03:00:54', 47,'SUCCESS',128, 0, '첨부파일 삭제 128건 (2.3GB 회수)'],
  [4,'SETTLEMENT_REPORT', '정산 리포트 생성',     '2026-04-01 08:00:12','2026-04-01 08:01:24', 72,'SUCCESS',  1, 0, '3월 정산 리포트 생성 완료'],
  [6,'MEMBER_GRADE_CALC', '회원 등급 재산정',     '2026-04-01 04:00:15','2026-04-01 04:00:50', 35,'SUCCESS', 45, 0, '회원 등급 재산정 완료 (VIP +3)'],
  [7,'CACHE_EXPIRE',      '캐시 자동 소멸',       '2026-04-01 05:00:04','2026-04-01 05:00:08',  4,'SUCCESS', 24, 0, '미사용 캐시 소멸 24건 (₩48,000)'],
  [1,'ORDER_AUTO_COMPLETE','주문 자동 완료 처리', '2026-04-01 02:00:11','2026-04-01 02:00:22', 11,'SUCCESS', 21, 0, '주문 자동완료 처리 21건'],
  [8,'DLIV_STATUS_SYNC',  '배송조회 상태 동기화', '2026-03-31 22:00:08','2026-03-31 22:00:17',  9,'FAILED',   0, 1, '[ERROR] 내부 DB 연결 실패'],
  [9,'STATS_AGGREGATION', '통계 데이터 집계',     '2026-03-31 00:05:18','2026-03-31 00:10:36',318,'SUCCESS',163, 0, '일별 통계 집계 완료 (조회 163건)'],
  [8,'DLIV_STATUS_SYNC',  '배송조회 상태 동기화', '2026-03-31 20:00:03','2026-03-31 20:00:06',  3,'SUCCESS', 19, 0, '배송 상태 업데이트 19건'],
];

batchLogs.forEach(([batchIdx, batchCode, batchNm, runAt, endAt, durMs, status, procCnt, errCnt, msg], i) => {
  const histId = mkId('BH', i + 1);
  const logId  = mkId('BL', i + 1);
  const cols = ['site_id','batch_id','batch_code','batch_nm','run_at','end_at','duration_ms','run_status','proc_count','error_count','message','reg_by','reg_date'];
  const vals = [SITE, BT(batchIdx), batchCode, batchNm, runAt, endAt, durMs, status, procCnt, errCnt, msg, REG_BY, REG_DATE];
  ins('syh_batch_hist', ['batch_hist_id', ...cols], [histId, ...vals]);
  ins('syh_batch_log',  ['batch_log_id',  ...cols], [logId,  ...vals]);
});

// ================================================================
// 13. sy_bbm — 게시판 마스터
// ================================================================
sec('13. sy_bbm — 게시판 마스터');

const bbmData = [
  ['NOTICE',      '공지사항',   'NORMAL', 'N','N','N','HTML','ALL'],
  ['FAQ',         '자주묻는질문','FAQ',   'N','N','N','HTML','ALL'],
  ['QNA',         '1:1문의',    'QNA',   'Y','Y','N','TEXT','MEMBER'],
  ['EVENT_BOARD', '이벤트',     'NORMAL','Y','Y','Y','HTML','ALL'],
  ['ADMIN_NOTICE','관리자공지', 'NORMAL', 'N','N','N','HTML','ADMIN'],
];

const bbmIdMap = {};
bbmData.forEach(([code, nm, type, comment, attach, like, contentType, scope], i) => {
  const id = mkId('BBM', i + 1).replace('BBM0','BBM').padEnd(21);
  const bbmId = 'BBM' + String(i+1).padStart(6,'0');
  bbmIdMap[code] = bbmId;
  ins('sy_bbm',
    ['bbm_id','site_id','bbm_code','bbm_nm','bbm_type_cd','allow_comment','allow_attach','allow_like',
     'content_type_cd','scope_type_cd','sort_ord','use_yn','reg_by','reg_date'],
    [bbmId, SITE, code, nm, type, comment, attach, like, contentType, scope, i+1, 'Y', US(1), REG_DATE]
  );
});

// ================================================================
// 14. sy_bbs — 게시글
// ================================================================
sec('14. sy_bbs — 게시글');

const bbsPosts = [
  [bbmIdMap['NOTICE'],      null, '서비스 이용 약관 개정 안내 (2026-04-01)','<p>서비스 이용 약관이 개정되었습니다. 주요 변경사항을 확인해주세요.</p>',  230, 0, 0,'Y','ACTIVE'],
  [bbmIdMap['NOTICE'],      null, '개인정보처리방침 개정 안내',               '<p>개인정보처리방침이 2026년 3월 1일부로 개정되었습니다.</p>',              180, 0, 0,'N','ACTIVE'],
  [bbmIdMap['FAQ'],         null, '주문 취소는 어떻게 하나요?',               '<p>마이페이지 &gt; 주문내역에서 취소 신청이 가능합니다.</p>',               450, 0, 0,'N','ACTIVE'],
  [bbmIdMap['FAQ'],         null, '교환/반품 신청 방법을 알려주세요',         '<p>배송 완료 후 7일 이내 클레임 신청이 가능합니다.</p>',                    380, 0, 0,'N','ACTIVE'],
  [bbmIdMap['FAQ'],         null, '쿠폰은 어디서 사용하나요?',               '<p>결제 단계에서 쿠폰을 선택하여 사용할 수 있습니다.</p>',                  290, 0, 0,'N','ACTIVE'],
  [bbmIdMap['EVENT_BOARD'], null, '봄 시즌 기획전 이벤트 안내',              '<p>4월 한 달간 봄 신상품 최대 30% 할인 행사를 진행합니다.</p>',            820, 42,15,'Y','ACTIVE'],
  [bbmIdMap['EVENT_BOARD'], null, '회원 등급별 추가 적립 이벤트',            '<p>VIP 회원 3% 추가 적립, 골드 회원 2% 추가 적립 혜택을 드립니다.</p>',   640, 38,22,'N','ACTIVE'],
  [bbmIdMap['ADMIN_NOTICE'],null, '[운영] 2026년 4분기 배포 일정 공유',      '<p>개발팀 배포 일정 및 영향 범위를 공유합니다.</p>',                        55, 0, 0,'Y','ACTIVE'],
  [bbmIdMap['ADMIN_NOTICE'],null, '[보안] 정기 취약점 점검 결과 보고',       '<p>2026년 1분기 취약점 점검 결과: 위험 0건, 주의 2건 처리 완료.</p>',       43, 0, 0,'N','ACTIVE'],
  [bbmIdMap['QNA'],  'MB000001', '배송이 너무 늦어요',                       '<p>5일이 지났는데도 배송이 안 왔습니다. 확인 부탁드립니다.</p>',             12, 0, 0,'N','ACTIVE'],
  [bbmIdMap['QNA'],  'MB000002', '쿠폰 적용이 안 됩니다',                   '<p>결제 시 쿠폰이 적용되지 않습니다. 도와주세요.</p>',                        8, 0, 0,'N','ACTIVE'],
];

bbsPosts.forEach(([bbmId, memberId, title, content, viewCnt, likeCnt, commentCnt, isFixed, status], i) => {
  const bbsId = 'BBS' + String(i+1).padStart(6,'0');
  ins('sy_bbs',
    ['bbs_id','site_id','bbm_id','member_id','author_nm','bbs_title','content_html',
     'view_count','like_count','comment_count','is_fixed','bbs_status_cd','reg_by','reg_date'],
    [bbsId, SITE, bbmId, memberId, memberId ? '회원' : '운영자', title, content,
     viewCnt, likeCnt, commentCnt, isFixed, status, memberId || US(1), REG_DATE]
  );
});

// ================================================================
// 15. sy_contact — 고객문의
// ================================================================
sec('15. sy_contact — 고객문의');

const contactData = [
  ['MB000001','김회원','배송지연','배송이 너무 늦습니다',    '주문 후 7일이 지났는데 배송이 안 왔어요. 확인해주세요.','DONE',   '배송 조회 결과 오늘 출고 예정입니다. 양해 부탁드립니다.', US(19)],
  ['MB000002','이고객','상품문의','상품 사이즈 문의',         '이 상품 L사이즈 재입고 예정이 있나요?',                  'DONE',   '다음달 초 재입고 예정입니다.',                           US(19)],
  ['MB000003','박구매','결제오류','결제가 되지 않습니다',     '카드 결제 시 오류가 발생합니다.',                        'DONE',   '일시적 오류였습니다. 현재 정상 처리됩니다.',             US(39)],
  ['MB000004','최소비','반품문의','반품 접수 방법이 궁금해요','반품은 어떻게 신청하나요?',                             'DONE',   '마이페이지 > 클레임신청에서 반품 접수 가능합니다.',      US(39)],
  ['MB000005','정회원','쿠폰문의','쿠폰이 적용되지 않아요',   '쿠폰 코드 입력했는데 적용이 안 됩니다.',                 'DONE',   '쿠폰 유효기간이 만료된 것으로 확인됩니다.',             US(41)],
  ['MB000001','김회원','배송문의','오배송 신고합니다',         '다른 상품이 왔습니다.',                                  'IN_PROGRESS',null, null],
  ['MB000002','이고객','상품불량','상품에 하자가 있습니다',   '구매한 상품에 흠집이 있습니다.',                         'RECEIVED',null, null],
  ['MB000003','박구매','서비스','회원 등급 문의',             'VIP 기준이 무엇인가요?',                                 'RECEIVED',null, null],
];

let cnSeq = 1;
contactData.forEach(([memberId, memberNm, category, title, content, status, answer, answerUserId]) => {
  ins('sy_contact',
    ['contact_id','site_id','member_id','member_nm','category_cd','contact_title','contact_content',
     'contact_status_cd','contact_answer','answer_user_id','answer_date','contact_date','reg_by','reg_date'],
    [mkId('CN', cnSeq++), SITE, memberId, memberNm, category, title, content,
     status, answer, answerUserId, answer ? '2026-04-10 14:00:00' : null,
     '2026-04-09 10:00:00', memberId, REG_DATE]
  );
});

// ================================================================
// 16. sy_notice — 공지사항
// ================================================================
sec('16. sy_notice — 공지사항');

const noticeData = [
  ['서비스 점검 안내 (4월 15일 새벽 2시~4시)','URGENT','Y','<p>서비스 점검이 예정되어 있습니다.</p>','2026-04-14 00:00:00','2026-04-15 23:59:59','ACTIVE',250],
  ['봄 시즌 기획전 오픈 안내',               'NORMAL','N','<p>봄 기획전이 시작되었습니다.</p>',       '2026-04-01 00:00:00','2026-05-31 23:59:59','ACTIVE',430],
  ['개인정보처리방침 개정 안내',             'NORMAL','N','<p>개인정보처리방침이 개정되었습니다.</p>','2026-03-01 00:00:00',null,                  'ACTIVE',320],
  ['긴급 보안 업데이트 안내',               'URGENT','Y','<p>보안 업데이트가 완료되었습니다.</p>',   '2026-02-10 00:00:00','2026-02-15 23:59:59','INACTIVE',180],
  ['신규 결제수단 추가 안내',               'NORMAL','N','',                                        null,                 null,                  'INACTIVE',  0],
];

noticeData.forEach(([title, typeCd, isFixed, html, startDate, endDate, status, viewCnt], i) => {
  ins('sy_notice',
    ['notice_id','site_id','notice_title','notice_type_cd','is_fixed','content_html',
     'start_date','end_date','notice_status_cd','view_count','reg_by','reg_date'],
    [mkId('NT', i + 1), SITE, title, typeCd, isFixed, html,
     startDate, endDate, status, viewCnt, US(1), REG_DATE]
  );
});

// ================================================================
// 17. sy_voc — VOC 분류
// ================================================================
sec('17. sy_voc — VOC 분류');

const vocData = [
  ['DELIVERY','DELIVERY_DELAY','배송 지연','주문 후 예상 배송일보다 늦게 도착하는 경우'],
  ['DELIVERY','DELIVERY_LOST','배송 분실','배송 중 물건이 분실된 경우'],
  ['DELIVERY','DELIVERY_DAMAGE','배송 파손','배송 중 물건이 파손된 경우'],
  ['PRODUCT','PRODUCT_DEFECT','상품 불량','수령 상품에 제조 불량이 있는 경우'],
  ['PRODUCT','PRODUCT_WRONG','상품 오배송','주문과 다른 상품이 배송된 경우'],
  ['PRODUCT','PRODUCT_INFO','상품 정보 오류','상세페이지 내용과 다른 상품인 경우'],
  ['PAYMENT','PAYMENT_FAIL','결제 실패','결제 처리 중 오류가 발생한 경우'],
  ['PAYMENT','PAYMENT_REFUND','환불 요청','결제 후 환불이 필요한 경우'],
  ['CLAIM','CLAIM_CANCEL','취소 클레임','주문 취소 관련 문의'],
  ['CLAIM','CLAIM_RETURN','반품 클레임','반품 처리 관련 문의'],
  ['CLAIM','CLAIM_EXCHANGE','교환 클레임','교환 처리 관련 문의'],
  ['SERVICE','SERVICE_MEMBER','회원 서비스','회원 가입/탈퇴/정보변경 관련'],
  ['ETC','ETC','기타','그 외 기타 문의 사항'],
];

vocData.forEach(([master, detail, nm, content], i) => {
  ins('sy_voc',
    ['voc_id','site_id','voc_master_cd','voc_detail_cd','voc_nm','voc_content','use_yn','reg_by','reg_date'],
    [mkId('VC', 100 + i), SITE, master, detail, nm, content, 'Y', REG_BY, REG_DATE]
  );
});

// ================================================================
// 18. sy_i18n + sy_i18n_msg — 다국어
// ================================================================
sec('18. sy_i18n + sy_i18n_msg — 다국어');

const i18nData = [
  ['common.btn.save',    'COMMON','button','저장',        'Save'],
  ['common.btn.cancel',  'COMMON','button','취소',        'Cancel'],
  ['common.btn.delete',  'COMMON','button','삭제',        'Delete'],
  ['common.btn.search',  'COMMON','button','검색',        'Search'],
  ['common.btn.reset',   'COMMON','button','초기화',      'Reset'],
  ['common.btn.add',     'COMMON','button','추가',        'Add'],
  ['common.btn.edit',    'COMMON','button','수정',        'Edit'],
  ['common.btn.close',   'COMMON','button','닫기',        'Close'],
  ['common.btn.confirm', 'COMMON','button','확인',        'Confirm'],
  ['common.btn.back',    'COMMON','button','뒤로',        'Back'],
  ['common.label.status','COMMON','label', '상태',        'Status'],
  ['common.label.name',  'COMMON','label', '이름',        'Name'],
  ['common.label.date',  'COMMON','label', '날짜',        'Date'],
  ['common.msg.required','COMMON','message','필수 항목입니다','This field is required'],
  ['common.msg.saved',   'COMMON','message','저장되었습니다','Saved successfully'],
  ['common.msg.deleted', 'COMMON','message','삭제되었습니다','Deleted successfully'],
  ['common.msg.error',   'COMMON','message','오류가 발생했습니다','An error occurred'],
  ['common.msg.confirm_delete','COMMON','message','삭제하시겠습니까?','Are you sure to delete?'],
  ['error.404',          'COMMON','error', '페이지를 찾을 수 없습니다','Page not found'],
  ['error.500',          'COMMON','error', '서버 오류가 발생했습니다','Internal server error'],
];

let imSeq = 1;
i18nData.forEach(([key, scope, category, ko, en], i) => {
  const i18nId = mkId('I8N', i + 1);
  ins('sy_i18n',
    ['i18n_id','i18n_key','i18n_scope_cd','i18n_category','sort_ord','use_yn','reg_by','reg_date'],
    [i18nId, key, scope, category, i + 1, 'Y', REG_BY, REG_DATE]
  );
  ins('sy_i18n_msg',
    ['i18n_msg_id','i18n_id','lang_cd','i18n_msg','reg_by','reg_date'],
    [mkId('IM', imSeq++), i18nId, 'ko', ko, REG_BY, REG_DATE]
  );
  ins('sy_i18n_msg',
    ['i18n_msg_id','i18n_id','lang_cd','i18n_msg','reg_by','reg_date'],
    [mkId('IM', imSeq++), i18nId, 'en', en, REG_BY, REG_DATE]
  );
});

// ================================================================
// 19. sy_template — 발송 템플릿
// ================================================================
sec('19. sy_template — 발송 템플릿');

const templates = [
  ['EMAIL','ORDER_CONFIRM',    '주문 확인 이메일',       '[ShopJoy] 주문이 접수되었습니다',  '<p>안녕하세요 {member_nm}님, 주문번호 {order_no}가 접수되었습니다.</p>'],
  ['EMAIL','DLIV_SHIPPED',     '배송 출발 이메일',       '[ShopJoy] 상품이 출발하였습니다',  '<p>주문번호 {order_no} 상품이 {carrier}로 출발하였습니다. 운송장: {tracking_no}</p>'],
  ['EMAIL','CLAIM_RECEIVED',   '클레임 접수 이메일',     '[ShopJoy] 클레임이 접수되었습니다','<p>클레임 번호 {claim_no}가 접수되었습니다. 처리 결과를 안내드리겠습니다.</p>'],
  ['EMAIL','PASSWORD_RESET',   '비밀번호 재설정 이메일', '[ShopJoy] 비밀번호 재설정 안내',  '<p>비밀번호 재설정 링크: <a href="{reset_url}">{reset_url}</a></p>'],
  ['EMAIL','JOIN_WELCOME',     '가입 환영 이메일',       '[ShopJoy] 회원가입을 환영합니다',  '<p>안녕하세요 {member_nm}님! 회원가입을 진심으로 환영합니다.</p>'],
  ['SMS', 'ORDER_SMS',         '주문 접수 SMS',          null,                               '[ShopJoy] 주문({order_no}) 접수완료. 결제금액 {pay_amt}원'],
  ['SMS', 'DLIV_SMS',          '배송 출발 SMS',          null,                               '[ShopJoy] {order_no} 상품 발송. {carrier}/{tracking_no}'],
  ['KAKAO','ORDER_KAKAO',      '주문 접수 알림톡',       null,                               '주문번호: {order_no}\n결제금액: {pay_amt}원\n배송예정: {dliv_date}'],
  ['KAKAO','DLIV_KAKAO',       '배송 출발 알림톡',       null,                               '배송 출발 안내\n운송장: {tracking_no}\n택배사: {carrier}'],
  ['PUSH', 'EVENT_PUSH',       '이벤트 푸시 알림',       null,                               '{event_nm} 이벤트가 시작되었습니다! 지금 확인하세요.'],
];

templates.forEach(([typeCd, code, nm, subject, content], i) => {
  ins('sy_template',
    ['template_id','site_id','template_type_cd','template_code','template_nm','template_subject','template_content','use_yn','reg_by','reg_date'],
    [mkId('TP', i + 1), SITE, typeCd, code, nm, subject, content, 'Y', US(1), REG_DATE]
  );
});

// ================================================================
// 20. sy_path — 경로 트리 (BIGSERIAL — path_id 생략)
// ================================================================
sec('20. sy_path — 경로 트리');

const pathData = [
  [null,'sy_brand','스포츠',   1,'Y'],
  [1,   'sy_brand','글로벌',   1,'Y'],
  [1,   'sy_brand','국내',     2,'Y'],
  [null,'sy_brand','패션',     2,'Y'],
  [4,   'sy_brand','SPA',      1,'Y'],
  [4,   'sy_brand','데님',     2,'Y'],
  [null,'sy_code_grp','회원',  1,'Y'],
  [null,'sy_code_grp','주문',  2,'Y'],
  [null,'sy_code_grp','클레임',3,'Y'],
  [null,'sy_code_grp','상품',  4,'Y'],
  [null,'sy_code_grp','전시',  5,'Y'],
  [null,'sy_prop','site',      1,'Y'],
  [12,  'sy_prop','email',     1,'Y'],
  [13,  'sy_prop','smtp',      1,'Y'],
  [null,'sy_prop','order',     2,'Y'],
  [null,'sy_prop','feature',   3,'Y'],
];

// sy_path uses BIGSERIAL so we just omit path_id; need OVERRIDING SYSTEM VALUE or just let DB auto
// Use explicit path_id values for self-reference
pathData.forEach(([parentId, bizCd, label, sortOrd, useYn], i) => {
  const pathId = i + 1;
  const actualParentId = parentId; // raw numeric ID
  lines.push(
    `INSERT INTO ${SCHEMA}.sy_path (path_id, biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) ` +
    `OVERRIDING SYSTEM VALUE VALUES ` +
    `(${pathId}, '${bizCd}', ${actualParentId === null ? 'NULL' : actualParentId}, '${label}', ${sortOrd}, '${useYn}', '${REG_BY}', '${REG_DATE}') ` +
    `ON CONFLICT DO NOTHING;`
  );
});

// ================================================================
// 21. sy_prop — 시스템 프로퍼티 (BIGSERIAL)
// ================================================================
sec('21. sy_prop — 시스템 프로퍼티');

const propData = [
  ['site.email.smtp','smtp_host',   '이메일 SMTP 호스트', 'smtp.shopjoy.kr',      'STRING'],
  ['site.email.smtp','smtp_port',   '이메일 SMTP 포트',   '587',                  'NUMBER'],
  ['site.email.smtp','smtp_user',   'SMTP 계정',          'noreply@shopjoy.kr',   'STRING'],
  ['site.email.smtp','from_name',   '발신자명',           'ShopJoy',              'STRING'],
  ['site.email',     'admin_email', '운영 이메일',        'admin@shopjoy.kr',     'STRING'],
  ['site.email',     'cs_email',    'CS 이메일',          'cs@shopjoy.kr',        'STRING'],
  ['order',          'auto_complete_days','자동완료일수',  '7',                   'NUMBER'],
  ['order',          'cancel_limit_days','취소가능일수',   '3',                   'NUMBER'],
  ['order',          'max_order_qty',    '최대주문수량',   '99',                  'NUMBER'],
  ['feature',        'coupon_enabled',   '쿠폰기능 사용',  'true',                'BOOLEAN'],
  ['feature',        'cash_enabled',     '캐시기능 사용',  'true',                'BOOLEAN'],
  ['feature',        'event_enabled',    '이벤트기능 사용','true',                'BOOLEAN'],
  ['feature',        'review_enabled',   '리뷰기능 사용',  'true',                'BOOLEAN'],
  ['feature',        'chat_enabled',     '채팅기능 사용',  'true',                'BOOLEAN'],
  ['feature',        'i18n_enabled',     '다국어기능 사용','false',               'BOOLEAN'],
  ['site',           'site_nm',          '사이트명',       'ShopJoy',             'STRING'],
  ['site',           'site_url',         '사이트 URL',     'https://shopjoy.kr',  'STRING'],
  ['site',           'cdn_host',         'CDN 호스트',     'cdn.shopjoy.kr',      'STRING'],
  ['site',           'file_max_size_mb', '최대 파일크기MB','50',                  'NUMBER'],
  ['site',           'session_timeout',  '세션 타임아웃(분)','60',               'NUMBER'],
];

propData.forEach(([dispPath, propKey, propLabel, propValue, propTypeCd], i) => {
  const propId = i + 1;
  lines.push(
    `INSERT INTO ${SCHEMA}.sy_prop (prop_id, site_id, disp_path, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, reg_by, reg_date) ` +
    `OVERRIDING SYSTEM VALUE VALUES ` +
    `(${propId}, '${SITE}', '${dispPath}', '${propKey}', '${propValue}', '${propLabel}', '${propTypeCd}', ${i+1}, 'Y', '${REG_BY}', '${REG_DATE}') ` +
    `ON CONFLICT DO NOTHING;`
  );
});

// ================================================================
// 22. syh_api_log — 외부 API 연동 로그
// ================================================================
sec('22. syh_api_log — 외부 API 연동 로그');

const apiLogs = [
  ['PG','결제승인','POST','/toss/v1/payments/confirm',   200,'SUCCESS', 245,'ORDER','ORD-2026-001'],
  ['PG','결제취소','POST','/toss/v1/payments/cancel',    200,'SUCCESS', 180,'ORDER','ORD-2026-003'],
  ['PG','결제승인','POST','/kakao/v1/payment/approve',   200,'SUCCESS', 312,'ORDER','ORD-2026-005'],
  ['PG','결제승인','POST','/naver/v1/payments/apply',    200,'SUCCESS', 290,'ORDER','ORD-2026-008'],
  ['PG','결제승인','POST','/toss/v1/payments/confirm',   500,'FAIL',    3020,'ORDER','ORD-2026-010'],
  ['LOGISTICS','운송장등록','POST','/cjlogistics/api/waybill',200,'SUCCESS', 456,'DLIV','DLIV-016'],
  ['LOGISTICS','배송조회','GET', '/cjlogistics/api/track',   200,'SUCCESS',  89,'DLIV','DLIV-017'],
  ['LOGISTICS','운송장등록','POST','/lottegls/api/waybill',  200,'SUCCESS', 523,'DLIV','DLIV-020'],
  ['LOGISTICS','배송조회','GET', '/hanjin/api/track',        200,'SUCCESS', 112,'DLIV','DLIV-021'],
  ['KAKAO','알림톡발송','POST','/kakao/alimtalk/v2/send',    200,'SUCCESS', 145,'ORDER','ORD-2026-001'],
  ['SMS','SMS발송','POST',  '/koreatel/sms/v1/send',         200,'SUCCESS',  88,'ORDER','ORD-2026-002'],
  ['NAVER','검색광고','GET', '/naver/v1/ads/stats',          200,'SUCCESS', 324,'PUSH', null],
  ['PG','환불처리','POST',  '/toss/v1/payments/refund',      200,'SUCCESS', 198,'CLAIM','CLM-2026-001'],
  ['PG','환불처리','POST',  '/kakao/v1/payment/cancel',      200,'SUCCESS', 201,'CLAIM','CLM-2026-002'],
  ['LOGISTICS','배송조회','GET', '/cjlogistics/api/track',   504,'FAIL',  30000,'DLIV','DLIV-022'],
];

apiLogs.forEach(([apiType, apiNm, method, endpoint, httpStatus, resultCd, elapsed, refType, refId], i) => {
  ins('syh_api_log',
    ['log_id','site_id','api_type_cd','api_nm','method_cd','endpoint','http_status','result_cd',
     'elapsed_ms','ref_type_cd','ref_id','call_date','reg_by','reg_date'],
    [mkId('ALOG', i + 1), SITE, apiType, apiNm, method, endpoint, httpStatus, resultCd,
     elapsed, refType, refId, '2026-04-10 09:00:00', REG_BY, REG_DATE]
  );
});

// ================================================================
// 23. syh_send_email_log — 이메일 발송 로그
// ================================================================
sec('23. syh_send_email_log — 이메일 발송 로그');

const emailLogs = [
  ['TP000001','MB000001','member1@demo.com','주문 접수 완료 안내',     'SUCCESS','ORDER','ORD-2026-001'],
  ['TP000002','MB000001','member1@demo.com','배송 출발 안내',           'SUCCESS','DLIV', 'DLIV-016'],
  ['TP000003','MB000001','member1@demo.com','클레임 접수 안내',         'SUCCESS','CLAIM','CLM-2026-001'],
  ['TP000004','MB000002','member2@demo.com','비밀번호 재설정 링크',     'SUCCESS','JOIN', null],
  ['TP000005','MB000001','member1@demo.com','회원가입 환영 이메일',     'SUCCESS','JOIN', null],
  ['TP000001','MB000003','member3@demo.com','주문 접수 완료 안내',     'SUCCESS','ORDER','ORD-2026-005'],
  ['TP000002','MB000003','member3@demo.com','배송 출발 안내',           'SUCCESS','DLIV', 'DLIV-020'],
  ['TP000001','MB000004','member4@demo.com','주문 접수 완료 안내',     'SUCCESS','ORDER','ORD-2026-008'],
  ['TP000001','MB000005','member5@demo.com','봄 시즌 이벤트 안내',     'SUCCESS','ORDER',null],
  ['TP000001','MB000006','member6@demo.com','주문 접수 완료 안내',     'FAIL',   'ORDER','ORD-2026-010'],
];

emailLogs.forEach(([templateId, memberId, toAddr, subject, resultCd, refType, refId], i) => {
  ins('syh_send_email_log',
    ['log_id','site_id','template_id','template_code','member_id','from_addr','to_addr',
     'subject','result_cd','send_date','ref_type_cd','ref_id','reg_by','reg_date'],
    [mkId('EL', i + 1), SITE, templateId, 'ORDER_CONFIRM', memberId,
     'noreply@shopjoy.kr', toAddr, subject, resultCd,
     '2026-04-10 09:00:00', refType, refId, REG_BY, REG_DATE]
  );
});

// ================================================================
// 24. syh_send_msg_log — SMS/카카오 발송 로그
// ================================================================
sec('24. syh_send_msg_log — SMS/카카오 발송 로그');

const msgLogs = [
  ['KAKAO','TP000008','MB000001','010-1000-0001','주문 접수 알림톡',   'SUCCESS','ORDER','ORD-2026-001'],
  ['SMS',  'TP000006','MB000001','010-1000-0001','주문 결제 확인 SMS', 'SUCCESS','ORDER','ORD-2026-001'],
  ['KAKAO','TP000009','MB000001','010-1000-0001','배송 출발 알림톡',   'SUCCESS','DLIV', 'DLIV-016'],
  ['KAKAO','TP000008','MB000002','010-2000-0001','주문 접수 알림톡',   'SUCCESS','ORDER','ORD-2026-005'],
  ['SMS',  'TP000006','MB000002','010-2000-0001','주문 결제 확인 SMS', 'SUCCESS','ORDER','ORD-2026-005'],
  ['KAKAO','TP000008','MB000003','010-3000-0001','주문 접수 알림톡',   'SUCCESS','ORDER','ORD-2026-008'],
  ['KAKAO','TP000009','MB000003','010-3000-0001','배송 출발 알림톡',   'SUCCESS','DLIV', 'DLIV-020'],
  ['SMS',  'TP000006','MB000004','010-4000-0001','주문 결제 확인 SMS', 'SUCCESS','ORDER','ORD-2026-012'],
  ['KAKAO','TP000010','MB000005','010-5000-0001','이벤트 푸시',        'SUCCESS','ORDER',null],
  ['SMS',  'TP000006','MB000006','010-6000-0001','SMS 발송 실패',      'FAIL',   'ORDER','ORD-2026-010'],
];

msgLogs.forEach(([channel, templateId, memberId, phone, content, resultCd, refType, refId], i) => {
  ins('syh_send_msg_log',
    ['log_id','site_id','channel_cd','template_id','member_id','recv_phone','content',
     'result_cd','send_date','ref_type_cd','ref_id','reg_by','reg_date'],
    [mkId('ML', i + 1), SITE, channel, templateId, memberId, phone, content,
     resultCd, '2026-04-10 09:00:00', refType, refId, REG_BY, REG_DATE]
  );
});

// ================================================================
// 25. syh_user_login_hist — 관리자 로그인 이력
// ================================================================
sec('25. syh_user_login_hist — 관리자 로그인 이력');

const loginHists = [
  [1,'2026-04-07 09:12:00','121.165.30.11','PC / Chrome',  'SUCCESS'],
  [1,'2026-04-05 22:44:00','121.165.30.11','Mobile / Safari','SUCCESS'],
  [1,'2026-04-03 14:28:00','121.165.30.11','PC / Chrome',  'SUCCESS'],
  [1,'2026-03-28 08:05:00','203.248.12.99','PC / Edge',    'FAIL'],
  [1,'2026-03-20 17:33:00','121.165.30.11','PC / Chrome',  'SUCCESS'],
  [2,'2026-04-05 11:30:00','59.6.102.45',  'Mobile / Chrome','SUCCESS'],
  [2,'2026-03-29 19:15:00','59.6.102.45',  'Mobile / Chrome','SUCCESS'],
  [3,'2026-04-03 10:20:00','175.209.45.6', 'PC / Chrome',  'SUCCESS'],
  [3,'2026-03-25 16:40:00','175.209.45.6', 'PC / Firefox', 'SUCCESS'],
  [4,'2026-04-06 13:55:00','211.36.133.77','Mobile / Safari','SUCCESS'],
  [4,'2026-03-18 09:02:00','211.36.133.77','PC / Chrome',  'SUCCESS'],
  [6,'2026-04-07 08:44:00','106.101.22.55','PC / Chrome',  'SUCCESS'],
  [6,'2026-04-01 21:10:00','106.101.22.55','Mobile / Chrome','SUCCESS'],
  [8,'2026-04-07 07:58:00','14.52.88.120', 'PC / Chrome',  'SUCCESS'],
  [8,'2026-04-04 23:11:00','14.52.88.120', 'Mobile / Safari','SUCCESS'],
  [11,'2026-04-10 09:00:00','10.0.0.1',    'PC / Chrome',  'SUCCESS'],
  [19,'2026-04-10 11:00:00','10.0.0.5',    'PC / Chrome',  'SUCCESS'],
];

loginHists.forEach(([uid, loginDate, ip, device, resultCd], i) => {
  ins('syh_user_login_hist',
    ['login_hist_id','site_id','user_id','login_date','ip','device','result_cd','reg_by','reg_date'],
    [mkId('UH', i + 1), SITE, US(uid), loginDate, ip, device, resultCd, REG_BY, REG_DATE]
  );
});

// ================================================================
// 26. syh_user_login_log — 상세 로그인 로그
// ================================================================
sec('26. syh_user_login_log — 상세 로그인 로그');

const loginLogs = [
  [1,'admin1','2026-04-10 09:00:00','SUCCESS',0,'121.165.30.11','Mozilla/5.0','Windows','Chrome'],
  [2,'admin2','2026-04-10 08:45:00','SUCCESS',0,'59.6.102.45','Mozilla/5.0','Mac','Safari'],
  [3,'oper1', '2026-04-09 17:30:00','SUCCESS',0,'175.209.45.6','Mozilla/5.0','Windows','Chrome'],
  [4,'oper2', '2026-04-10 09:15:00','SUCCESS',0,'211.36.133.77','Mozilla/5.0','Android','Chrome'],
  [5,'sales1','2026-04-08 18:00:00','SUCCESS',0,'106.101.22.55','Mozilla/5.0','Windows','Edge'],
  [null,'unknwn','2026-04-08 07:00:00','FAIL_PWD',1,'192.168.1.100','Mozilla/5.0','Windows','Chrome'],
  [null,'unknwn','2026-04-08 07:01:00','FAIL_PWD',2,'192.168.1.100','Mozilla/5.0','Windows','Chrome'],
  [null,'unknwn','2026-04-08 07:02:00','FAIL_PWD',3,'192.168.1.100','Mozilla/5.0','Windows','Chrome'],
  [11,'sysadmin','2026-04-10 09:00:00','SUCCESS',0,'10.0.0.1','Mozilla/5.0','Windows','Chrome'],
  [19,'csmgr',   '2026-04-10 11:00:00','SUCCESS',0,'10.0.0.5','Mozilla/5.0','Mac','Safari'],
  [48,'progrep', '2026-04-10 09:00:00','SUCCESS',0,'10.10.0.1','Mozilla/5.0','Linux','Firefox'],
  [1,'admin1','2026-04-09 09:00:00','SUCCESS',0,'121.165.30.11','Mozilla/5.0','Windows','Chrome'],
  [2,'admin2','2026-04-09 08:30:00','SUCCESS',0,'59.6.102.45','Mozilla/5.0','Mac','Chrome'],
  [3,'oper1', '2026-04-08 17:00:00','SUCCESS',0,'175.209.45.6','Mozilla/5.0','Windows','Chrome'],
];

loginLogs.forEach(([uid, loginId, loginDate, resultCd, failCnt, ip, device, os, browser], i) => {
  ins('syh_user_login_log',
    ['log_id','site_id','user_id','login_id','login_date','result_cd','fail_cnt',
     'ip','device','os','browser','reg_by','reg_date'],
    [mkId('UL', i + 1), SITE, uid ? US(uid) : null, loginId, loginDate, resultCd, failCnt,
     ip, device, os, browser, REG_BY, REG_DATE]
  );
});

// ================================================================
// 27. syh_user_token_log — 토큰 이력
// ================================================================
sec('27. syh_user_token_log — 토큰 이력');

const tokenLogs = [
  [1,'ISSUE',  'ACCESS',  'acc_hash_admin1_20260410_1', '2026-04-10 10:00:00','121.165.30.11'],
  [1,'ISSUE',  'REFRESH', 'ref_hash_admin1_20260410_1', '2026-04-24 09:00:00','121.165.30.11'],
  [2,'ISSUE',  'ACCESS',  'acc_hash_admin2_20260410_1', '2026-04-10 09:45:00','59.6.102.45'],
  [2,'ISSUE',  'REFRESH', 'ref_hash_admin2_20260410_1', '2026-04-24 08:45:00','59.6.102.45'],
  [3,'ISSUE',  'ACCESS',  'acc_hash_oper1_20260410_1',  '2026-04-10 08:30:00','175.209.45.6'],
  [3,'REFRESH','ACCESS',  'acc_hash_oper1_20260410_2',  '2026-04-10 10:30:00','175.209.45.6'],
  [4,'ISSUE',  'ACCESS',  'acc_hash_oper2_20260410_1',  '2026-04-10 09:15:00','211.36.133.77'],
  [11,'ISSUE', 'ACCESS',  'acc_hash_sysadmin_20260410', '2026-04-10 10:00:00','10.0.0.1'],
  [11,'ISSUE', 'REFRESH', 'ref_hash_sysadmin_20260410', '2026-04-24 09:00:00','10.0.0.1'],
  [1,'REVOKE', 'ACCESS',  'acc_hash_admin1_20260409_1', '2026-04-09 18:00:00','121.165.30.11'],
  [1,'EXPIRE', 'REFRESH', 'ref_hash_admin1_20260409_1', '2026-04-09 18:30:00','121.165.30.11'],
  [48,'ISSUE', 'ACCESS',  'acc_hash_progrep_20260410',  '2026-04-10 09:00:00','10.10.0.1'],
  [48,'REVOKE','ACCESS',  'acc_hash_progrep_20260410',  '2026-04-10 17:00:00','10.10.0.1'],
];

tokenLogs.forEach(([uid, action, tokenType, token, tokenExp, ip], i) => {
  ins('syh_user_token_log',
    ['log_id','site_id','user_id','action_cd','token_type_cd','token','token_exp',
     'ip','reg_by','reg_date'],
    [mkId('TL', i + 1), SITE, US(uid), action, tokenType, token, tokenExp,
     ip, REG_BY, REG_DATE]
  );
});

// ================================================================
// 출력
// ================================================================
const header = [
  '-- ================================================================',
  '-- sy_* / syh_* 시스템 도메인 샘플 데이터',
  '-- 생성: generate_sample_sql_sy.js',
  '-- 스키마: shopjoy_2604',
  '-- 전제: generate_sample_sql.js 실행 완료',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_sy.sql');
fs.writeFileSync(outFile, output, 'utf8');

const cnt = lines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: ${cnt}개 INSERT → ${outFile}`);
