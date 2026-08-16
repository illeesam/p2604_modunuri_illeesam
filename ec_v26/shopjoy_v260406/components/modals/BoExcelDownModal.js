/* ShopJoy Admin - 엑셀다운로드 공통 모달
 *
 * 사용법 (그리드가 있는 화면 어디서나 동일):
 *   <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
 *   <bo-excel-down-modal :show="excelModal.show" domain="memberLoginLog"
 *     area-nm="회원 로그인 로그" ui-nm="회원로그인이력"
 *     :params="buildSearchParams()" @close="excelModal.show = false" />
 *
 * 동작
 *   열릴 때 status API 로 (진행중 건 / 대기열 / 대상건수 / 임계값) 을 받아 버튼 상태를 결정한다.
 *   · 진행중 건 있음 → 상세정보 표시 + 즉시/예약 비활성 + [강제취소] 노출
 *   · 대상건수 <= 임계 → 즉시다운로드(기본 선택)
 *   · 대상건수 >  임계 → 즉시 비활성, 예약다운로드 권장
 */
window.BoExcelDownModal = {
  name: 'BoExcelDownModal',
  props: {
    show:   { type: Boolean, default: false },                  // 표시 여부
    domain: { type: String,  required: true },                  // 백엔드 ExcelDomainConfig key
    areaNm: { type: String,  default: '' },                     // 파일명 prefix (한글 영역명)
    uiNm:   { type: String,  default: '' },                     // 요청 화면명 (이력 기록용)
    params: { type: Object,  default: () => ({}) },             // 현재 검색조건 (그대로 전달)
    columns:{ type: Array,   default: () => ([]) },             // 그리드 컬럼 정의 — 엑셀 컬럼/순서/라벨을 화면과 일치시킨다
    condText: { type: String, default: '' },                    // 검색조건 사람이 읽는 한 줄(선택). 없으면 params 로 자동 생성
  },
  emits: ['close'],
  setup(props, { emit }) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { reactive, computed, watch } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    const uiState = reactive({
      loading: false,      // status 조회중
      running: false,      // 즉시 다운로드 실행중
      mode: 'sync',        // 'sync' | 'async'
      status: null,        // 서버 status 응답
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 라우팅 */
    const handleBtnAction = (cmd, param) => {
      console.log(' ■■ BoExcelDownModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close')      { return onClose(); }
      if (cmd === 'excel-run')        { return handleRun(); }
      if (cmd === 'running-cancel')   { return handleCancelRunning(); }
      if (cmd === 'mode-select')      { uiState.mode = param; return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] computed ####################################################### */

    const cfBusy       = computed(() => !!(uiState.status && uiState.status.running));
    const cfRunning    = computed(() => (uiState.status && uiState.status.running) || null);
    const cfTotal      = computed(() => (uiState.status && uiState.status.targetCount) || 0);
    const cfSyncMax    = computed(() => (uiState.status && uiState.status.syncMaxRows) || 0);
    const cfSplitRows  = computed(() => (uiState.status && uiState.status.splitRows) || 0);
    const cfWaiting    = computed(() => (uiState.status && uiState.status.waitingCount) || 0);
    const cfSyncOk     = computed(() => !!(uiState.status && uiState.status.syncAllowed));
    const cfEmpty      = computed(() => cfTotal.value <= 0);
    /* 예약 시 몇 개 파일로 쪼개지는지 미리 알려준다 */
    const cfFileCount  = computed(() => {
      const s = cfSplitRows.value;
      if (!s || s <= 0) { return 1; }
      return Math.max(1, Math.ceil(cfTotal.value / s));
    });

    /* cfCols — 화면 전용 컬럼(_ 접두어) 제외 + excelKeys 조합 컬럼 펼침. fnExcelParams 와
       "다운로드 정보" 표시가 서로 다른 컬럼을 보여주면 안 되므로 이 하나로 공유한다. */
    const cfCols = computed(() => {
      const cols = [];
      (props.columns || []).forEach(c => {
        if (!c || !c.key) { return; }
        if (Array.isArray(c.excelKeys) && c.excelKeys.length) {
          c.excelKeys.forEach(ek => {
            const key   = typeof ek === 'string' ? ek : ek.key;
            const label = typeof ek === 'string' ? key : (ek.label || ek.key);
            if (key) { cols.push({ key, label }); }
          });
          return;
        }
        if (String(c.key).startsWith('_')) { return; }
        cols.push({ key: c.key, label: c.label || c.key });
      });
      return cols;
    });

    /* cfColumnText — "다운로드 정보" 카드에 보여줄 헤더명 나열 */
    const cfColumnText = computed(() => cfCols.value.map(c => c.label).join(', ') || '(전체 컬럼)');

    /* cfCondText — 조건값정보. 화면이 condText prop 으로 예쁜 문장을 직접 주면 그걸 쓰고,
       없으면 params 를 key: value 로 나열한다(서버 쪽 BoExcelDownService.condText() 와 동일 로직 —
       화면에 보여준 문구와 실제 저장되는 이력 문구가 어긋나지 않게 하기 위함). */
    const cfCondText = computed(() => {
      if (props.condText) { return props.condText; }
      const entries = Object.entries(props.params || {})
        .filter(([k, v]) => v !== null && v !== undefined && String(v).trim() !== ''
          && k !== 'pageNo' && k !== 'pageSize' && k !== 'excelColumns' && k !== 'excelCondText')
        .map(([k, v]) => `${k}: ${v}`);
      return entries.length ? entries.join(' / ') : '(전체 조회)';
    });

    /* ##### [04] 내장 사용 함수 ################################################## */

    /* fnNum — 천단위 콤마 */
    const fnNum = (n) => (n == null ? '0' : Number(n).toLocaleString());

    /* fnExcelParams — 검색조건 + 그리드 헤더를 합친 요청 파라미터.
       그리드 헤더를 안 보내면 서버가 Entity 필드로 파일을 만들어 화면과 컬럼이 어긋난다.

       컬럼 처리 규칙 (그리드 정의 순서 유지)
         · 일반 컬럼            → key 그대로 사용
         · `_` 로 시작하는 컬럼 → 화면 전용(행번호 _no, 펼침 _exp, 액션 _act 등)이라 서버에 대응 값이 없다.
                                 다만 여러 필드를 합쳐 보여주는 조합 컬럼(예: _member = 회원명+ID)은
                                 컬럼 정의에 excelKeys: ['memberNm','memberId'] 를 선언해두면
                                 그 필드들로 펼쳐서 내보낸다. 선언이 없으면 조용히 제외한다. */
    const fnExcelParams = () => {
      const p = { ...(props.params || {}) };
      if (cfCols.value.length) { p.excelColumns = fnEncodeCols(cfCols.value); }
      /* 화면에 보여준 "조건값정보" 문구를 그대로 이력에 남긴다 — 서버가 params 로 재조합하면
         화면 표시 문구와 저장 문구가 어긋날 수 있어 여기서 확정한 텍스트를 넘긴다. */
      p.excelCondText = cfCondText.value;
      return p;
    };

    /* fnEncodeCols — 컬럼 목록을 `key:label,key:label` 로 직렬화한다.
       ⚠ JSON 을 그대로 넘기면 안 된다. axios 의 buildURL encode 는 %5B/%5D 를 다시 `[`/`]` 로
       되돌려 보내는데(의도된 동작), Tomcat 은 쿼리스트링의 `[`/`]` 를 기본적으로 거부해
       요청이 서버에 닿기도 전에 net::ERR_FAILED 로 끊긴다.
       `:` 와 `,` 는 쿼리에서 합법이라 그대로 두어도 안전하고, 한글 라벨은 axios 가 퍼센트 인코딩한다.
       라벨 안의 `:`/`,` 는 구분자와 충돌하므로 공백으로 치환한다. */
    const fnEncodeCols = (cols) => cols
      .map(c => `${c.key}:${String(c.label).replace(/[:,]/g, ' ')}`)
      .join(',');

    /* fnDateTime — 표시용 일시 */
    const fnDateTime = (v) => (v ? String(v).replace('T', ' ').substring(0, 19) : '-');

    /* handleLoadStatus — 열릴 때 서버 상태 조회 */
    const handleLoadStatus = async () => {
      uiState.loading = true;
      uiState.status = null;
      try {
        const res = await boApiSvc.syExceldown.getStatus(props.domain, props.params, props.uiNm, '엑셀상태조회');
        uiState.status = res.data?.data || null;
        /* 임계 초과면 예약을 기본 선택으로 바꿔준다 */
        uiState.mode = cfSyncOk.value ? 'sync' : 'async';
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '상태 조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleRun — 선택한 방식으로 실행.
       showConfirm 을 쓰지 않는다 — 이 모달 자체가 이미 확인 단계다(건수 확인 + 방식 선택 + 버튼 클릭).
       정책상으로도 다운로드는 읽기 전용 동작이라 confirm 제외 대상이다
       (변경성 동작인 [강제취소]는 아래에서 confirm 을 유지한다). */
    const handleRun = async () => {
      if (cfEmpty.value) { showToast('다운로드할 데이터가 없습니다.', 'error'); return; }

      if (uiState.mode === 'sync') {
        uiState.running = true;
        try {
          await boApiSvc.syExceldown.downloadSync(props.domain, fnExcelParams(), props.areaNm, props.uiNm, '즉시다운로드');
          showToast('다운로드가 완료되었습니다.', 'success');
          onClose();
        } catch (err) {
          showToast(await fnBlobErrMsg(err), 'error', 0);
        } finally {
          uiState.running = false;
        }
        return;
      }

      uiState.running = true;
      try {
        const res = await boApiSvc.syExceldown.requestAsync(props.domain, fnExcelParams(), props.uiNm, '예약다운로드');
        showToast(res.data?.message || '예약되었습니다. 완료되면 알림으로 알려드립니다.', 'success');
        onClose();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '예약 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.running = false;
      }
    };

    /* handleCancelRunning — 진행중 건 강제취소 후 상태 재조회 */
    const handleCancelRunning = async () => {
      const r = cfRunning.value;
      if (!r) { return; }
      const ok = await showConfirm('강제취소',
        `진행 중인 [${r.domainNm || r.domainCd}] 요청을 취소하시겠습니까?\n생성 중인 파일은 삭제됩니다.`);
      if (!ok) { return; }
      try {
        await boApiSvc.syExceldown.cancel(r.exceldownId, props.uiNm, '강제취소');
        showToast('취소되었습니다.', 'success');
        await handleLoadStatus();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '취소 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnBlobErrMsg — 즉시 다운로드는 responseType=blob 이라 에러 본문도 blob 으로 온다 */
    const fnBlobErrMsg = async (err) => {
      const d = err.response?.data;
      if (d instanceof Blob) {
        try {
          const j = JSON.parse(await d.text());
          return j.message || '다운로드 중 오류가 발생했습니다.';
        } catch (e) { /* blob 이 JSON 이 아니면 아래 기본 문구 */ }
      }
      return err.response?.data?.message || err.message || '다운로드 중 오류가 발생했습니다.';
    };

    /* onClose — 닫기 */
    const onClose = () => emit('close');

    /* ##### [05] watch ########################################################## */

    watch(() => props.show, (v) => { if (v) { handleLoadStatus(); } });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, handleBtnAction,
      cfBusy, cfRunning, cfTotal, cfSyncMax, cfSplitRows, cfWaiting, cfSyncOk, cfEmpty, cfFileCount,
      cfCondText, cfColumnText,
      fnNum, fnDateTime, fnExcelParams,
    };
  },
  template: /* html */`
<bo-modal :show="show" title="📗 엑셀 다운로드" width="560px" @close="handleBtnAction('modal-close')">
  <!-- ===== ■. 조회중 ====================================================== -->
  <div v-if="uiState.loading" style="padding:24px;text-align:center;color:#999;font-size:13px;">
    대상 건수를 확인하는 중입니다...
  </div>
  <div v-else>
    <!-- ===== ■. 진행중 안내 (동시 1건 제한) ================================== -->
    <div v-if="cfBusy" style="border:1px solid #ffd6d6;background:#fff5f5;border-radius:8px;padding:12px;margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;color:#d9363e;margin-bottom:8px;">
        이미 진행 중인 엑셀 다운로드가 있습니다
      </div>
      <table style="width:100%;font-size:12px;color:#555;">
        <tr><td style="width:78px;color:#999;padding:2px 0;">대상</td><td>{{ cfRunning.domainNm || cfRunning.domainCd }}</td></tr>
        <tr><td style="color:#999;padding:2px 0;">요청자</td><td>{{ cfRunning.regUserNm || cfRunning.regBy || '-' }}</td></tr>
        <tr><td style="color:#999;padding:2px 0;">요청화면</td><td>{{ cfRunning.uiNm || '-' }}</td></tr>
        <tr><td style="color:#999;padding:2px 0;">API</td><td style="font-family:monospace;font-size:11px;">{{ cfRunning.apiUrl || '-' }}</td></tr>
        <tr><td style="color:#999;padding:2px 0;">건수</td><td>{{ fnNum(cfRunning.totalCount) }}건</td></tr>
        <tr><td style="color:#999;padding:2px 0;">진행</td><td>{{ fnNum(cfRunning.doneCount) }}건 처리됨</td></tr>
        <tr><td style="color:#999;padding:2px 0;">시작</td><td>{{ fnDateTime(cfRunning.startDate) }}</td></tr>
        <tr><td style="color:#999;padding:2px 0;">실행서버</td><td style="font-family:monospace;font-size:11px;">{{ cfRunning.podId || '-' }}</td></tr>
      </table>
      <div style="margin-top:10px;text-align:right;">
        <button class="btn btn_row_delete" @click="handleBtnAction('running-cancel')">기존 작업 강제취소</button>
      </div>
    </div>
    <!-- ===== ■. 대상 건수 =================================================== -->
    <div style="border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:14px;background:#fafafa;">
      <div style="display:flex;align-items:baseline;gap:8px;">
        <span style="font-size:12px;color:#888;">다운로드 대상</span>
        <span style="font-size:20px;font-weight:700;color:#333;">{{ fnNum(cfTotal) }}</span>
        <span style="font-size:12px;color:#888;">건</span>
        <span v-if="cfWaiting > 0" style="margin-left:auto;font-size:11px;color:#fa8c16;">
          대기열 {{ cfWaiting }}건
        </span>
      </div>
      <div v-if="cfEmpty" style="font-size:12px;color:#d9363e;margin-top:6px;">
        조건에 해당하는 데이터가 없습니다. 검색조건을 확인해주세요.
      </div>
    </div>
    <!-- ===== ■. 다운로드 정보 (화면명 / 조건값정보 / 헤더명) — 이 화면에서 실제로 저장·다운로드될
         내용을 실행 전에 확인시키고, sy_exceldown 이력에도 동일 문구로 남는다 ================== -->
    <div style="border:1px solid #eee;border-radius:8px;padding:10px 12px;margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;color:#888;margin-bottom:6px;">다운로드 정보</div>
      <table style="width:100%;font-size:12px;color:#555;">
        <tr>
          <td style="width:68px;color:#999;padding:3px 0;vertical-align:top;">화면명</td>
          <td>{{ uiNm || '-' }}</td>
        </tr>
        <tr>
          <td style="color:#999;padding:3px 0;vertical-align:top;">조건값</td>
          <td style="word-break:break-all;">{{ cfCondText }}</td>
        </tr>
        <tr>
          <td style="color:#999;padding:3px 0;vertical-align:top;">헤더명</td>
          <td style="word-break:break-all;">{{ cfColumnText }}</td>
        </tr>
      </table>
    </div>
    <!-- ===== ■. 방식 선택 =================================================== -->
    <div style="display:flex;flex-direction:column;gap:8px;">
      <!-- 즉시 -->
      <label :style="'display:flex;gap:10px;padding:11px 12px;border-radius:8px;border:1px solid ' + (uiState.mode==='sync' ? '#1677ff' : '#e5e5e5') + ';' + ((cfSyncOk ? false : true) ? 'opacity:0.5;cursor:not-allowed;' : 'cursor:pointer;')">
        <input type="radio" value="sync" v-model="uiState.mode" :disabled="!cfSyncOk" style="margin-top:2px;" />
        <span style="flex:1;">
          <span style="font-size:13px;font-weight:600;color:#333;">즉시 다운로드</span>
          <span style="font-size:11px;color:#999;margin-left:6px;">기본</span>
          <div style="font-size:11px;color:#888;margin-top:3px;">
            지금 바로 받습니다. {{ fnNum(cfSyncMax) }}건 이하만 가능합니다.
          </div>
          <div v-if="cfBusy" style="font-size:11px;color:#d9363e;margin-top:3px;">
            진행 중인 작업이 있어 사용할 수 없습니다.
          </div>
          <div v-else-if="cfTotal > cfSyncMax" style="font-size:11px;color:#d9363e;margin-top:3px;">
            {{ fnNum(cfSyncMax) }}건을 초과해 사용할 수 없습니다. 예약을 이용해주세요.
          </div>
        </span>
      </label>
      <!-- 예약 -->
      <label :style="'display:flex;gap:10px;padding:11px 12px;border-radius:8px;cursor:pointer;border:1px solid ' + (uiState.mode==='async' ? '#1677ff' : '#e5e5e5')">
        <input type="radio" value="async" v-model="uiState.mode" style="margin-top:2px;" />
        <span style="flex:1;">
          <span style="font-size:13px;font-weight:600;color:#333;">예약 다운로드</span>
          <div style="font-size:11px;color:#888;margin-top:3px;">
            백그라운드에서 만들고 완료되면 알림으로 알려드립니다.
            <template v-if="cfFileCount > 1">
              {{ fnNum(cfSplitRows) }}건씩 <b>{{ cfFileCount }}개 파일</b>로 나눠 저장됩니다.
            </template>
          </div>
          <div v-if="cfBusy" style="font-size:11px;color:#fa8c16;margin-top:3px;">
            진행 중인 작업 뒤 대기열 {{ cfWaiting + 1 }}번째로 추가됩니다.
          </div>
        </span>
      </label>
    </div>
    <!-- ===== ■. 동시 실행 정책 안내 (항상 노출) ================================ -->
    <div style="margin-top:14px;padding:10px 12px;border-radius:8px;background:#f5f8ff;border:1px solid #e3ecff;">
      <div style="font-size:11px;color:#1677ff;font-weight:600;margin-bottom:4px;">
        ℹ 엑셀 다운로드는 동시에 1건만 실행됩니다
      </div>
      <div style="font-size:11px;color:#7a8699;line-height:1.6;">
        대용량 생성이 서버 자원을 많이 써서, 사이트 전체에서 한 번에 하나만 처리합니다.<br />
        다른 사용자가 실행 중이면 <b>즉시 다운로드는 사용할 수 없고</b>, 예약은 대기열에 쌓였다가 순서대로 처리됩니다.
        <template v-if="cfBusy">
          <br />진행 중인 작업이 멈춘 것 같다면 위의 [기존 작업 강제취소]로 해제할 수 있습니다.
        </template>
      </div>
    </div>
  </div>
  <!-- ===== ■. 푸터 ======================================================== -->
  <template #footer>
    <button class="btn btn_confirm" :disabled="uiState.loading || uiState.running || cfEmpty"
      @click="handleBtnAction('excel-run')">
      {{ uiState.running ? '처리 중...' : (uiState.mode === 'sync' ? '다운로드' : '예약하기') }}
    </button>
    <button class="btn btn_close" @click="handleBtnAction('modal-close')">닫기</button>
  </template>
</bo-modal>
`
};
