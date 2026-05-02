/**
 * boApiSvc.js — Back Office 전용 공통 API 서비스
 *
 * 모든 API 엔드포인트(GET/POST/PUT/DELETE)를 이 파일에 등록하여 중앙 관리한다.
 *
 * 선행 로드: utils/boApiAxios.js (boApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await boApiSvc.mbMember.getPage({ kw: '홍길동' }, '회원관리', '목록조회');
 *   const res = await boApiSvc.mbMember.create(body, '회원관리', '등록');
 *   const res = await boApiSvc.mbMember.update(id, body, '회원관리', '저장');
 *   const res = await boApiSvc.mbMember.remove(id, '회원관리', '삭제');
 */
(function (global) {
  'use strict';

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.apiHdr(uiNm, cmdNm) : {};
  }

  const boApiSvc = {};

  /* ── cm: 블로그 ─────────────────────────────────────────────── */
  boApiSvc.cmBlog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/cm/blog/page', { params, ...hdr(uiNm, cmdNm) }); },
    update(blogId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/cm/blog/${blogId}`, body, hdr(uiNm, cmdNm)); },
    remove(blogId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/cm/blog/${blogId}`, hdr(uiNm, cmdNm)); },
    setUse(blogId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/cm/blog/${blogId}/use`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 채팅 ───────────────────────────────────────────────── */
  boApiSvc.cmChatt = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/cm/chatt/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(chatId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/cm/chatt/${chatId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/cm/chatt', body, hdr(uiNm, cmdNm)); },
    remove(chatId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/cm/chatt/${chatId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 공지사항 ───────────────────────────────────────────── */
  boApiSvc.cmNotice = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/cm/notice/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(noticeId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/cm/notice/${noticeId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/cm/notice', body, hdr(uiNm, cmdNm)); },
    update(noticeId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/cm/notice/${noticeId}`, body, hdr(uiNm, cmdNm)); },
    remove(noticeId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/cm/notice/${noticeId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시영역 ───────────────────────────────────────────── */
  boApiSvc.dpArea = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/area/page', { params, ...hdr(uiNm, cmdNm) }); },
    getBasePage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/dp/area/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/dp/area', body, hdr(uiNm, cmdNm)); },
    update(areaId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/dp/area/${areaId}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시패널 ───────────────────────────────────────────── */
  boApiSvc.dpPanel = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/panel/page', { params, ...hdr(uiNm, cmdNm) }); },
    getBasePage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/dp/panel/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/dp/panel', body, hdr(uiNm, cmdNm)); },
    update(dispId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/dp/panel/${dispId}`, body, hdr(uiNm, cmdNm)); },
    remove(dispId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/dp/panel/${dispId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시위젯 ───────────────────────────────────────────── */
  boApiSvc.dpWidget = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/widget/page', { params, ...hdr(uiNm, cmdNm) }); },
    remove(libId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/dp/widget/${libId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시연관자원 ───────────────────────────────────────── */
  boApiSvc.dpResource = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/resource/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── dp: 전시UI ─────────────────────────────────────────────── */
  boApiSvc.dpUi = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/ui/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/dp/ui', body, hdr(uiNm, cmdNm)); },
    update(uiId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/dp/ui/${uiId}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 위젯라이브러리 ─────────────────────────────────────── */
  boApiSvc.dpWidgetLib = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/widget-lib/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/dp/widget-lib', body, hdr(uiNm, cmdNm)); },
    update(libId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/dp/widget-lib/${libId}`, body, hdr(uiNm, cmdNm)); },
    remove(libId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/dp/widget-lib/${libId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 고객종합정보 ───────────────────────────────────────── */
  boApiSvc.mbCustInfo = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/mb/cust-info/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── mb: 회원등급 ───────────────────────────────────────────── */
  boApiSvc.mbMemGrade = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/mb/member-grade/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/mb/member-grade', body, hdr(uiNm, cmdNm)); },
    update(gradeId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/mb/member-grade/${gradeId}`, body, hdr(uiNm, cmdNm)); },
    remove(gradeId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/mb/member-grade/${gradeId}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/ec/mb/member-grade/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원그룹 ───────────────────────────────────────────── */
  boApiSvc.mbMemGroup = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/mb/member-group/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/mb/member-group', body, hdr(uiNm, cmdNm)); },
    update(groupId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/mb/member-group/${groupId}`, body, hdr(uiNm, cmdNm)); },
    remove(groupId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/mb/member-group/${groupId}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/ec/mb/member-group/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원 ───────────────────────────────────────────────── */
  boApiSvc.mbMember = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/mb/member/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/mb/member', { params, ...hdr(uiNm, cmdNm) }); },
    getById(memberId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/mb/member/${memberId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/mb/member', body, hdr(uiNm, cmdNm)); },
    update(memberId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/mb/member/${memberId}`, body, hdr(uiNm, cmdNm)); },
    remove(memberId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/mb/member/${memberId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 클레임 ─────────────────────────────────────────────── */
  boApiSvc.odClaim = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/od/claim/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(claimId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/od/claim/${claimId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/od/claim', body, hdr(uiNm, cmdNm)); },
    update(claimId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/od/claim/${claimId}`, body, hdr(uiNm, cmdNm)); },
    remove(claimId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/od/claim/${claimId}`, hdr(uiNm, cmdNm)); },
    bulkStatus(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/claim/bulk-status', body, hdr(uiNm, cmdNm)); },
    bulkType(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/claim/bulk-type', body, hdr(uiNm, cmdNm)); },
    bulkApproval(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/claim/bulk-approval', body, hdr(uiNm, cmdNm)); },
    bulkApprovalReq(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/claim/bulk-approvalReq', body, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 배송 ───────────────────────────────────────────────── */
  boApiSvc.odDliv = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/od/dliv/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(dlivId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/od/dliv/${dlivId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/od/dliv', body, hdr(uiNm, cmdNm)); },
    update(dlivId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/od/dliv/${dlivId}`, body, hdr(uiNm, cmdNm)); },
    remove(dlivId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/od/dliv/${dlivId}`, hdr(uiNm, cmdNm)); },
    bulkStatus(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/dliv/bulk-status', body, hdr(uiNm, cmdNm)); },
    bulkCourier(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/dliv/bulk-courier', body, hdr(uiNm, cmdNm)); },
    bulkApproval(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/dliv/bulk-approval', body, hdr(uiNm, cmdNm)); },
    bulkApprovalReq(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/od/dliv/bulk-approvalReq', body, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 주문 ───────────────────────────────────────────────── */
  boApiSvc.odOrder = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/od/order/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(orderId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/od/order/${orderId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/od/order', body, hdr(uiNm, cmdNm)); },
    update(orderId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/od/order/${orderId}`, body, hdr(uiNm, cmdNm)); },
    remove(orderId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/od/order/${orderId}`, hdr(uiNm, cmdNm)); },
    bulkAction(path, body, uiNm, cmdNm) { return global.boApi.put(path, body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 묶음상품 ───────────────────────────────────────────── */
  boApiSvc.pdBundle = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/bundle/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pd/prod-bundle', body, hdr(uiNm, cmdNm)); },
    updateItems(bundleProdId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pd/prod-bundle/${bundleProdId}/items`, body, hdr(uiNm, cmdNm)); },
    remove(bundleProdId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pd/prod-bundle/${bundleProdId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 카테고리 ───────────────────────────────────────────── */
  boApiSvc.pdCategory = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/category/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/category', { params, ...hdr(uiNm, cmdNm) }); },
    getById(categoryId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pd/category/${categoryId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pd/category', body, hdr(uiNm, cmdNm)); },
    update(categoryId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pd/category/${categoryId}`, body, hdr(uiNm, cmdNm)); },
    remove(categoryId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pd/category/${categoryId}`, hdr(uiNm, cmdNm)); },
    updateProds(body, uiNm, cmdNm) { return global.boApi.put('/bo/ec/pd/category-prod', body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 배송템플릿 ─────────────────────────────────────────── */
  boApiSvc.pdDlivTmplt = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/dliv-tmplt/page', { params, ...hdr(uiNm, cmdNm) }); },
    save(dlivTmpltId, body, uiNm, cmdNm) {
      return dlivTmpltId
        ? global.boApi.put(`/bo/ec/pd/dliv-tmplt/${dlivTmpltId}`, body, hdr(uiNm, cmdNm))
        : global.boApi.post('/bo/ec/pd/dliv-tmplt', body, hdr(uiNm, cmdNm));
    },
    remove(dlivTmpltId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pd/dliv-tmplt/${dlivTmpltId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 상품 ───────────────────────────────────────────────── */
  boApiSvc.pdProd = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/prod/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(prodId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pd/prod/${prodId}`, hdr(uiNm, cmdNm)); },
    getImages(prodId, uiNm, cmdNm)   { return global.boApi.get(`/bo/ec/pd/prod/${prodId}/images`,   hdr(uiNm, cmdNm)); },
    getOpts(prodId, uiNm, cmdNm)     { return global.boApi.get(`/bo/ec/pd/prod/${prodId}/opts`,     hdr(uiNm, cmdNm)); },
    getSkus(prodId, uiNm, cmdNm)     { return global.boApi.get(`/bo/ec/pd/prod/${prodId}/skus`,     hdr(uiNm, cmdNm)); },
    getContents(prodId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pd/prod/${prodId}/contents`, hdr(uiNm, cmdNm)); },
    getRels(prodId, uiNm, cmdNm)     { return global.boApi.get(`/bo/ec/pd/prod/${prodId}/rels`,     hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pd/prod', body, hdr(uiNm, cmdNm)); },
    update(prodId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pd/prod/${prodId}`, body, hdr(uiNm, cmdNm)); },
    remove(prodId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pd/prod/${prodId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: Q&A ────────────────────────────────────────────────── */
  boApiSvc.pdQna = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/qna/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── pd: 재입고알림 ─────────────────────────────────────────── */
  boApiSvc.pdRestockNoti = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/restock-noti/page', { params, ...hdr(uiNm, cmdNm) }); },
    send(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pd/restock-noti/send', body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 리뷰 ───────────────────────────────────────────────── */
  boApiSvc.pdReview = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/review/page', { params, ...hdr(uiNm, cmdNm) }); },
    updateStatus(reviewId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pd/review/${reviewId}/status`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 세트상품 ───────────────────────────────────────────── */
  boApiSvc.pdSet = {
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pd/prod-set', body, hdr(uiNm, cmdNm)); },
    updateItems(setProdId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pd/prod-set/${setProdId}/items`, body, hdr(uiNm, cmdNm)); },
    remove(setProdId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pd/prod-set/${setProdId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 태그 ───────────────────────────────────────────────── */
  boApiSvc.pdTag = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pd/tag/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pd/tag', body, hdr(uiNm, cmdNm)); },
    update(tagId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pd/tag/${tagId}`, body, hdr(uiNm, cmdNm)); },
    remove(tagId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pd/tag/${tagId}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pd/tag/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 캐시 ───────────────────────────────────────────────── */
  boApiSvc.pmCache = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/cache/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(cacheId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/cache/${cacheId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/cache', body, hdr(uiNm, cmdNm)); },
    update(cacheId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/cache/${cacheId}`, body, hdr(uiNm, cmdNm)); },
    remove(cacheId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/cache/${cacheId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 쿠폰 ───────────────────────────────────────────────── */
  boApiSvc.pmCoupon = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/coupon/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(couponId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/coupon/${couponId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/coupon', body, hdr(uiNm, cmdNm)); },
    update(couponId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/coupon/${couponId}`, body, hdr(uiNm, cmdNm)); },
    remove(couponId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/coupon/${couponId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 쿠폰사용내역 ───────────────────────────────────────── */
  boApiSvc.pmCouponUsage = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/coupon-usage/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── pm: 할인 ───────────────────────────────────────────────── */
  boApiSvc.pmDiscnt = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/discnt/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(discntId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/discnt/${discntId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/discnt', body, hdr(uiNm, cmdNm)); },
    update(discntId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/discnt/${discntId}`, body, hdr(uiNm, cmdNm)); },
    remove(discntId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/discnt/${discntId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 이벤트 ─────────────────────────────────────────────── */
  boApiSvc.pmEvent = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/event/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(eventId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/event/${eventId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/event', body, hdr(uiNm, cmdNm)); },
    update(eventId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/event/${eventId}`, body, hdr(uiNm, cmdNm)); },
    remove(eventId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/event/${eventId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 사은품 ─────────────────────────────────────────────── */
  boApiSvc.pmGift = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/gift/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(giftId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/gift/${giftId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/gift', body, hdr(uiNm, cmdNm)); },
    update(giftId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/gift/${giftId}`, body, hdr(uiNm, cmdNm)); },
    remove(giftId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/gift/${giftId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 기획전 ─────────────────────────────────────────────── */
  boApiSvc.pmPlan = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/plan/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(planId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/plan/${planId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/plan', body, hdr(uiNm, cmdNm)); },
    update(planId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/plan/${planId}`, body, hdr(uiNm, cmdNm)); },
    remove(planId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/plan/${planId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 적립금 ─────────────────────────────────────────────── */
  boApiSvc.pmSave = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/save/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(saveId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/save/${saveId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/save', body, hdr(uiNm, cmdNm)); },
    update(saveId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/save/${saveId}`, body, hdr(uiNm, cmdNm)); },
    remove(saveId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/save/${saveId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 바우처 ─────────────────────────────────────────────── */
  boApiSvc.pmVoucher = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/pm/voucher/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(voucherId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/pm/voucher/${voucherId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/pm/voucher', body, hdr(uiNm, cmdNm)); },
    update(voucherId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/pm/voucher/${voucherId}`, body, hdr(uiNm, cmdNm)); },
    remove(voucherId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/pm/voucher/${voucherId}`, hdr(uiNm, cmdNm)); },
    sendSns(voucherId, body, uiNm, cmdNm) { return global.boApi.post(`/bo/ec/pm/voucher/${voucherId}/send-sns`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산설정 ───────────────────────────────────────────── */
  boApiSvc.stSettleConfig = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/st/settle-config/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/st/config', body, hdr(uiNm, cmdNm)); },
    update(settleConfigId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/st/config/${settleConfigId}`, body, hdr(uiNm, cmdNm)); },
    remove(settleConfigId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/st/config/${settleConfigId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산원장 ───────────────────────────────────────────── */
  boApiSvc.stSettleRaw = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/st/settle-raw/page', { params, ...hdr(uiNm, cmdNm) }); },
    collect(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/st/raw/collect', body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산조정 ───────────────────────────────────────────── */
  boApiSvc.stSettleAdj = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/st/settle-adj/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/st/adj', body, hdr(uiNm, cmdNm)); },
    update(adjId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/st/adj/${adjId}`, body, hdr(uiNm, cmdNm)); },
    remove(adjId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/st/adj/${adjId}`, hdr(uiNm, cmdNm)); },
    approve(adjId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/st/adj/${adjId}/approve`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산기타조정 ───────────────────────────────────────── */
  boApiSvc.stSettleEtcAdj = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/st/settle-etc-adj/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/st/etc-adj', body, hdr(uiNm, cmdNm)); },
    update(adjId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/st/etc-adj/${adjId}`, body, hdr(uiNm, cmdNm)); },
    remove(adjId, uiNm, cmdNm) { return global.boApi.delete(`/bo/ec/st/etc-adj/${adjId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산지급 ───────────────────────────────────────────── */
  boApiSvc.stSettlePay = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/st/settle-pay/page', { params, ...hdr(uiNm, cmdNm) }); },
    pay(payId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/st/pay/${payId}/pay`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산마감 ───────────────────────────────────────────── */
  boApiSvc.stSettleClose = {
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/st/close', body, hdr(uiNm, cmdNm)); },
    reopen(closeId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/st/close/${closeId}/reopen`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산대사 ───────────────────────────────────────────── */
  boApiSvc.stRecon = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/base/ec/st/recon/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── st: ERP 정산 ───────────────────────────────────────────── */
  boApiSvc.stErp = {
    gen(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/st/erp/gen', body, hdr(uiNm, cmdNm)); },
    resend(slipId, body, uiNm, cmdNm) { return global.boApi.post(`/bo/ec/st/erp/resend/${slipId}`, body, hdr(uiNm, cmdNm)); },
    fixRecon(reconId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/ec/st/erp/recon/${reconId}/fix`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 알람 ───────────────────────────────────────────────── */
  boApiSvc.syAlarm = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/alarm/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/alarm', body, hdr(uiNm, cmdNm)); },
    update(alarmId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/alarm/${alarmId}`, body, hdr(uiNm, cmdNm)); },
    remove(alarmId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/alarm/${alarmId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 첨부파일 ───────────────────────────────────────────── */
  boApiSvc.syAttach = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/attach/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 첨부파일그룹 ───────────────────────────────────────── */
  boApiSvc.syAttachGrp = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/attach-grp/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 배치 ───────────────────────────────────────────────── */
  boApiSvc.syBatch = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/batch/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/batch', body, hdr(uiNm, cmdNm)); },
    update(batchId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/batch/${batchId}`, body, hdr(uiNm, cmdNm)); },
    run(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/batch/run', body, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/batch/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 배치이력 ───────────────────────────────────────────── */
  boApiSvc.syBatchLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/batch-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 게시판 ─────────────────────────────────────────────── */
  boApiSvc.syBbs = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/bbs/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(bbsId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/bbs/${bbsId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/bbs', body, hdr(uiNm, cmdNm)); },
    update(bbsId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/bbs/${bbsId}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 게시판모드(BBM) ────────────────────────────────────── */
  boApiSvc.syBbm = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/bbm/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/bbm', body, hdr(uiNm, cmdNm)); },
    update(bbmId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/bbm/${bbmId}`, body, hdr(uiNm, cmdNm)); },
    remove(bbmId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/bbm/${bbmId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 브랜드 ─────────────────────────────────────────────── */
  boApiSvc.syBrand = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/brand/page', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/brand/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 공통코드그룹 ──────────────────────────────────────── */
  boApiSvc.syCodeGrp = {
    getAll(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/code-grp', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/code-grp/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 공통코드 ───────────────────────────────────────────── */
  boApiSvc.syCode = {
    getAll(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/code', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/code/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(codeId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/code/${codeId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/code', body, hdr(uiNm, cmdNm)); },
    update(codeId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/code/${codeId}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 문의(Contact) ──────────────────────────────────────── */
  boApiSvc.syContact = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/contact/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(inquiryId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/contact/${inquiryId}`, hdr(uiNm, cmdNm)); },
    update(inquiryId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/contact/${inquiryId}`, body, hdr(uiNm, cmdNm)); },
    remove(inquiryId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/contact/${inquiryId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 부서 ───────────────────────────────────────────────── */
  boApiSvc.syDept = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/dept/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/dept', { params, ...hdr(uiNm, cmdNm) }); },
    getTree(uiNm, cmdNm) { return global.boApi.get('/bo/sy/dept/tree', hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/dept/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: i18n 다국어 ────────────────────────────────────────── */
  boApiSvc.syI18n = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/i18n/page', { params, ...hdr(uiNm, cmdNm) }); },
    getMsgs(i18nId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/i18n/${i18nId}/msgs`, hdr(uiNm, cmdNm)); },
    updateMsgs(i18nId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/i18n/${i18nId}/msgs`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 메뉴 ───────────────────────────────────────────────── */
  boApiSvc.syMenu = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/menu/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/menu', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/menu/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 표시경로 ───────────────────────────────────────────── */
  boApiSvc.syPath = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/path/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/path', body, hdr(uiNm, cmdNm)); },
    update(pathId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/path/${pathId}`, body, hdr(uiNm, cmdNm)); },
    remove(pathId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/path/${pathId}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/path/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 시스템속성 ─────────────────────────────────────────── */
  boApiSvc.syProp = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/prop/page', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/prop/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 역할 ───────────────────────────────────────────────── */
  boApiSvc.syRole = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/role/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/role', { params, ...hdr(uiNm, cmdNm) }); },
    getMenus(roleId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/role/${roleId}/menus`, hdr(uiNm, cmdNm)); },
    getUsers(roleId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/role/${roleId}/users`, hdr(uiNm, cmdNm)); },
    saveMenus(roleId, body, uiNm, cmdNm) { return global.boApi.post(`/bo/sy/role/${roleId}/menus`, body, hdr(uiNm, cmdNm)); },
    saveUsers(roleId, body, uiNm, cmdNm) { return global.boApi.post(`/bo/sy/role/${roleId}/users`, body, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm) { return global.boApi.post('/bo/sy/role/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 역할메뉴 ───────────────────────────────────────────── */
  boApiSvc.syRoleMenu = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/role-menu/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 사이트 ─────────────────────────────────────────────── */
  boApiSvc.sySite = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/site/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/site', body, hdr(uiNm, cmdNm)); },
    update(siteId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/site/${siteId}`, body, hdr(uiNm, cmdNm)); },
    remove(siteId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/site/${siteId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 템플릿 ─────────────────────────────────────────────── */
  boApiSvc.syTemplate = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/template/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(templateId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/template/${templateId}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/template', body, hdr(uiNm, cmdNm)); },
    update(templateId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/template/${templateId}`, body, hdr(uiNm, cmdNm)); },
    remove(templateId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/template/${templateId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 사용자 (관리자 계정) ───────────────────────────────── */
  boApiSvc.syUser = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/user/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/user', { params, ...hdr(uiNm, cmdNm) }); },
    getById(userId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/user/${userId}`, hdr(uiNm, cmdNm)); },
    getRoles(userId, uiNm, cmdNm) { return global.boApi.get(`/bo/sy/user/${userId}/roles`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/user', body, hdr(uiNm, cmdNm)); },
    update(userId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/user/${userId}`, body, hdr(uiNm, cmdNm)); },
    remove(userId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/user/${userId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 사용자 로그인이력 ─────────────────────────────────── */
  boApiSvc.syUserLoginLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/user-login-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 업체(Vendor) ───────────────────────────────────────── */
  boApiSvc.syVendor = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/vendor/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/bo/sy/vendor', body, hdr(uiNm, cmdNm)); },
    update(vendorId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/sy/vendor/${vendorId}`, body, hdr(uiNm, cmdNm)); },
    remove(vendorId, uiNm, cmdNm) { return global.boApi.delete(`/bo/sy/vendor/${vendorId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 업체사용자 ─────────────────────────────────────────── */
  boApiSvc.syVendorUser = {
    getList(params, uiNm, cmdNm) { return global.boApi.get('/base/sy/vendor-user', { params, ...hdr(uiNm, cmdNm) }); },
    getRoles(params, uiNm, cmdNm) { return global.boApi.get('/base/sy/vendor-user-role', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm) { return global.boApi.post('/base/sy/vendor-user', body, hdr(uiNm, cmdNm)); },
    update(vendorUserId, body, uiNm, cmdNm) { return global.boApi.put(`/base/sy/vendor-user/${vendorUserId}`, body, hdr(uiNm, cmdNm)); },
    remove(vendorUserId, uiNm, cmdNm) { return global.boApi.delete(`/base/sy/vendor-user/${vendorUserId}`, hdr(uiNm, cmdNm)); },
    addRole(body, uiNm, cmdNm) { return global.boApi.post('/base/sy/vendor-user-role', body, hdr(uiNm, cmdNm)); },
    removeRole(vendorUserRoleId, uiNm, cmdNm) { return global.boApi.delete(`/base/sy/vendor-user-role/${vendorUserRoleId}`, hdr(uiNm, cmdNm)); },
  };

  global.boApiSvc = boApiSvc;
})(window);
