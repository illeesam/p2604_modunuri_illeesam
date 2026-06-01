/* ShopJoy Admin - 공지사항관리 상세/등록
 * ★ BO Dtl 표준 참조 모델 (2026-05-28) — 신규 Dtl 작성 시 이 파일 구조를 따른다.
 *   - 폼 reactive: `const baseForm = reactive({...})` (변수명 `form` 단독 금지)
 *   - setup() 6섹션 [01]~[06] 마커 (dispatch=[02] / init=[03] / 핸들러=[04] / 헬퍼·컬럼=[05])
 *   - cmd 라우팅: 'baseForm-save' / 'baseForm-cancel' / 'baseForm-edit' / 'baseForm-close'
 *   - 폼: <bo-form-area :columns="baseFormColumns" :form="baseForm" :readonly="cfReadonly" :cols="3">
 *     (※ bo-form-area 의 prop명 `form` 은 컴포넌트 표준이라 그대로 유지)
 *   - readonly 판정: `const cfReadonly = computed(() => props.dtlMode === 'view')`
 *   - 신규 판정:    `const cfIsNew    = computed(() => props.dtlId == null)`
 *   - 첨부:         `cfAttachRefId = computed(() => props.dtlId ? ('XXX-' + props.dtlId) : '')`
 *   - reloadTrigger watch 로 상위 Mng 신호 수신 → 상세 재조회
 *   - 정책: _doc/정책서/sy/sy.51.프로그램설계정책.md §4.7~§4.8, sy.54.네이밍규칙.md §coUtil 표준 캡슐 변수 명명
 */
window.CmNoticeDtl = {
  name: 'CmNoticeDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null },    // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },  // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },   // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },       // 상위 reload signal
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted, watch } = Vue;
    const { showToast, showConfirm, setApiRes } = window.boApp;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ noticeTypes: [], noticeStatuses: [] });

    const _today = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

    const baseForm = reactive({
      noticeId: null, noticeTitle: '', noticeTypeCd: '', isFixed: 'N',
      startDate: _today(), endDate: _today(7), noticeStatusCd: '', contentHtml: '',
      attachGrpId: null,
    });
    const errors = reactive({});
    const schema = yup.object({ noticeTitle: yup.string().required('제목을 입력해주세요.') });

    const cfIsNew       = computed(() => props.dtlId == null);
    const cfReadonly    = computed(() => props.dtlMode === 'view');
    const cfAttachRefId = computed(() => props.dtlId ? ('NOTICE-' + props.dtlId) : '');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd) => {
      if (cmd === 'baseForm-save')   return handleSave();
      if (cmd === 'baseForm-cancel') return props.navigate('__cancelEdit__');
      if (cmd === 'baseForm-edit')   return props.navigate('__switchToEdit__');
      if (cmd === 'baseForm-close')  return props.navigate('__cancelEdit__');
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const s = window.sfGetBoCodeStore();
      codes.noticeTypes    = s.sgGetGrpCodes('NOTICE_TYPE');
      codes.noticeStatuses = s.sgGetGrpCodes('NOTICE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchDetail();
    });

    /* 상위 Mng 이 reloadTrigger 증가시키면 상세 재조회 */
    watch(() => props.reloadTrigger, (n, o) => {
      if (n === o || n === 0) return;
      Object.keys(errors).forEach(k => delete errors[k]);
      handleSearchDetail();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchDetail — 상세 조회 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      try {
        const res = await boApiSvc.cmNotice.getById(props.dtlId, '공지사항관리', '상세조회');
        Object.assign(baseForm, res.data?.data || {});
      } catch (err) {
        console.error('[handleSearchDetail]', err);
      }
    };

    /* handleSave — 저장 (신규 등록 / 수정) */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(baseForm, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNew = cfIsNew.value;
      if (!(await showConfirm(isNew ? '등록' : '저장', isNew ? '등록하시겠습니까?' : '저장하시겠습니까?'))) return;
      try {
        const res = await (isNew
          ? boApiSvc.cmNotice.create({ ...baseForm }, '공지사항관리', '등록')
          : boApiSvc.cmNotice.update(props.dtlId, { ...baseForm }, '공지사항관리', '저장'));
        setApiRes({ ok: true, status: res.status, data: res.data });
        showToast(isNew ? '등록되었습니다.' : '저장되었습니다.', 'success');
        props.navigate('cmNoticeMng', { reload: true });
      } catch (err) {
        setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const baseFormColumns = [
      { key: 'noticeTitle',    label: '제목',    type: 'text',   required: true, placeholder: '공지 제목' },
      { key: 'noticeTypeCd',   label: '유형',    type: 'select', options: () => codes.noticeTypes,    nullLabel: '선택' },
      { key: 'noticeStatusCd', label: '상태',    type: 'select', options: () => codes.noticeStatuses, nullLabel: '선택' },
      { key: 'startDate',      label: '시작일',  type: 'date' },
      { key: 'endDate',        label: '종료일',  type: 'date' },
      { key: 'isFixed',        label: '상단고정', type: 'checkbox',
        checkboxLabel: '상단고정', hideLabel: true,
        checkedValue: 'Y', uncheckedValue: 'N' },
      { key: 'contentHtml',    label: '내용',    type: 'slot', name: 'content', colSpan: 3 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, codes, baseForm, errors,
      baseFormColumns,
      handleBtnAction,
      cfIsNew, cfReadonly, cfAttachRefId,
      showToast,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ !active ? '공지사항 상세' : (cfIsNew ? '공지사항 등록' : (cfReadonly ? '공지사항 상세' : '공지사항 수정')) }}
    <span v-if="active && !cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ baseForm.noticeId }}
    </span>
    <span v-if="!active" style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
      목록에서 행을 선택하거나 [+신규]를 누르세요
    </span>
  </div>
  <!-- ===== ■. 폼 영역 ===================================================== -->
  <div class="card">
    <bo-form-area :columns="baseFormColumns" :form="baseForm" :errors="errors"
      :readonly="cfReadonly" :cols="3" compact :show-actions="false">
      <!-- 내용 (HtmlEditor 또는 view 모드 HTML) -->
      <template #content>
        <div v-if="cfReadonly" class="form-control" style="min-height:200px;line-height:1.6;overflow:auto;">
          <div v-if="baseForm.contentHtml" v-html="baseForm.contentHtml"></div>
          <span v-else style="color:#bbb;">-</span>
        </div>
        <base-html-editor v-else v-model="baseForm.contentHtml" height="280px" />
      </template>
    </bo-form-area>
    <!-- 첨부파일 -->
    <div class="form-group" style="margin-top:12px;">
      <label class="form-label">첨부파일</label>
      <base-attach-grp :model-value="baseForm.attachGrpId" @update:model-value="baseForm.attachGrpId = $event"
        :ref-id="cfAttachRefId" :show-toast="showToast"
        grp-code="NOTICE_ATTACH" grp-nm="공지 첨부파일"
        :max-count="5" :max-size-mb="10" allow-ext="jpg,png,gif,pdf,xlsx,docx" />
    </div>
    <!-- 폼 액션 (행 선택/신규 시에만 노출) -->
    <div class="form-actions" v-if="active">
      <template v-if="cfReadonly">
        <button class="btn btn-primary"   @click="handleBtnAction('baseForm-edit')">수정</button>
        <button class="btn btn-secondary" @click="handleBtnAction('baseForm-close')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary"   @click="handleBtnAction('baseForm-save')">저장</button>
        <button class="btn btn-secondary" @click="handleBtnAction('baseForm-cancel')">취소</button>
      </template>
    </div>
  </div>
</div>
`,
};
