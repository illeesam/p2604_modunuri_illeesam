/* ShopJoy Admin - 첨부파일 상세/수정 (SyAttachMng 인라인 임베드)
 * 첨부파일은 실 업로드로만 생성된다(신규 등록 없음) — 조회한 기존 레코드의
 * 연계정보(오연결 수정)·메모·정렬순서만 고친다. 파일 실체(파일명/크기/경로/URL 등)는
 * 읽기전용으로만 보여준다 — 물리 파일과 어긋나면 다운로드가 깨지기 때문. */
export default {
  name: 'SyAttachDtl',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
    dtlId:        { type: String,   default: null },                       // 첨부파일ID (attachId)
    tabMode:      { type: String,   default: 'tab' },                      // 뷰모드 (미사용, 표준 규격 유지)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;
    const showConfirm = window.boApp?.showConfirm || props.showConfirm;

    const uiState = reactive({ loading: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit'
    const baseForm = reactive({});

    const REF_TABLE_OPTS = reactive([]);
    const fnLoadRefTableOpts = async () => {
      const opts = await coUtil.cofGetAttachRefTableOptions();
      REF_TABLE_OPTS.splice(0, REF_TABLE_OPTS.length, ...opts.map(o => ({ value: o.value, label: o.label })));
    };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd) => {
      console.log(' ■■ SyAttachDtl.js : handleBtnAction -> ', cmd);
      if (cmd === 'form-edit') { uiState.dtlMode = 'edit'; return;
      } else if (cmd === 'form-cancel') { uiState.dtlMode = 'view'; return fnLoadDetail();
      } else if (cmd === 'form-save') { return handleSave();
      } else if (cmd === 'form-close') { return props.navigate('syAttachMng');
      } else { console.warn('[handleBtnAction] unknown cmd:', cmd); }
    };

    /* ##### [04] 내장 사용 함수 ##################################################### */

    /* fnLoadDetail — 상세 조회 */
    const fnLoadDetail = async () => {
      if (!props.dtlId) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syAttach.getById(props.dtlId, '첨부파일관리', '조회');
        Object.assign(baseForm, res.data?.data || {});
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '조회 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSave — 저장 (연계정보/메모/정렬순서만 수정 가능) */
    const handleSave = async () => {
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        await boApi.put(`/bo/sy/attach/${props.dtlId}`, {
          refTableNm: baseForm.refTableNm || null,
          refId: baseForm.refId || null,
          attachMemo: baseForm.attachMemo || null,
          sortOrd: baseForm.sortOrd,
        }, coUtil.apiHdr('첨부파일관리', '저장'));
        showToast('저장되었습니다.', 'success');
        uiState.dtlMode = 'view';
        await fnLoadDetail();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* fnFmtSize — 유틸 */
    const fnFmtSize = bytes => {
      if (!bytes) { return '0 B'; }
      if (bytes < 1024) { return bytes + ' B'; }
      if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(1) + ' KB'; }
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const initPage = async () => { await fnLoadRefTableOpts(); await fnLoadDetail(); };
    onMounted(initPage);

    /* ##### [05] 컬럼 정의 ########################################################## */

    const baseFormColumns = [
      { key: 'attachId',   label: '첨부파일ID', type: 'readonly', mono: true, colSpan: 2 },
      { key: 'fileExt',    label: '확장자',     type: 'readonly' },
      { key: 'fileNm',     label: '파일명',     type: 'readonly', colSpan: 2 },
      { key: 'fileSize',   label: '크기',       type: 'readonly', fmt: (v) => fnFmtSize(v) },
      { key: 'refTableNm', label: '연계 대상',  type: 'select', options: () => REF_TABLE_OPTS, hint: '오연결된 파일을 다른 대상으로 재연결할 때만 변경' },
      { key: 'refId',      label: '연계 ID',    type: 'text' },
      { key: 'sortOrd',    label: '정렬순서',   type: 'number' },
      { key: 'storedNm',      label: '저장파일명', type: 'readonly', colSpan: 2, mono: true },
      { key: 'storageTypeCd', label: '스토리지',   type: 'readonly' },
      { key: 'storagePath',   label: '저장경로',   type: 'readonly', colSpan: 3, mono: true },
      { key: 'attachUrl',     label: '파일 URL',   type: 'readonly', colSpan: 3, mono: true },
      { key: 'attachMemo',    label: '메모',       type: 'textarea', colSpan: 3 },
      { key: 'regBy',   label: '등록자',   type: 'readonly' },
      { key: 'regDate', label: '등록일시', type: 'readonly', fmt: (v) => v ? coUtil.cofYmdHms(v) : '-' },
      { key: 'updBy',   label: '수정자',   type: 'readonly' },
      { key: 'updDate', label: '수정일시', type: 'readonly', fmt: (v) => v ? coUtil.cofYmdHms(v) : '-' },
    ];

    /* ##### [06] return ############################################################ */

    return {
      uiState, baseForm, baseFormColumns,
      handleBtnAction,
    };
  },
  template: /* html */`
<bo-container>
  <div class="toolbar">
    <span class="list-title">
      첨부파일 상세 / 수정
      <span v-if="baseForm.attachId" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">#{{ baseForm.attachId }}</span>
    </span>
  </div>
  <div v-if="!dtlId && !baseForm.attachId" style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">
    좌측 목록에서 파일을 선택하거나 번호를 클릭해주세요.
  </div>
  <div v-else style="padding:12px;">
    <bo-form-area :columns="baseFormColumns" :form="baseForm" :errors="{}"
      :cols="3" :readonly="uiState.dtlMode === 'view'" :show-actions="false" />
    <bo-form-actions :readonly="uiState.dtlMode === 'view'" :show-delete="false" :edit-click="() => handleBtnAction('form-edit')"
 :save-click="() => handleBtnAction('form-save')"
 :cancel-click="() => handleBtnAction('form-cancel')"
 :close-click="() => handleBtnAction('form-close')" />
  </div>
</bo-container>
`
};
