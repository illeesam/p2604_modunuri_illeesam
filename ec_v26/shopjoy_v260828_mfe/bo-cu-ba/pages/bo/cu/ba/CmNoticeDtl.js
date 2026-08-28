/* ShopJoy Admin - 공지사항관리 상세/등록
 * ★ BO Dtl 표준 참조 모델 (2026-05-28) — 신규 Dtl 작성 시 이 파일 구조를 따른다.
 *   - 폼 reactive: `const baseForm = reactive({...})` (변수명 `form` 단독 금지)
 *   - setup() 6섹션 [01]~[06] 마커 (dispatch=[02] / init=[03] / 핸들러=[04] / 헬퍼·컬럼=[05])
 *   - cmd 라우팅: 'baseForm-save' / 'baseForm-cancel' / 'baseForm-edit' / 'baseForm-close'
 *   - 폼: <bo-form-area plain-readonly :columns="columns.baseForm" :form="baseForm" :readonly="cfReadonly" :cols="3">
 *     (※ bo-form-area 의 prop명 `form` 은 컴포넌트 표준이라 그대로 유지)
 *   - readonly 판정: `const cfReadonly = computed(() => props.dtlMode === 'view')`
 *   - 신규 판정:    `const cfIsNew    = computed(() => props.dtlId == null)`
 *   - 첨부:         `cfAttachRefId = computed(() => props.dtlId ? ('XXX-' + props.dtlId) : '')`
 *   - reloadTrigger watch 로 상위 Mng 신호 수신 → 상세 재조회
 *   - 정책: _doc/정책서/sy/sy.51.프로그램설계정책.md §4.7~§4.8, sy.54.네이밍규칙.md §coUtil 표준 캡슐 변수 명명
 */
