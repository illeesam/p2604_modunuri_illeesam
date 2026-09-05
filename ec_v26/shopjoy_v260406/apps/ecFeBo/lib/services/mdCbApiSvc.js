/**
 * mdCbApiSvc.js — 모듈(md) > 코바늘(cb) 도안 도메인 전용 API 서비스
 *
 * 백엔드가 FO/BO 구분 없는 단일 엔드포인트(/api/md/cb/...)라 coApiSvc 처럼 client() 로
 * foApi/boApi 를 자동 선택한다(둘 중 로드된 쪽 사용, 권한 구분 없음 — 2026-08-23 단순화 확정).
 *
 * 선행 로드: utils/coUtil.js + (FO 화면이면 utils/foApiAxios.js) + (BO 화면이면 utils/boApiAxios.js)
 *
 * 사용법:
 *   const res = await mdCbApiSvc.symbol.getList();
 *   const res = await mdCbApiSvc.pattern.getPage({ pageNo: 1, pageSize: 20 });
 *   const res = await mdCbApiSvc.patternCell.saveList(patternId, rows);
 */
(function (global) {
  'use strict';

  function client() {
    return global.boApi || global.foApi || null;
  }

  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.cofApiHdr(uiNm, cmdNm) : {};
  }
  const chkId = (...a) => coUtil.cofChkId(...a);

  const mdCbApiSvc = {};

  /* ── symbol: 코바늘 기호 사전 ───────────────────────────────── */
  mdCbApiSvc.symbol = {
    getList(params, uiNm, cmdNm)   { return client().get('/md/cb/symbol', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm)   { return client().get('/md/cb/symbol/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || client().get(`/md/cb/symbol/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return client().post('/md/cb/symbol', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || client().put(`/md/cb/symbol/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || client().delete(`/md/cb/symbol/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm) { return client().post(`/md/cb/symbol/save-list/${cmd}`, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── yarn: 코바늘 실 마스터 ─────────────────────────────────── */
  mdCbApiSvc.yarn = {
    getList(params, uiNm, cmdNm)   { return client().get('/md/cb/yarn', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm)   { return client().get('/md/cb/yarn/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || client().get(`/md/cb/yarn/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return client().post('/md/cb/yarn', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || client().put(`/md/cb/yarn/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || client().delete(`/md/cb/yarn/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm) { return client().post(`/md/cb/yarn/save-list/${cmd}`, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── pattern: 코바늘 도안 마스터 ────────────────────────────── */
  mdCbApiSvc.pattern = {
    getList(params, uiNm, cmdNm)   { return client().get('/md/cb/pattern', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm)   { return client().get('/md/cb/pattern/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || client().get(`/md/cb/pattern/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return client().post('/md/cb/pattern', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || client().put(`/md/cb/pattern/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || client().delete(`/md/cb/pattern/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── patternCell: 도안 격자 셀 (패턴당 전체 교체 저장) ──────── */
  mdCbApiSvc.patternCell = {
    getList(patternId, uiNm, cmdNm)        { return chkId(patternId, uiNm, cmdNm) || client().get(`/md/cb/pattern/${patternId}/cells`, hdr(uiNm, cmdNm)); },
    saveList(patternId, rows, uiNm, cmdNm) { return chkId(patternId, uiNm, cmdNm) || client().post(`/md/cb/pattern/${patternId}/cells`, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── patternYarn: 도안-실 매핑(재료 목록, 패턴당 전체 교체 저장) ─ */
  mdCbApiSvc.patternYarn = {
    getList(patternId, uiNm, cmdNm)        { return chkId(patternId, uiNm, cmdNm) || client().get(`/md/cb/pattern/${patternId}/yarns`, hdr(uiNm, cmdNm)); },
    saveList(patternId, rows, uiNm, cmdNm) { return chkId(patternId, uiNm, cmdNm) || client().post(`/md/cb/pattern/${patternId}/yarns`, rows, hdr(uiNm, cmdNm)); },
  };

  global.mdCbApiSvc = mdCbApiSvc;
})(window);
