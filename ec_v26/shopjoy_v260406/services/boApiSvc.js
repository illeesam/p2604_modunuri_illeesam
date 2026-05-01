/**
 * boApiSvc.js — Back Office 전용 공통 API 서비스
 *
 * 사용 조건: GET 엔드포인트는 단독 사용이라도 모두 등록.
 * POST/PUT/DELETE 등 변경성 단건 호출은 각 페이지 파일에 직접 선언 가능.
 *
 * 선행 로드: utils/boApiAxios.js (boApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await boApiSvc.mbMember.getPage({ kw: '홍길동' });
 *   const res = await boApiSvc.mbMember.getPage({ kw: '홍길동' }, '회원관리', '목록조회');
 *   const res = await boApiSvc.syVendor.getPage();
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
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/cm/blog/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── cm: 채팅 ───────────────────────────────────────────────── */
  boApiSvc.cmChatt = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/cm/chatt/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(chatId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/cm/chatt/${chatId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── cm: 공지사항 ───────────────────────────────────────────── */
  boApiSvc.cmNotice = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/cm/notice/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(noticeId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/cm/notice/${noticeId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── dp: 전시영역 ───────────────────────────────────────────── */
  boApiSvc.dpArea = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/dp/area/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── dp: 전시패널 ───────────────────────────────────────────── */
  boApiSvc.dpPanel = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/dp/panel/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── dp: 전시UI ─────────────────────────────────────────────── */
  boApiSvc.dpUi = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/dp/ui/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── dp: 위젯라이브러리 ─────────────────────────────────────── */
  boApiSvc.dpWidgetLib = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/dp/widget-lib/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── mb: 고객종합정보 ───────────────────────────────────────── */
  boApiSvc.mbCustInfo = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/mb/cust-info/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── mb: 회원등급 ───────────────────────────────────────────── */
  boApiSvc.mbMemGrade = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/mb/member-grade/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── mb: 회원그룹 ───────────────────────────────────────────── */
  boApiSvc.mbMemGroup = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/mb/member-group/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── mb: 회원 (7개 파일 중복 참조) ─────────────────────────── */
  boApiSvc.mbMember = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/mb/member/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(memberId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/mb/member/${memberId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── od: 클레임 ─────────────────────────────────────────────── */
  boApiSvc.odClaim = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/od/claim/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(claimId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/od/claim/${claimId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── od: 배송 ───────────────────────────────────────────────── */
  boApiSvc.odDliv = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/od/dliv/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(dlivId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/od/dliv/${dlivId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── od: 주문 ───────────────────────────────────────────────── */
  boApiSvc.odOrder = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/od/order/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(orderId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/od/order/${orderId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pd: 묶음상품 ───────────────────────────────────────────── */
  boApiSvc.pdBundle = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/bundle/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── pd: 카테고리 ───────────────────────────────────────────── */
  boApiSvc.pdCategory = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/category/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(categoryId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pd/category/${categoryId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pd: 배송템플릿 ─────────────────────────────────────────── */
  boApiSvc.pdDlivTmplt = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/dliv-tmplt/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── pd: 상품 ───────────────────────────────────────────────── */
  boApiSvc.pdProd = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/prod/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(prodId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pd/prod/${prodId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pd: Q&A ────────────────────────────────────────────────── */
  boApiSvc.pdQna = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/qna/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── pd: 재입고알림 ─────────────────────────────────────────── */
  boApiSvc.pdRestockNoti = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/restock-noti/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── pd: 리뷰 ───────────────────────────────────────────────── */
  boApiSvc.pdReview = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/review/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── pd: 태그 ───────────────────────────────────────────────── */
  boApiSvc.pdTag = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pd/tag/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── pm: 캐시 ───────────────────────────────────────────────── */
  boApiSvc.pmCache = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/cache/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(cacheId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/cache/${cacheId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 쿠폰 ───────────────────────────────────────────────── */
  boApiSvc.pmCoupon = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/coupon/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(couponId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/coupon/${couponId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 할인 ───────────────────────────────────────────────── */
  boApiSvc.pmDiscnt = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/discnt/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(discntId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/discnt/${discntId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 이벤트 ─────────────────────────────────────────────── */
  boApiSvc.pmEvent = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/event/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(eventId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/event/${eventId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 사은품 ─────────────────────────────────────────────── */
  boApiSvc.pmGift = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/gift/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(giftId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/gift/${giftId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 기획전 ─────────────────────────────────────────────── */
  boApiSvc.pmPlan = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/plan/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(planId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/plan/${planId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 적립금 ─────────────────────────────────────────────── */
  boApiSvc.pmSave = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/save/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(saveId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/save/${saveId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 바우처 ─────────────────────────────────────────────── */
  boApiSvc.pmVoucher = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/pm/voucher/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(voucherId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/pm/voucher/${voucherId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── sy: 알람 ───────────────────────────────────────────────── */
  boApiSvc.syAlarm = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/alarm/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 첨부파일 ───────────────────────────────────────────── */
  boApiSvc.syAttach = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/attach/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 첨부파일그룹 ───────────────────────────────────────── */
  boApiSvc.syAttachGrp = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/attach-grp/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 배치 ───────────────────────────────────────────────── */
  boApiSvc.syBatch = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/batch/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 게시판 ─────────────────────────────────────────────── */
  boApiSvc.syBbs = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/bbs/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(bbsId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/sy/bbs/${bbsId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── sy: 게시판모드(BBM) ────────────────────────────────────── */
  boApiSvc.syBbm = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/bbm/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 브랜드 ─────────────────────────────────────────────── */
  boApiSvc.syBrand = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/brand/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 공통코드 ───────────────────────────────────────────── */
  boApiSvc.syCode = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/code/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(codeId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/sy/code/${codeId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── sy: 문의(Contact) ──────────────────────────────────────── */
  boApiSvc.syContact = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/contact/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(inquiryId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/sy/contact/${inquiryId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── sy: 메뉴 ───────────────────────────────────────────────── */
  boApiSvc.syMenu = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/menu/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 역할 ───────────────────────────────────────────────── */
  boApiSvc.syRole = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/role/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 사이트 ─────────────────────────────────────────────── */
  boApiSvc.sySite = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/site/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 템플릿 ─────────────────────────────────────────────── */
  boApiSvc.syTemplate = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/template/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(templateId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/sy/template/${templateId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── sy: 사용자 (관리자 계정) ───────────────────────────────── */
  boApiSvc.syUser = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/user/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(userId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/sy/user/${userId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── sy: 업체(Vendor) (최다 공유) ──────────────────────────── */
  boApiSvc.syVendor = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/vendor/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  global.boApiSvc = boApiSvc;
})(window);
