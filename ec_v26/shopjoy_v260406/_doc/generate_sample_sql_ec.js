/**
 * AdminData.js → PostgreSQL INSERT SQL 생성기 (EC 도메인 + 추가 SY 테이블)
 *
 * 사용법:
 *   node _doc/generate_sample_sql.js      (선행 실행 — sy_site/brand/code/dept/role/user/member/vendor/batch)
 *   node _doc/generate_sample_sql_ec.js   (이 스크립트)
 *   → _doc/sample_data_ec.sql 생성
 *
 * 생성 대상 테이블 (의존성 순서):
 *   1.  mb_member_grade   (memGrades)
 *   2.  mb_member_group   (memGroups)
 *   3.  pd_category       (categories)  — 자기참조 2패스
 *   4.  pd_dliv_tmplt     (dlivTmplts)
 *   5.  pd_prod           (products)
 *   6.  sy_menu           (menus)       — 자기참조 2패스
 *   7.  sy_role_menu      (roleMenus)
 *   8.  sy_template       (templates)
 *   9.  sy_notice         (notices)
 *  10.  sy_bbm            (bbms)
 *  11.  sy_bbs            (bbss)
 *  12.  sy_prop           (props)       — BIGSERIAL PK, prop_id 생략
 *  13.  sy_path           (paths)       — BIGSERIAL PK, 정수 사용, 자기참조 2패스
 *  14.  sy_alarm          (alarms)
 *  15.  sy_contact        (contacts)
 *  16.  cm_chatt_room     (chats)
 *  17.  pm_coupon         (coupons)
 *  18.  pm_cache          (cacheList)
 *  19.  pm_event          (events)
 *  20.  od_order          (orders)
 *  21.  od_claim          (claims)
 *  22.  od_dliv           (deliveries)
 *  23.  dp_panel          (displays)   — rows → content_json
 *
 * 스키마: shopjoy_2604
 */

'use strict';
const fs   = require('fs');
const path = require('path');

global.Vue    = { reactive: (x) => x };
global.window = {};
require(path.resolve(__dirname, '../pages/admin/AdminData.js'));
const D = global.window.adminData;

// ── 상수 ────────────────────────────────────────────────────────
const SCHEMA   = 'shopjoy_2604';
const REG_BY   = 'SYSTEM';
const REG_DATE = '2026-04-20 00:00:00';

// ── ID 생성 ─────────────────────────────────────────────────────
const mkId = (prefix, n) => `${prefix}${String(n).padStart(6, '0')}`;

// ── 기존 스크립트와 동일한 ID 맵 재구성 (결정론적) ────────────────
const siteIdMap   = {};
D.sites.forEach((s, i) => { siteIdMap[s.siteId] = mkId('SITE', i + 1); });
const siteId1 = siteIdMap[1];

const brandIdMap  = {};
D.brands.forEach((b, i) => { brandIdMap[b.brandId] = mkId('BR', i + 1); });
const brandNmMap  = {};
D.brands.forEach((b, i) => { brandNmMap[b.brandNm] = mkId('BR', i + 1); });

const roleIdMap   = {};
D.roles.forEach(r => { roleIdMap[r.roleId] = mkId('RL', r.roleId); });

const vendorIdMap = {};
D.vendors.forEach((v, i) => { vendorIdMap[v.vendorId] = mkId('VN', i + 1); });

// members: userId 필드가 1-based 인덱스와 일치
const memberIdMap = {};
D.members.forEach((m, i) => { memberIdMap[m.userId] = mkId('MB', i + 1); });

// ── SQL 유틸 ────────────────────────────────────────────────────
const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
// 날짜/시간: 값 있으면 raw 문자열(esc가 자동 인용), 없으면 null → SQL NULL
const dv  = (s) => s || null;
const tsv = (s) => s ? String(s).replace('T', ' ') : null;

