/**
 * mdSgApiSvc.js — 모듈(md) > 소스젠(sg) 도메인 전용 API 서비스
 *
 * 백엔드가 FO/BO 구분 없는 단일 엔드포인트(/api/md/sg/...)라 coApiSvc 처럼 client() 로
 * foApi/boApi 를 자동 선택한다(둘 중 로드된 쪽 사용, 권한 구분 없음 — md/cb 와 동일 방침).
 *
 * 선행 로드: utils/coUtil.js + (FO 화면이면 utils/foApiAxios.js) + (BO 화면이면 utils/boApiAxios.js)
 *
 * 사용법:
 *   const res = await mdSgApiSvc.project.getPage({ pageNo: 1, pageSize: 20 });
 *   const res = await mdSgApiSvc.ddl.saveList(projectId, rows);
 *   const res = await mdSgApiSvc.genHist.create(projectId, { fileCount, attachId, ... });
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

  const mdSgApiSvc = {};

  /* ── project: 소스젠 프로젝트 마스터 ────────────────────────── */
  mdSgApiSvc.project = {
    getList(params, uiNm, cmdNm)   { return client().get('/md/sg/project', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm)   { return client().get('/md/sg/project/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || client().get(`/md/sg/project/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return client().post('/md/sg/project', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || client().put(`/md/sg/project/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || client().delete(`/md/sg/project/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── ddl: 프로젝트의 DDL 탭 (프로젝트당 전체 교체 저장) ─────── */
  mdSgApiSvc.ddl = {
    getList(projectId, uiNm, cmdNm)        { return chkId(projectId, uiNm, cmdNm) || client().get(`/md/sg/project/${projectId}/ddls`, hdr(uiNm, cmdNm)); },
    saveList(projectId, rows, uiNm, cmdNm) { return chkId(projectId, uiNm, cmdNm) || client().post(`/md/sg/project/${projectId}/ddls`, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── genHist: 소스 생성 이력 (결과 ZIP 은 sy_attach 첨부로 보관) ─ */
  mdSgApiSvc.genHist = {
    /* getPage — 소스젠 경계를 넘는 전체 생성이력 페이징 조회(이력 화면용) */
    getPage(params, uiNm, cmdNm)         { return client().get('/md/sg/project/gen-hists/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(projectId, uiNm, cmdNm)      { return chkId(projectId, uiNm, cmdNm) || client().get(`/md/sg/project/${projectId}/gen-hists`, hdr(uiNm, cmdNm)); },
    create(projectId, body, uiNm, cmdNm) { return chkId(projectId, uiNm, cmdNm) || client().post(`/md/sg/project/${projectId}/gen-hists`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)             { return chkId(_id, uiNm, cmdNm) || client().delete(`/md/sg/project/gen-hists/${_id}`, hdr(uiNm, cmdNm)); },
    /* incrementDownload — [다운로드] 클릭마다 download_count 1 증가(2026-08-30). 로그성 호출 — 실패해도
       다운로드 자체를 막으면 안 되므로 호출부에서 catch 로 무시 */
    incrementDownload(_id, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || client().patch(`/md/sg/project/gen-hists/${_id}/download`, {}, hdr(uiNm, cmdNm)); },
  };

  /* ── downloadHist: FO [⬇ ZIP 다운로드] 클릭 기록 (파일 재보관 없이 로그만) ─ */
  mdSgApiSvc.downloadHist = {
    getPage(params, uiNm, cmdNm) { return client().get('/md/sg/download-hist/page', { params, ...hdr(uiNm, cmdNm) }); },
    /* create — 로그성 호출. 실패해도 다운로드 자체를 막으면 안 되므로 호출부에서 catch 로 무시 */
    create(body, uiNm, cmdNm)    { return client().post('/md/sg/download-hist', body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || client().delete(`/md/sg/download-hist/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── stack: [소스 생성] 팝오버 언어/스택 카탈로그 (BO 관리, FO 팝오버 조회) ─ */
  mdSgApiSvc.stack = {
    getList(params, uiNm, cmdNm)   { return client().get('/md/sg/stack', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm)   { return client().get('/md/sg/stack/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || client().get(`/md/sg/stack/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return client().post('/md/sg/stack', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || client().put(`/md/sg/stack/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || client().delete(`/md/sg/stack/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm) { return client().post(`/md/sg/stack/save-list/${cmd}`, rows, hdr(uiNm, cmdNm)); },
  };

  global.mdSgApiSvc = mdSgApiSvc;
})(window);
