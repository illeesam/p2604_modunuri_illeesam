/* ShopJoy Admin - 사용자관리(관리자) 상세/등록 */
export default {
  name: 'SyUserDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const modals = reactive({ isAddrSearchModal: false, isDeptModal: false });   // 주소검색 모달 (카카오 우편번호, 인라인 레이어)
    const uiState = reactive({ loading: false, error: null }); // UI 상태
    const codes = reactive({ active_statuses: [], user_roles: [] });                  // 공통코드

    const form = reactive({                        // 사용자 폼 데이터
      userId: null, loginId: '', userNm: '', userEmail: '', userPhone: '',
      deptNm: '', deptId: null, roleId: null,
      zipcode: '', address: '', addressDetail: '',
      userStatusCd: 'ACTIVE', password: '',
      profileAttachId: null,
    });
    const errors = reactive({});                   // 폼 검증 에러
    const addrDetailRef = ref(null);               // 상세주소 input ref

    const schema = yup.object({                    // 폼 검증 스키마
      loginId:  yup.string().required('로그인ID를 입력해주세요.'),
      userNm:   yup.string().required('이름을 입력해주세요.'),
      userEmail: yup.string().required('이메일을 입력해주세요.')
        .matches(coUtil.REGEX_EMAIL, '올바른 이메일 형식이 아닙니다.'),
      userPhone: yup.string().matches(coUtil.REGEX_PHONE, '올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)'),
      password: yup.string().matches(coUtil.REGEX_PASSWORD,
        '비밀번호는 8자 이상이며 영문 대/소문자·숫자·특수문자를 모두 포함해야 합니다.'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용, 'new'/'edit' 이면 편집

    /* fnShareUrl — 이 사용자 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'syUserDtl');
      qs.set('id', form.userId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `사용자 ${form.userId} - ShopJoy BO`,
          description: form.userNm || '',
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
    /* pdfAreaRef — 사용자 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(상세보기 모드 전용) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`사용자상세_${form.userId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    /* 부서 선택 팝업 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoSyOrgSyUserDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__closeDtl__');
      // 보기모드에서 바로 삭제 (2026-08-22 정책: 보기모드 표준 버튼 = [수정][삭제][닫기])
      } else if (cmd === 'form-delete') {
        return handleDelete();
      // 주소 검색 모달 열기 (카카오 우편번호, 인라인 레이어)
      } else if (cmd === 'addr-search') {
        modals.isAddrSearchModal = true;
        return;
      // 주소 초기화
      } else if (cmd === 'addr-clear') {
        form.zipcode = '';
        form.address = '';
        return;
      // 부서 선택 모달 열기
      } else if (cmd === 'deptModal-open') {
        modals.isDeptModal = true;
        return;
      // 부서 선택 비우기
      } else if (cmd === 'deptModal-clear') {
        form.deptId = null; form.deptNm = '';
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoSyOrgSyUserDtl.js : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };


    /* fnCallbackModal — 모달 콜백 통합 dispatch. cmd=모달명, param=호출 파라미터, result=응답 결과 (null=닫기) */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ BoSyOrgSyUserDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-dept-pick') {
        if (result == null) { modals.isDeptModal = false; return; }
        form.deptId = result.selId;
        form.deptNm = result.selName;
        modals.isDeptModal = false;
        return;
      // 주소검색 모달 콜백 → 우편번호/주소 반영
      } else if (popCmd === 'addr-search') {
        modals.isAddrSearchModal = false;
        if (result == null) { return; }
        form.zipcode = result.zonecode;
        form.address = result.address;
        if (addrDetailRef.value) { addrDetailRef.value.focus(); }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syUser.getById(props.dtlId, '사용자관리', '상세조회');
        const d = res.data?.data;
        if (d) { Object.assign(form, { ...d, password: '' }); }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
      }
      if (cfIsNew.value && !form.password) { errors.password = '신규 등록 시 비밀번호는 필수입니다.'; }
      if (Object.keys(errors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const { password, ...rest } = form;
        const body = { ...rest };
        if (password) { body.loginPwdHash = password; }
        await (cfIsNew.value ? boApiSvc.syUser.create(body, '사용자관리', '등록') : boApiSvc.syUser.update(form.userId, body, '사용자관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syUserMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 보기모드 [삭제] (2026-08-22 정책: 보기모드 표준 버튼 = [수정][삭제][닫기]) */
    const handleDelete = async () => {
      if (cfIsNew.value || !form.userId) { return; }
      const ok = await showConfirm('삭제', `[${form.userNm}] 사용자를 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.syUser.remove(form.userId, '사용자관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        props.navigate('syUserMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
        await codeStore.saLoadCodes(['ACTIVE_STATUS', 'USER_ROLE'], {compNm: 'SyUserDtl'});
        codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
        codes.user_roles = codeStore.sgGetGrpCodes('USER_ROLE');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
    };
    onMounted(initPage);

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* fnRoleTypeBadge — 역할 유형 배지 */
    const fnRoleTypeBadge = (t) => ({
      '시스템': 'badge-purple', '업무': 'badge-blue', '기타': 'badge-gray',
    }[t] || 'badge-gray');

    /* 현재 적용 역할 목록 (빈 배열 정적 — computed 불필요) */
    const cfUserRoles = [];

    /* userRoleGridColumns — 적용 역할 목록 컬럼 */
    const columns = {};
    columns.userRoleGrid = [
      { key: 'roleId',       label: 'ID',     style: 'width:50px;text-align:center;', align: 'center',
        cellStyle: 'color:#888;' },
      { key: 'roleCode',     label: '역할코드', style: 'width:130px;', mono: true,
        cellStyle: 'font-size:11px;color:#2563eb;' },
      { key: 'roleNm',       label: '역할명', cellStyle: 'font-weight:600;' },
      { key: 'roleType',     label: '유형',   style: 'width:80px;text-align:center;', align: 'center',
        badge: (row) => fnRoleTypeBadge(row.roleType) },
      { key: 'restrictPerm', label: '제한',   style: 'width:80px;text-align:center;', align: 'center',
        badge: (row) => row.restrictPerm === '없음' ? 'badge-green' : row.restrictPerm === '읽기' ? 'badge-orange' : 'badge-red' },
      { key: 'useYn',        label: '사용',   style: 'width:60px;text-align:center;', align: 'center',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-red' },
      { key: 'remark',       label: '비고', cellStyle: 'color:#666;' },
    ];

    // 기본 폼 (cols=3, 1열 위주 + 주소/프로필은 한 줄 전체 폭)
    columns.baseForm = [
      { type: 'group', label: '계정 · 연락처정보' },
      // 1행: 사이트명(2) + 로그인ID(1)
      { key: '_siteNm',      label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
      { key: 'loginId',      label: '로그인ID', type: 'text', required: true,
        placeholder: '로그인 아이디',
        readonly: !cfIsNew.value },
      // 2행: 비밀번호 / 이름 / 이메일
      { key: 'password',     label: '비밀번호', type: 'password',
        required: cfIsNew.value, placeholder: '비밀번호',
        visible: () => !cfDtlMode.value,
        hint: cfIsNew.value ? '' : '변경 시에만 입력',
        validate: (v) => v && !coUtil.cofIsValidPassword(v) ? '8자 이상, 영문 대/소문자·숫자·특수문자를 모두 포함해야 합니다.' : null },
      { key: 'userNm',       label: '이름', type: 'text', required: true, placeholder: '이름' },
      { key: 'userEmail',    label: '이메일', type: 'text', required: true, placeholder: '이메일',
        validate: (v) => !coUtil.cofIsValidEmail(v) ? '올바른 이메일 형식이 아닙니다.' : null },
      // 3행: 연락처 / 부서 / 역할
      { key: 'userPhone',    label: '연락처', type: 'text', placeholder: '010-0000-0000',
        validate: (v) => !coUtil.cofIsValidPhone(v) ? '올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)' : null },
      { key: 'deptNm',       label: '부서', type: 'slot', name: 'dept' },
      { key: 'roleId',       label: '역할', type: 'select', options: () => codes.user_roles },
      // 4행: 상태 (1) + (자연 빈칸 2)
      { key: 'userStatusCd', label: '상태', type: 'select', options: () => codes.active_statuses },
      // 5행: 주소 (한 줄 전체)
      { key: '_addr',           label: '주소',         type: 'slot', name: 'addr',    colSpan: 3 },
      // 6행: 프로필 이미지 (한 줄 전체)
      { key: 'profileAttachId', label: '프로필 이미지', type: 'slot', name: 'profile', colSpan: 3 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {

      modals,   // 모달 표시 상태 모음
      columns,
      form, errors, addrDetailRef, // 상태 / 데이터
      cfUserRoles,                                   // 역할 목록 (하단)
      handleBtnAction, handleSelectAction, fnCallbackModal, handleShareKakao, handleCopyLink, // dispatch (모든 이벤트 / 액션 라우팅)
      pdfAreaRef, pdfExporting, handleExportPdf,     // PDF 다운로드 (상세보기)
      cfIsNew, cfDtlMode, // computed
      showToast, // BaseAttachOne 콜백
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 카드 영역 =================================================== -->
<bo-container :title="!active ? '사용자 상세' : (cfIsNew ? '사용자 등록' : (cfDtlMode ? '사용자 상세' : '사용자 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.userId)">
  <template #toolbar-actions>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
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
  <!-- ===== ■.■. 기본정보 폼 ============================================== -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
    <!-- ===== ■.■.■. 부서: picker ========================================== -->
    <template #dept>
      <div v-if="cfDtlMode" class="readonly-field">{{ form.deptNm || '-' }}</div>
      <div v-else style="display:flex;gap:8px;align-items:flex-end;">
        <div class="form-control" style="flex:1;background:#fafafa;display:flex;align-items:center;min-height:28px;padding:4px 10px;font-size:13px;"
          @click="handleBtnAction('deptModal-open')">
          <span v-if="form.deptNm" style="color:#1a1a2e;">{{ form.deptNm }}</span>
          <span v-else style="color:#bbb;font-size:12px;">부서를 선택하세요</span>
        </div>
        <button type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('deptModal-open')" style="white-space:nowrap;">
          🏢 선택
        </button>
        <button v-if="form.deptId" type="button" title="선택 해제" @click="handleBtnAction('deptModal-clear')"
          style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;align-self:flex-end;">
          x
        </button>
      </div>
    </template>
    <!-- ===== ■.■.■. 주소: 우편번호 + 주소검색 + 기본주소 + 상세주소 ============== -->
    <template #addr>
      <div v-if="cfDtlMode" class="readonly-field-plain">
        {{ [form.zipcode ? '('+form.zipcode+')' : '', form.address, form.addressDetail].filter(Boolean).join(' ') || '-' }}
      </div>
      <div v-else style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;align-items:flex-end;">
          <input class="form-control" style="width:130px;" :value="form.zipcode" readonly placeholder="우편번호" />
          <button type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('addr-search')" style="white-space:nowrap;">
            🔍 주소 검색
          </button>
          <button v-if="form.zipcode || form.address" type="button" title="주소 초기화" @click="handleBtnAction('addr-clear')"
            style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;">
            x
          </button>
        </div>
        <input class="form-control" :value="form.address" readonly placeholder="기본주소 (주소 검색 후 자동 입력)" />
        <input ref="addrDetailRef" class="form-control" v-model="form.addressDetail" placeholder="상세주소 (동/호수 등)" />
      </div>
    </template>
    <!-- ===== ■.■.■. 프로필 이미지: BaseAttachOne (단일 이미지 업로드) ============= -->
    <template #profile>
      <base-attach-one v-model="form.profileAttachId" grp-code="USER_PROFILE" grp-nm="프로필 이미지"
        :max-size-mb="5" allow-ext="jpg,jpeg,png,gif,webp" width="120px" height="120px" :show-toast="showToast"
        :readonly="cfDtlMode" />
    </template>
  </bo-form-area>
  <!-- ===== □.□. 기본정보 폼 (주소/프로필 포함, 단일 BoFormArea) ================== -->
  <!-- ===== ■.■. 폼 액션 (active 일 때만 노출) ================================ -->
  <bo-form-actions v-if="active" :readonly="cfDtlMode" :is-new="cfIsNew"
    :edit-click="() => handleBtnAction('form-edit')"
    :save-click="() => handleBtnAction('form-save')"
    :delete-click="() => handleBtnAction('form-delete')"
    :cancel-click="() => handleBtnAction('form-cancel')"
    :close-click="() => handleBtnAction('form-close')" />
  <!-- ===== □.□. 폼 액션 ================================================== -->
</bo-container>
<!-- ===== □. 카드 영역 =================================================== -->
<!-- ===== ■. 적용 역할 목록 ================================================ -->
<bo-container v-if="!cfIsNew" title="적용 역할 목록" :count-text="cfUserRoles.length + '건'">
  <!-- ===== ■.■. 목록 영역 ================================================= -->
  <bo-grid bare :columns="columns.userRoleGrid" :rows="cfUserRoles" row-key="roleId"
    empty-text="배정된 역할이 없습니다." />
  <!-- ===== □.□. 목록 영역 ================================================= -->
</bo-container>
<!-- ===== □. 적용 역할 목록 ================================================ -->
</div>
<!-- ===== ■. 부서 선택 팝업 ================================================ -->
<bo-cm-popup-modal v-if="modals.isDeptModal" popup-cmd="cmPopup-dept-pick" popup-code="dept" clearable :exclude-id="null" :on-callback="fnCallbackModal" />
<!-- ===== ■. 주소 검색 모달 (카카오 우편번호, 인라인 레이어) ============================ -->
<bo-addr-search-modal v-if="modals.isAddrSearchModal" modal-name="addr-search" :on-callback="fnCallbackModal" />
<!-- ===== □. 부서 선택 팝업 ================================================ -->
`,
};