window.BoCuBaCmNoticeDtl = {
  name: 'bo-cu-ba-cmNoticeDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null },    // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },  // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },   // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },       // 상위 reload signal
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    /* 첨부 추가/삭제는 화면에서 즉시 물리 반영되지만 sy_attach 연계 자체는 미반영 상태로 남는다 —
       template ref 로 pendingChanges 를 읽어 저장 요청 바디에 attachChanges 로 함께 보내면
       SyNoticeService.create()/update() 가 noticeId 확정 직후 같은 트랜잭션에서 원자적으로 반영한다. */
    const attachGrpRef = ref(null);
    const { showToast, showConfirm } = window.boApp;
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ noticeTypes: [], noticeStatuses: [] });

    const _today = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return coUtil.cofToYmd(d); };

    /* 폼 초기값 = 빈 폼 (미선택/초기화 상태에서는 모든 필드 비움).
     *   신규 등록 기본값(상단고정 N / 시작·종료일)은 [+신규] 진입 시에만 _applyNewDefaults() 로 채움. */
    const baseForm = reactive({
      noticeId: null, noticeTitle: '', noticeTypeCd: '', isFixed: '',
      startDate: '', endDate: '', noticeStatusCd: '', contentHtml: '',
    });
    /* _applyNewDefaults — 신규 등록 진입 시 기본값 채움 */
    const _applyNewDefaults = () => {
      Object.assign(baseForm, {
        isFixed: 'N', startDate: _today(), endDate: _today(7),
      });
    };
    const errors = reactive({});
    const schema = yup.object({ noticeTitle: yup.string().required('제목을 입력해주세요.') });

    const cfIsNew       = computed(() => props.dtlId == null);
    const cfReadonly    = computed(() => props.dtlMode === 'view');
    const cfAttachRefId = computed(() => props.dtlId ? ('NOTICE-' + props.dtlId) : '');
    /* refTableNm — sy_attach.ref_table_nm 실제 값. 백엔드 SyAttachRefTableConst.OPTIONS 에서
       key='NOTICE' 항목을 찾아 채운다(coUtil.cofGetAttachRefTableOptions, initPage 에서 로드) —
       문자열을 프론트에 직접 다시 타이핑하지 않기 위함. */
    const refTableNm = ref('');
    const fnLoadRefTableNm = async () => {
      const opts = await coUtil.cofGetAttachRefTableOptions();
      refTableNm.value = opts.find(o => o.key === 'NOTICE')?.value || '';
    };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd) => {
      if (cmd === 'baseForm-save')   return handleSave();
      if (cmd === 'baseForm-cancel') return props.navigate('__cancelEdit__');
      if (cmd === 'baseForm-edit')   return props.navigate('__switchToEdit__');
      if (cmd === 'baseForm-close')  return props.navigate('__closeDtl__');
      if (cmd === 'baseForm-delete') return handleDelete();
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const s = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await s.saLoadCodes(['NOTICE_TYPE_CD', 'NOTICE_STATUS'], {compNm: 'bo-cu-ba-cmNoticeDtl'});
      codes.noticeTypes    = s.sgGetGrpCodes('NOTICE_TYPE_CD');
      codes.noticeStatuses = s.sgGetGrpCodes('NOTICE_STATUS');
    };

    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await fnLoadRefTableNm();
      // [+신규] 진입(활성 + 신규)일 때만 기본값 채움. 미선택/초기화(비활성)면 빈 폼 유지.
      if (props.active && cfIsNew.value) _applyNewDefaults();
      await handleSearchDetail();
    };
    onMounted(initPage);

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
        // 첨부파일 추가/삭제 변경 목록을 함께 전송 — 백엔드(SyNoticeService.create/update)가
        // noticeId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한다.
        const attachChanges = attachGrpRef.value?.pendingChanges || [];
        await (isNew
          ? boApiSvc.cmNotice.create({ ...baseForm, attachFiles: attachChanges }, '공지사항관리', '등록')
          : boApiSvc.cmNotice.update(props.dtlId, { ...baseForm, attachFiles: attachChanges }, '공지사항관리', '저장'));
        showToast(isNew ? '등록되었습니다.' : '저장되었습니다.', 'success');
        props.navigate('cmNoticeMng', { reload: true });
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* handleDelete — 보기/편집모드 공통 [삭제] (2026-08-22 정책: 표준 버튼 = [수정][삭제][닫기] / [저장][삭제][취소][닫기]) */
    const handleDelete = async () => {
      if (cfIsNew.value || !props.dtlId) return;
      if (!(await showConfirm('삭제', `[${baseForm.noticeTitle}]을 삭제하시겠습니까?`))) return;
      try {
        await boApiSvc.cmNotice.remove(props.dtlId, '공지사항관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        props.navigate('cmNoticeMng', { reload: true });
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* fnShareUrl — 이 공지사항 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'cmNoticeDtl');
      qs.set('id', baseForm.noticeId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `공지사항 ${baseForm.noticeId} - ShopJoy BO`,
          description: baseForm.noticeTitle || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnShareUrl(),
        });
      } catch (e) {
        showToast(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    /* handleCopyLink — 순수 URL만 클립보드에 복사 (카카오톡 카드 없음) */
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnShareUrl());
        showToast('링크가 복사되었습니다.', 'success');
      } catch (e) {
        showToast(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    /* pdfAreaRef — 공지사항 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(상세보기 모드 전용) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`공지사항상세_${baseForm.noticeId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const columns = {};
    columns.baseForm = [
      { key: 'noticeTitle',    label: '제목',    type: 'text',   required: true, placeholder: '공지 제목' },
      { key: 'noticeTypeCd',   label: '유형',    type: 'select', options: () => codes.noticeTypes,    nullLabel: '선택' },
      { key: 'noticeStatusCd', label: '상태',    type: 'select', options: () => codes.noticeStatuses, nullLabel: '선택' },
      { key: 'startDate',      label: '시작일',  type: 'date' },
      { key: 'endDate',        label: '종료일',  type: 'date' },
      { key: 'isFixed',        label: '상단고정', type: 'checkbox',
        checkboxLabel: '상단고정', hideLabel: true,
        checkedValue: 'Y', uncheckedValue: 'N' },
      { key: 'contentHtml',    label: '내용',    type: 'slot', name: 'content', colSpan: 3 },
      { key: 'attachFiles',   label: '첨부파일', type: 'slot', name: 'attachGrp', colSpan: 3 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, codes, baseForm, errors,
      handleBtnAction,
      cfIsNew, cfReadonly, cfAttachRefId, attachGrpRef, refTableNm,
      showToast,
      handleShareKakao, handleCopyLink,                                    // 카카오톡 공유 / 링크 복사 (상세보기)
      pdfAreaRef, pdfExporting, handleExportPdf,                           // PDF 다운로드 (항상 노출)
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 폼 영역 (제목/폼 모두 컨테이너 안에) ============================= -->
<bo-container :title="!active ? '공지사항 상세' : (cfIsNew ? '공지사항 등록' : (cfReadonly ? '공지사항 상세' : '공지사항 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : baseForm.noticeId)">
  <template #toolbar-actions>
    <button v-if="active ? (cfReadonly ? !cfIsNew : false) : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="active ? (cfReadonly ? !cfIsNew : false) : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
    <button class="btn btn_pdf" title="PDF 다운로드" :disabled="pdfExporting" @click="handleExportPdf">
      <span v-if="pdfExporting">⏳</span>
      <svg v-else width="18" height="20" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 H20 L28 10 V34 H4 Z" fill="#fff" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M20 2 V10 H28 Z" fill="#f3d4c0"/>
        <rect x="2" y="20" width="28" height="12" rx="2" fill="#e2372c"/>
        <text x="16" y="29" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">PDF</text>
      </svg>
    </button>
  </template>
  <!-- ===== ■.■. 컨테이너 헤더 (제목 = list-title, 페이지 타이틀 아님) ========= -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="baseForm" :errors="errors"
    :readonly="cfReadonly" :cols="3" compact :show-actions="false">
    <!-- 내용 (HtmlEditor 또는 view 모드 HTML) -->
    <template #content>
      <div v-if="cfReadonly" class="form-control" style="min-height:200px;line-height:1.6;overflow:auto;">
        <div v-if="baseForm.contentHtml" v-html="baseForm.contentHtml"></div>
        <span v-else style="color:#bbb;">-</span>
      </div>
      <base-html-editor v-else v-model="baseForm.contentHtml" height="280px" />
    </template>
    <template #attachGrp>
      <base-attach-grp ref="attachGrpRef" :ref-table-nm="refTableNm" :ref-key-id="dtlId"
        :ref-id="cfAttachRefId" :show-toast="showToast" :readonly="cfReadonly"
        grp-code="NOTICE_ATTACH" grp-nm="공지 첨부파일"
        :max-count="5" :max-size-mb="10" allow-ext="jpg,png,gif,pdf,xlsx,docx" />
    </template>
  </bo-form-area>
  <!-- 폼 액션 (행 선택/신규 시에만 노출) -->
  <bo-form-actions v-if="active" :readonly="cfReadonly" :is-new="cfIsNew"
    :edit-click="() => handleBtnAction('baseForm-edit')"
    :save-click="() => handleBtnAction('baseForm-save')"
    :delete-click="() => handleBtnAction('baseForm-delete')"
    :cancel-click="() => handleBtnAction('baseForm-cancel')"
    :close-click="() => handleBtnAction('baseForm-close')" />
</bo-container>
</div>
`,
};
