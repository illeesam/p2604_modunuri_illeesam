/* ShopJoy Admin - 엑셀다운로드 상세 (요청 상세정보 + 생성 파일 목록)
 *   · SyExceldownMng 하단에 인라인 임베드되어 dtlId(exceldownId) 로 상세를 표시한다.
 *   · 다운로드 시 downloadCount 가 올라가므로 부모(Mng)에게 @downloaded 로 알려 그리드를 갱신한다.
 */
window.SyExceldownDtl = {
  name: 'SyExceldownDtl',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
    dtlId:        { type: String,   default: null },                        // 대상 exceldownId
  },
  emits: ['downloaded'],
  setup(props, { emit }) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { reactive, onMounted } = Vue;

    const uiState = reactive({ loading: false, detail: null });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 라우팅 */
    const handleBtnAction = (cmd, param) => {
      console.log(' ■■ SyExceldownDtl : handleBtnAction -> ', cmd, param);
      if (cmd === 'file-download')     { return handleDownloadFile(param); }
      if (cmd === 'file-download-all') { return handleDownloadAllFiles(); }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] 내장 사용 함수 ################################################## */

    /* fnStatusLabel — 상태 한글명 */
    const fnStatusLabel = (v) => ({
      WAITING: '대기', RUNNING: '진행중', DONE: '완료',
      FAIL: '실패', TIMEOUT: '시간초과', CANCELED: '취소',
    }[v] || v || '-');

    /* fnStatusBadge — 상태 배지 색 */
    const fnStatusBadge = (v) => ({
      WAITING: 'badge-orange', RUNNING: 'badge-blue', DONE: 'badge-green',
      FAIL: 'badge-red', TIMEOUT: 'badge-red', CANCELED: 'badge-gray',
    }[v] || 'badge-gray');

    /* fnDateTime — 표시용 일시 */
    const fnDateTime = (v) => (v ? String(v).replace('T', ' ').substring(0, 19) : '-');

    /* fnFileSize — byte → 읽기 쉬운 단위 */
    const fnFileSize = (n) => {
      if (!n) { return '-'; }
      if (n < 1024) { return n + ' B'; }
      if (n < 1024 * 1024) { return (n / 1024).toFixed(1) + ' KB'; }
      return (n / 1024 / 1024).toFixed(1) + ' MB';
    };

    /* detailFormColumns — sy_exceldown 테이블 전체 컬럼을 3개 중간그룹(기본정보/실행결과/조건·헤더)으로
       묶어 3열 readonly 폼으로 표시. type:'group' 은 BoFormArea 공통기능(2026-08-16 추가) —
       25~30개처럼 항목이 많을 때 섹션 제목으로 시각 구분한다. */
    const detailFormColumns = [
      { type: 'group', label: '기본정보' },
      { key: 'exceldownId', label: '요청ID', type: 'readonly', html: true,
        fmt: (v) => `<span style="font-family:monospace;font-size:12px;">${v || '-'}</span>` },
      { key: 'exceldownStatusCd', label: '상태', type: 'readonly', html: true,
        fmt: (v) => `<span class="badge ${fnStatusBadge(v)}">${fnStatusLabel(v)}</span>` },
      { key: 'runTypeCd', label: '방식', type: 'readonly', html: true,
        fmt: (v) => `<span class="badge ${v === 'ASYNC' ? 'badge-purple' : 'badge-blue'}">${v === 'ASYNC' ? '예약' : '즉시'}</span>` },

      { key: 'domainNm', label: '대상', type: 'readonly', colSpan: 2,
        fmt: (v, f) => `${v || f.domainCd || '-'} (${f.domainCd || '-'})` },
      { key: 'podId', label: '실행서버', type: 'readonly', html: true,
        fmt: (v) => `<span style="font-family:monospace;font-size:12px;">${v || '-'}</span>` },

      { key: 'uiNm', label: '화면명', type: 'readonly', fmt: (v) => v || '-' },
      { key: 'regUserNm', label: '요청자', type: 'readonly',
        fmt: (v, f) => `${v || f.regBy || '-'} (${f.regBy || '-'})` },
      { key: 'regDate', label: '요청일시', type: 'readonly', fmt: (v) => fnDateTime(v) },

      { key: 'apiUrl', label: 'API', type: 'readonly', colSpan: 3, html: true,
        fmt: (v, f) => `<span style="font-family:monospace;font-size:12px;">`
          + `<span class="badge badge-gray" style="margin-right:6px;">${f.apiMethodCd || 'GET'}</span>${v || '-'}</span>` },

      { type: 'group', label: '실행결과' },
      { key: 'totalCount', label: '건수', type: 'readonly',
        fmt: (v, f) => `예상 ${(v || 0).toLocaleString()}건 / 실제 ${(f.doneCount || 0).toLocaleString()}건` },
      { key: 'elapsedMs', label: '소요', type: 'readonly',
        fmt: (v) => v == null ? '-' : (v < 1000 ? v + 'ms' : (v / 1000).toFixed(1) + 's') },
      { key: 'fileCount', label: '파일', type: 'readonly',
        fmt: (v, f) => `${v || 0}개 / ${fnFileSize(f.totalFileSize)}` },

      { key: 'startDate', label: '시작일시', type: 'readonly', fmt: (v) => fnDateTime(v) },
      { key: 'endDate', label: '종료일시', type: 'readonly', fmt: (v) => fnDateTime(v) },
      { key: 'expireDate', label: '보관만료', type: 'readonly', fmt: (v) => fnDateTime(v) },

      { key: 'downloadCount', label: '다운로드', type: 'readonly', fmt: (v) => `${v || 0}회` },
      { key: 'lastDownloadDate', label: '최종다운로드', type: 'readonly', fmt: (v) => fnDateTime(v) },
      { key: 'regSiteId', label: '등록사이트', type: 'readonly', html: true,
        fmt: (v) => `<span style="font-family:monospace;font-size:12px;">${v || '-'}</span>` },

      { key: 'updBy', label: '수정', type: 'readonly', fmt: (v, f) => `${v || '-'} / ${fnDateTime(f.updDate)}` },
      { key: 'cancelBy', label: '취소자', type: 'readonly', visible: (f) => !!f.cancelBy, fmt: (v) => v },
      { key: 'cancelDate', label: '취소일시', type: 'readonly', visible: (f) => !!f.cancelBy, fmt: (v) => fnDateTime(v) },

      { key: 'searchCondText', label: '조건값', type: 'readonly', colSpan: 3, fmt: (v) => v || '-' },
      { key: 'excelColumns', label: '헤더명', type: 'readonly', colSpan: 3, fmt: (v) => v || '-' },
      { key: 'errorMsg', label: '사유', type: 'readonly', colSpan: 3, visible: (f) => !!f.errorMsg, html: true,
        fmt: (v) => `<span style="color:#d9363e;">${String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>` },
    ];

    /* fnTriggerDownload — 브라우저 다운로드만 실행 (API 호출 없음).
       단일/전체 다운로드가 카운트 처리 방식이 서로 달라(단일=매번 +1, 전체=한 번에 +1)
       실제 파일 내려받기 동작만 여기로 분리했다.
       ⚠ window.envBoConsts.apiHost 는 존재하지 않는 필드라 항상 '' 로 떨어져, 상대경로가
       프론트(Live Server, 5501) origin 으로 풀리는 버그가 있었다 — 백엔드(3000)엔 그 경로가
       없어 404 HTML 을 .xlsx 로 저장해버림("파일 형식이 잘못되어..." 오류의 실제 원인, 2026-08-16
       확인). window.cdnUrl() 로 항상 백엔드 절대경로를 만든다. */
    const fnTriggerDownload = (file) => {
      const url = file.attachUrl || file.cdnImgUrl;
      if (!url) { props.showToast(`${file.fileNm || '파일'} 경로가 없습니다.`, 'error'); return false; }
      const a = document.createElement('a');
      a.href = window.cdnUrl ? window.cdnUrl(url) : url;
      a.download = file.fileNm || '';
      a.target = '_blank';
      a.click();
      return true;
    };

    /* handleDownloadFile — 파일 1개 다운로드 + 횟수 카운트 */
    const handleDownloadFile = async (file) => {
      try {
        if (!fnTriggerDownload(file)) { return; }
        await boApiSvc.syExceldown.markDownloaded(props.dtlId, '엑셀다운로드', '다운로드');
        emit('downloaded');
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '다운로드 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* handleDownloadAllFiles — 분할 저장(N개) 건을 한 번에 전부 받는다.
       브라우저가 짧은 간격의 다중 다운로드를 팝업 차단으로 막는 경우가 있어 약간의 간격을 둔다.
       카운트는 파일별이 아니라 "전체 다운로드" 동작 1회로 +1 한다. */
    const handleDownloadAllFiles = async () => {
      const files = (uiState.detail && uiState.detail.attachFiles) || [];
      if (!files.length) { return; }
      files.forEach((f, i) => setTimeout(() => fnTriggerDownload(f), i * 350));
      try {
        await boApiSvc.syExceldown.markDownloaded(props.dtlId, '엑셀다운로드', '전체다운로드');
        setTimeout(() => emit('downloaded'), files.length * 350 + 300);
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '다운로드 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* fnLoadDetail — 상세(파일 목록 포함) 조회 */
    const fnLoadDetail = async () => {
      if (!props.dtlId) { uiState.detail = null; return; }
      uiState.loading = true;
      uiState.detail = null;
      try {
        const res = await boApiSvc.syExceldown.getById(props.dtlId, '엑셀다운로드', '상세조회');
        uiState.detail = res.data?.data || null;
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '상세 조회 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* ##### [04] 라이프사이클 ##################################################### */

    /* Mng 가 :key="dtlId" 로 행 전환마다 재마운트하는 표준 패턴이므로 onMounted 1회로 충분 */
    onMounted(fnLoadDetail);

    /* ##### [05] return (템플릿 노출) ############################################## */

    return {
      uiState, detailFormColumns,
      handleBtnAction, fnFileSize,
    };
  },
  template: /* html */`
<div>
  <div v-if="uiState.loading || !uiState.detail" style="padding:16px;text-align:center;color:#999;font-size:12px;">
    불러오는 중...
  </div>
  <div v-else style="padding:2px 4px 4px;">
    <!-- ===== ■. 요약 — sy_exceldown 테이블 전체 정보, 3열 readonly 폼(중간그룹 3단) ================ -->
    <bo-form-area plain-readonly :columns="detailFormColumns" :form="uiState.detail" readonly compact :cols="3" :show-actions="false" />
    <!-- ===== □. 요약 ======================================================== -->
    <!-- ===== ■. 파일 목록 ==================================================== -->
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;">
      <span>파일 목록</span>
      <button v-if="uiState.detail.attachFiles && uiState.detail.attachFiles.length > 1"
        class="btn btn_row_download" @click="handleBtnAction('file-download-all')">
        전체 다운로드 ({{ uiState.detail.attachFiles.length }}개)
      </button>
    </div>
    <div v-if="!uiState.detail.attachFiles || uiState.detail.attachFiles.length === 0"
      style="padding:14px;text-align:center;color:#bbb;font-size:12px;border:1px dashed #e0e0e0;border-radius:8px;">
      생성된 파일이 없습니다. (미완료이거나 보관기간이 지났습니다)
    </div>
    <div v-else>
      <div v-for="(f, i) in uiState.detail.attachFiles" :key="f.attachId"
        style="display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #eee;border-radius:8px;margin-bottom:6px;background:#fafafa;">
        <span style="font-size:11px;color:#999;width:44px;">{{ (i+1) }}/{{ uiState.detail.attachFiles.length }}</span>
        <span style="flex:1;font-size:12px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ f.fileNm }}</span>
        <span style="font-size:11px;color:#888;width:76px;text-align:right;">{{ fnFileSize(f.fileSize) }}</span>
        <button class="btn btn_row_edit" @click="handleBtnAction('file-download', f)">다운로드</button>
      </div>
    </div>
    <!-- ===== □. 파일 목록 ==================================================== -->
  </div>
</div>
`
};