const lines = [];
const section = (title) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${title}`);
  lines.push('-- ================================================================');
};
const insert = (table, cols, vals) =>
  lines.push(`INSERT INTO ${SCHEMA}.${table} (${cols.join(', ')}) VALUES (${vals.map(esc).join(', ')}) ON CONFLICT DO NOTHING;`);

// ────────────────────────────────────────────────────────────────
// 1. mb_member_grade
// ────────────────────────────────────────────────────────────────
section('1. mb_member_grade — 회원 등급');
D.memGrades.forEach((g) => {
  insert('mb_member_grade',
    ['grade_id','site_id','grade_cd','grade_nm','grade_rank','min_purchase_amt','save_rate','use_yn','reg_by','reg_date'],
    [g.gradeId, siteId1, g.gradeCd, g.gradeNm, g.gradeRank, g.minPurchaseAmt || 0,
     g.saveRate || 0, g.useYn || 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 2. mb_member_group
// ────────────────────────────────────────────────────────────────
section('2. mb_member_group — 회원 그룹');
D.memGroups.forEach((g) => {
  insert('mb_member_group',
    ['group_id','site_id','group_nm','group_memo','use_yn','reg_by','reg_date'],
    [g.groupId, siteId1, g.groupNm, g.groupMemo || null, g.useYn || 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 3. pd_category (자기참조 — 2패스)
// ────────────────────────────────────────────────────────────────
section('3. pd_category — 상품 카테고리');
const catStMap    = { '활성':'ACTIVE', '비활성':'INACTIVE', '숨김':'HIDDEN' };
const categoryIdMap = {};
D.categories.forEach((c, i) => { categoryIdMap[c.categoryId] = mkId('CT', i + 1); });
D.categories.forEach((c) => {
  const id       = categoryIdMap[c.categoryId];
  const parentId = c.parentId ? categoryIdMap[c.parentId] : null;
  insert('pd_category',
    ['category_id','site_id','parent_category_id','category_nm','category_depth',
     'sort_ord','category_status_cd','img_url','category_desc','reg_by','reg_date'],
    [id, siteId1, parentId, c.categoryNm, c.depth || 1,
     c.sortOrd || 0, catStMap[c.status] || 'ACTIVE',
     c.imgUrl || null, c.description || null, REG_BY, REG_DATE]
  );
});
const catNmMap = {};
D.categories.forEach((c, i) => { catNmMap[c.categoryNm] = categoryIdMap[c.categoryId]; });

// ────────────────────────────────────────────────────────────────
// 4. pd_dliv_tmplt — 배송 템플릿
// ────────────────────────────────────────────────────────────────
section('4. pd_dliv_tmplt — 배송 템플릿');
const dlivTmpltIdMap = {};
D.dlivTmplts.forEach((t, i) => {
  const id = mkId('DT', i + 1);
  dlivTmpltIdMap[t.dlivTmpltId] = id;
  insert('pd_dliv_tmplt',
    ['dliv_tmplt_id','site_id','vendor_id','dliv_tmplt_nm','dliv_method_cd',
     'dliv_pay_type_cd','dliv_courier_cd','dliv_cost','free_dliv_min_amt',
     'island_extra_cost','return_cost','exchange_cost','return_courier_cd',
     'base_dliv_yn','use_yn','reg_by','reg_date'],
    [id, siteId1, t.vendorId ? vendorIdMap[t.vendorId] : null,
     t.dlivTmpltNm, t.dlivMethodCd || 'COURIER',
     t.dlivPayTypeCd || 'PREPAY', t.dlivCourierCd || null,
     t.dlivCost || 3000, t.freeDlivMinAmt || 50000,
     t.islandExtraCost || 0, t.returnCost || 3000, t.exchangeCost || 6000,
     t.returnCourierCd || null, t.baseDlivYn || 'N', t.useYn || 'Y',
     REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 5. pd_prod — 상품
// ────────────────────────────────────────────────────────────────
section('5. pd_prod — 상품');
const prodStMap = { '판매중':'SALE', '판매중지':'STOP', '품절':'SOLDOUT', '임시저장':'DRAFT', '준비중':'DRAFT' };
const prodIdMap = {};
D.products.forEach((p, i) => {
  const id = mkId('PD', i + 1);
  prodIdMap[p.productId] = id;
  insert('pd_prod',
    ['prod_id','site_id','category_id','brand_id','prod_nm','sale_price','list_price',
     'prod_stock','prod_status_cd','dliv_tmplt_id','reg_by','reg_date'],
    [id, siteId1, catNmMap[p.category] || null, brandNmMap[p.brand] || null,
     p.prodNm, p.price || 0, p.price || 0,
     p.stock || 0, prodStMap[p.status] || 'SALE',
     D.dlivTmplts.length > 0 ? mkId('DT', 1) : null,
     REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 6. sy_menu (자기참조 — 2패스)
// ────────────────────────────────────────────────────────────────
section('6. sy_menu — 관리자 메뉴');
const menuTypeMap = { '폴더':'FOLDER', '링크':'LINK', '화면':'PAGE', '구분선':'DIVIDER' };
const menuIdMap = {};
D.menus.forEach(m => { menuIdMap[m.menuId] = mkId('MN', m.menuId); });
const sortedMenus = [...D.menus].sort((a, b) => {
  if (a.parentId === null && b.parentId !== null) return -1;
  if (a.parentId !== null && b.parentId === null) return  1;
  return (a.sortOrd || 0) - (b.sortOrd || 0);
});
sortedMenus.forEach(m => {
  const parentId = m.parentId ? menuIdMap[m.parentId] : null;
  insert('sy_menu',
    ['menu_id','site_id','menu_code','menu_nm','parent_menu_id','menu_url',
     'menu_type_cd','icon_class','sort_ord','use_yn','menu_remark','reg_by','reg_date'],
    [menuIdMap[m.menuId], siteId1, m.menuCode, m.menuNm, parentId,
     m.menuUrl || null, menuTypeMap[m.menuType] || 'FOLDER',
     m.iconClass || null, m.sortOrd || 0, m.useYn || 'Y',
     m.remark || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 7. sy_role_menu — 역할-메뉴 권한 (perm_level: SMALLINT)
// ────────────────────────────────────────────────────────────────
section('7. sy_role_menu — 역할-메뉴 권한');
const permMap = { '관리':3, '쓰기':2, '읽기':1, '조회':1, '없음':0 };
let rmSeq = 1;
D.roleMenus.forEach(rm => {
  const roleId = roleIdMap[rm.roleId];
  const menuId = menuIdMap[rm.menuId];
  if (!roleId || !menuId) return;
  insert('sy_role_menu',
    ['role_menu_id','site_id','role_id','menu_id','perm_level','reg_by','reg_date'],
    [mkId('RM', rmSeq++), siteId1, roleId, menuId,
     permMap[rm.permLevel] !== undefined ? permMap[rm.permLevel] : 1,
     REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 8. sy_template — 발송 템플릿
// ────────────────────────────────────────────────────────────────
section('8. sy_template — 발송 템플릿');
const tmplTypeMap = {
  '메일템플릿':'MAIL', 'SMS템플릿':'SMS', '푸시템플릿':'PUSH',
  '알림톡':'KAKAO', 'LMS템플릿':'LMS',
};
D.templates.forEach((t, i) => {
  insert('sy_template',
    ['template_id','site_id','template_type_cd','template_code','template_nm',
     'template_subject','template_content','sample_params','use_yn','disp_path','reg_by','reg_date'],
    [mkId('TM', i + 1), siteId1, tmplTypeMap[t.templateType] || 'MAIL',
     t.templateCode, t.templateNm, t.subject || null,
     t.content || null, t.sampleParams || null,
     t.useYn || 'Y', t.dispPath || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 9. sy_notice — 공지사항 (is_fixed: CHAR(1) Y/N)
// ────────────────────────────────────────────────────────────────
section('9. sy_notice — 공지사항');
const noticeTypeMap = { '시스템':'SYSTEM', '이벤트':'EVENT', '정책':'POLICY', '기타':'ETC', '운영':'OPS' };
const noticeStMap   = { '게시':'PUBLISH', '임시저장':'DRAFT', '종료':'END' };
D.notices.forEach((n, i) => {
  insert('sy_notice',
    ['notice_id','site_id','notice_title','notice_type_cd','is_fixed',
     'content_html','start_date','end_date','notice_status_cd','view_count','reg_by','reg_date'],
    [mkId('NC', i + 1), siteId1, n.title,
     noticeTypeMap[n.noticeType] || 'SYSTEM',
     n.isFixed ? 'Y' : 'N',
     n.contentHtml || null,
     dv(n.startDate), dv(n.endDate),
     noticeStMap[n.statusCd] || 'PUBLISH',
     n.viewCount || 0, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 10. sy_bbm — 게시판 마스터 (allow_*: CHAR(1) Y/N)
// ────────────────────────────────────────────────────────────────
section('10. sy_bbm — 게시판 마스터');
const bbmTypeMap  = { '공지':'NOTICE','게시판':'BOARD','FAQ':'FAQ','QNA':'QNA','이벤트':'EVENT' };
const bbmScopeMap = { '공개':'PUBLIC','회원':'MEMBER','관리자':'ADMIN' };
const bbmIdMap = {};
D.bbms.forEach((b, i) => {
  const id = mkId('BM', i + 1);
  bbmIdMap[b.bbmId] = id;
  insert('sy_bbm',
    ['bbm_id','site_id','bbm_code','bbm_nm','disp_path','bbm_type_cd',
     'allow_comment','allow_attach','allow_like','content_type_cd',
     'scope_type_cd','sort_ord','use_yn','bbm_remark','reg_by','reg_date'],
    [id, siteId1, b.bbmCode, b.bbmNm, b.dispPath || null,
     bbmTypeMap[b.bbmType] || 'BOARD',
     b.allowComment === '불가' ? 'N' : 'Y',
     b.allowAttach  === '불가' ? 'N' : 'Y',
     b.allowLike    === 'N'   ? 'N' : 'Y',
     b.contentType || 'htmleditor',
     bbmScopeMap[b.scopeType] || 'PUBLIC',
     b.sortOrd || 0, b.useYn || 'Y', b.remark || null,
     REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 11. sy_bbs — 게시판 게시물 (is_fixed: CHAR(1) Y/N)
// ────────────────────────────────────────────────────────────────
section('11. sy_bbs — 게시판 게시물');
const bbsStMap = { '게시':'PUBLISH','임시저장':'DRAFT','삭제':'DELETE','숨김':'HIDDEN' };
D.bbss.forEach((b, i) => {
  insert('sy_bbs',
    ['bbs_id','site_id','bbm_id','parent_bbs_id','author_nm','bbs_title',
     'content_html','view_count','like_count','comment_count',
     'is_fixed','bbs_status_cd','disp_path','reg_by','reg_date'],
    [mkId('BS', i + 1), siteId1,
     bbmIdMap[b.bbmId] || null, null,
     b.authorNm || 'SYSTEM', b.title, b.contentHtml || null,
     b.viewCount || 0, b.likeCount || 0, b.commentCount || 0,
     b.isFixed ? 'Y' : 'N',
     bbsStMap[b.statusCd] || 'PUBLISH',
     b.dispPath || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 12. sy_prop — 시스템 속성 (BIGSERIAL PK — prop_id 생략)
// ────────────────────────────────────────────────────────────────
section('12. sy_prop — 시스템 속성');
D.props.forEach((p) => {
  insert('sy_prop',
    ['site_id','disp_path','prop_key','prop_value','prop_label',
     'prop_type_cd','sort_ord','use_yn','prop_remark','reg_by','reg_date'],
    [siteId1, p.dispPath || null,
     p.propKey, p.propValue || null, p.propLabel || p.propKey,
     p.propType || 'STRING', p.sortOrd || 0, p.useYn || 'Y',
     p.remark || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 13. sy_path — 표시 경로 (BIGSERIAL PK — 정수 사용, 2패스)
// ────────────────────────────────────────────────────────────────
section('13. sy_path — 표시 경로');
const pathIdMap = {};
D.paths.forEach((p, i) => { pathIdMap[p.pathId] = i + 1; });  // 정수 ID
const sortedPaths = [...D.paths].sort((a, b) => {
  if (!a.parentPathId && b.parentPathId) return -1;
  if (a.parentPathId && !b.parentPathId) return  1;
  return (a.sortOrd || 0) - (b.sortOrd || 0);
});
sortedPaths.forEach(p => {
  const id       = pathIdMap[p.pathId];
  const parentId = p.parentPathId ? pathIdMap[p.parentPathId] : null;
  insert('sy_path',
    ['path_id','biz_cd','parent_path_id','path_label','sort_ord','use_yn','path_remark','reg_by','reg_date'],
    [id, p.bizCd || null, parentId, p.pathLabel,
     p.sortOrd || 0, p.useYn || 'Y', p.remark || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 14. sy_alarm — 알림
// ────────────────────────────────────────────────────────────────
section('14. sy_alarm — 알림');
const alarmTypeMap   = { '푸시':'PUSH','메일':'MAIL','SMS':'SMS','알림톡':'KAKAO','LMS':'LMS' };
const alarmStMap     = { '발송완료':'SENT','발송실패':'FAIL','대기':'PENDING','취소':'CANCEL' };
const alarmTargetMap = { '전체':'ALL','회원':'MEMBER','관리자':'ADMIN','특정':'SPECIFIC' };
D.alarms.forEach((a, i) => {
  insert('sy_alarm',
    ['alarm_id','site_id','alarm_title','alarm_type_cd','target_type_cd',
     'alarm_msg','alarm_send_date','alarm_status_cd',
     'alarm_send_count','alarm_fail_count','disp_path','reg_by','reg_date'],
    [mkId('AL', i + 1), siteId1, a.title,
     alarmTypeMap[a.alarmType] || 'PUSH',
     alarmTargetMap[a.targetTypeCd] || 'ALL',
     a.message || null,
     tsv(a.sendDate), alarmStMap[a.statusCd] || 'PENDING',
     a.sendCount || 0, a.failCount || 0,
     a.dispPath || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 15. sy_contact — 고객 문의
// ────────────────────────────────────────────────────────────────
section('15. sy_contact — 고객 문의');
const contactStMap = { '요청':'REQUEST','처리중':'PROCESSING','답변완료':'ANSWERED','종료':'CLOSED' };
D.contacts.forEach((c, i) => {
  insert('sy_contact',
    ['contact_id','site_id','member_id','member_nm','category_cd',
     'contact_title','contact_content','contact_status_cd',
     'contact_answer','contact_date','reg_by','reg_date'],
    [mkId('CQ', i + 1), siteId1,
     memberIdMap[c.userId] || null, c.userNm,
     c.category || null, c.title, c.content || null,
     contactStMap[c.status] || 'REQUEST',
     c.answer || null, tsv(c.date), REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 16. cm_chatt_room — 채팅 룸
// ────────────────────────────────────────────────────────────────
section('16. cm_chatt_room — 채팅 룸');
const chattStMap = { '진행중':'OPEN','종료':'CLOSED','대기':'WAITING' };
D.chats.forEach((c, i) => {
  insert('cm_chatt_room',
    ['chatt_room_id','site_id','member_id','member_nm',
     'subject','chatt_status_cd','last_msg_date',
     'member_unread_cnt','admin_unread_cnt','reg_by','reg_date'],
    [mkId('CR', i + 1), siteId1,
     memberIdMap[c.userId] || null, c.userNm,
     c.subject || null, chattStMap[c.status] || 'OPEN',
     tsv(c.date), c.unread || 0, 0, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 17. pm_coupon — 쿠폰
// ────────────────────────────────────────────────────────────────
section('17. pm_coupon — 쿠폰');
const couponTypeMap = { 'rate':'RATE','amount':'AMT','free_ship':'FREE_SHIP' };
const couponStMap   = { '활성':'ACTIVE','만료':'EXPIRED','비활성':'INACTIVE','대기':'PENDING' };
const couponIdMap   = {};
D.coupons.forEach((c, i) => {
  const id = mkId('CO', i + 1);
  couponIdMap[c.couponId] = id;
  insert('pm_coupon',
    ['coupon_id','site_id','coupon_cd','coupon_nm','coupon_type_cd',
     'discount_rate','discount_amt','min_order_amt','issue_limit','issue_cnt',
     'valid_to','coupon_status_cd','use_yn','reg_by','reg_date'],
    [id, siteId1, c.code, c.name,
     couponTypeMap[c.discountType] || 'RATE',
     c.discountType === 'rate' ? (c.discountValue || 0) : 0,
     c.discountType !== 'rate' ? (c.discountValue || 0) : 0,
     c.minOrder || 0, c.issueCount || 0, c.useCount || 0,
     dv(c.expiry), couponStMap[c.status] || 'ACTIVE',
     'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 18. pm_cache — 캐시(충전금)
// ────────────────────────────────────────────────────────────────
section('18. pm_cache — 캐시(충전금)');
const cacheTypeMap = { '충전':'CHARGE','사용':'USE','환불':'REFUND','만료소멸':'EXPIRE','관리자지급':'ADMIN_GRANT' };
D.cacheList.forEach((c, i) => {
  insert('pm_cache',
    ['cache_id','site_id','member_id','member_nm','cache_type_cd',
     'cache_amt','balance_amt','cache_desc','cache_date','reg_by','reg_date'],
    [mkId('CC', i + 1), siteId1,
     memberIdMap[c.userId] || null, c.userNm,
     cacheTypeMap[c.type] || 'CHARGE',
     c.amount || 0, c.balance || 0,
     c.desc || null, tsv(c.date), REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 19. pm_event — 이벤트
// ────────────────────────────────────────────────────────────────
section('19. pm_event — 이벤트');
const eventStMap = { '진행중':'ACTIVE','종료':'END','예정':'SCHEDULED','중지':'STOPPED' };
D.events.forEach((e, i) => {
  insert('pm_event',
    ['event_id','site_id','event_nm','event_type_cd','event_title',
     'event_content','start_date','end_date',
     'event_status_cd','use_yn','reg_by','reg_date'],
    [mkId('EV', i + 1), siteId1, e.title, 'PROMOTION', e.title,
     e.content1 || e.bannerImage || null,
     dv(e.startDate), dv(e.endDate),
     eventStMap[e.status] || 'ACTIVE',
     'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 20. od_order — 주문
// ────────────────────────────────────────────────────────────────
section('20. od_order — 주문');
const orderStMap  = {
  '입금대기':'WAIT_PAY','결제완료':'PAID','상품준비중':'PREPARING',
  '배송중':'SHIPPING','배송완료':'DELIVERED','구매확정':'COMPLETE','취소':'CANCEL',
};
const payMethodMap = {
  '카카오페이':'KAKAO','무통장입금':'TRANSFER','가상계좌':'VIRTUAL_ACCT',
  '신용카드':'CARD','네이버페이':'NAVER','토스페이':'TOSS','핸드폰결제':'PHONE',
};
D.orders.forEach((o) => {
  insert('od_order',
    ['order_id','site_id','member_id','member_nm','order_date',
     'total_amt','pay_amt','pay_method_cd','order_status_cd','reg_by','reg_date'],
    [o.orderId, siteId1,
     memberIdMap[o.userId] || null, o.userNm,
     tsv(o.orderDate), o.totalPrice || 0, o.totalPrice || 0,
     payMethodMap[o.payMethod] || 'TRANSFER',
     orderStMap[o.status] || 'WAIT_PAY', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 21. od_claim — 클레임
// ────────────────────────────────────────────────────────────────
section('21. od_claim — 클레임');
const claimTypeMap = { '취소':'CANCEL','반품':'RETURN','교환':'EXCHANGE' };
const claimStMap   = {
  '신청':'REQUEST','수거중':'COLLECTING','처리중':'PROCESSING',
  '완료':'COMPLETE','승인':'APPROVED','환불대기':'WAIT_REFUND','거절':'REJECTED',
};
const courierMap = {
  '한진택배':'HANJIN','CJ대한통운':'CJ','롯데택배':'LOTTE',
  '우체국':'KOREA_POST','배송예정':'PENDING',
};
D.claims.forEach((c) => {
  insert('od_claim',
    ['claim_id','site_id','order_id','member_id','member_nm',
     'claim_type_cd','claim_status_cd','reason_detail','prod_nm',
     'refund_amt','return_courier_cd','return_tracking_no',
     'exchange_courier_cd','exchange_tracking_no','request_date','reg_by','reg_date'],
    [c.claimId, siteId1, c.orderId,
     memberIdMap[c.userId] || null, c.userNm,
     claimTypeMap[c.type] || 'CANCEL',
     claimStMap[c.status] || 'REQUEST',
     c.reason || null, c.prodNm || null,
     c.refundAmount || 0,
     courierMap[c.courier] || null, c.trackingNo || null,
     courierMap[c.exchangeCourier] || null, c.exchangeTrackingNo || null,
     tsv(c.requestDate), REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 22. od_dliv — 배송
// ────────────────────────────────────────────────────────────────
section('22. od_dliv — 배송');
const dlivStMap = {
  '준비중':'PREPARING','배송중':'SHIPPING','배송완료':'DELIVERED',
  '반송중':'RETURNING','반송완료':'RETURNED',
};
D.deliveries.forEach((d) => {
  insert('od_dliv',
    ['dliv_id','site_id','order_id','member_id','member_nm',
     'recv_nm','recv_phone','recv_addr',
     'dliv_div_cd','dliv_status_cd','reg_by','reg_date'],
    [d.dlivId, siteId1, d.orderId,
     memberIdMap[d.userId] || null, d.userNm,
     d.receiver || d.userNm, d.phone || null, d.address || null,
     'OUTBOUND', dlivStMap[d.status] || 'PREPARING', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 23. dp_panel — 전시 패널 (rows → content_json)
// ────────────────────────────────────────────────────────────────
section('23. dp_panel — 전시 패널');
const dispStMap = { '활성':'ACTIVE','비활성':'INACTIVE','임시저장':'DRAFT' };
D.displays.forEach((d, i) => {
  const contentJson = JSON.stringify({ rows: d.rows || [] });
  insert('dp_panel',
    ['panel_id','site_id','panel_nm','panel_type_cd','visibility_targets',
     'use_yn','use_start_date','use_end_date','disp_panel_status_cd',
     'content_json','reg_by','reg_date'],
    [mkId('PN', i + 1), siteId1, d.name || d.area, d.widgetType || null,
     d.visibilityTargets || '^PUBLIC^',
     'Y', dv(d.dispStartDate), dv(d.dispEndDate),
     dispStMap[d.status] || 'ACTIVE',
     contentJson, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 출력
// ────────────────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- AdminData.js → PostgreSQL 샘플 데이터 (EC 도메인 + 추가 SY)',
  '-- 생성: generate_sample_sql_ec.js',
  '-- 스키마: shopjoy_2604',
  '-- 전제: generate_sample_sql.js 먼저 실행 (sy_site/brand/code/dept/role/user/member/vendor/batch)',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_ec.sql');
fs.writeFileSync(outFile, output, 'utf8');

const cnt = lines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: ${cnt}개 INSERT → ${outFile}`);
