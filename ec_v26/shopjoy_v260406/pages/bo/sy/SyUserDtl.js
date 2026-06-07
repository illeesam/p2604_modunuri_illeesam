/* ShopJoy Admin - 사용자관리(관리자) 상세/등록 */
window.SyUserDtl = {
  name: 'SyUserDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false }); // UI 상태
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
      userEmail: yup.string().required('이메일을 입력해주세요.'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용, 'new'/'edit' 이면 편집

    /* 부서 선택 팝업 */
    const deptModal = reactive({ show: false });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserDtl.js : handleBtnAction -> ', cmd, param);
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
        return props.navigate('__cancelEdit__');
      // 카카오 우편번호 팝업 열기
      } else if (cmd === 'addr-search') {
        return openKakaoPostcode();
      // 부서 선택 모달 열기
      } else if (cmd === 'deptModal-open') {
        deptModal.show = true;
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
      console.log(' ■■ SyUserDtl.js : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };


    /* fnCallbackModal — 모달 콜백 통합 dispatch. cmd=모달명, param=호출 파라미터, result=응답 결과 (null=닫기) */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyUserDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'dept-pick') {
        if (result == null) { deptModal.show = false; return; }
        form.deptId = result.deptId;
        form.deptNm = result.deptNm;
        deptModal.show = false;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
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

    /* openKakaoPostcode — 카카오 우편번호 팝업 열기 */
    const openKakaoPostcode = () => {
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.zipcode = data.zonecode;
            form.address = data.roadAddress || data.jibunAddress;
            if (addrDetailRef.value) { addrDetailRef.value.focus(); }
          },
        }).open();
      };
      if (window.daum && window.daum.Postcode) { run(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = run;
      document.head.appendChild(s);
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      if (cfIsNew.value && !form.password) { showToast('신규 등록 시 비밀번호는 필수입니다.', 'error'); return; }
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

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
        codes.user_roles = codeStore.sgGetGrpCodes('USER_ROLE');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      if (!cfIsNew.value) { await handleLoadDetail(); }
    });

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
      // 1행: 사이트명(2) + 로그인ID(1)
      { key: '_siteNm',      label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
      { key: 'loginId',      label: '로그인ID', type: 'text', required: true,
        placeholder: '로그인 아이디',
        readonly: !cfIsNew.value },
      // 2행: 비밀번호 / 이름 / 이메일
      { key: 'password',     label: '비밀번호', type: 'password',
        required: cfIsNew.value, placeholder: '비밀번호',
        visible: () => !cfDtlMode.value,
        hint: cfIsNew.value ? '' : '변경 시에만 입력' },
      { key: 'userNm',       label: '이름', type: 'text', required: true, placeholder: '이름' },
      { key: 'userEmail',    label: '이메일', type: 'text', required: true, placeholder: '이메일' },
      // 3행: 연락처 / 부서 / 역할
      { key: 'userPhone',    label: '연락처', type: 'text', placeholder: '010-0000-0000' },
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
      columns,
      uiState, codes, form, errors, addrDetailRef, deptModal,             // 상태 / 데이터
      cfUserRoles,                                   // 역할 목록 (하단)
      handleBtnAction, handleSelectAction, fnCallbackModal,                                // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode,                                                 // computed
      showToast,                                                          // BaseAttachOne 콜백
    };
  },
  template: /* html */`
<!-- ===== ■. 카드 영역 =================================================== -->
<bo-container :title="!active ? '사용자 상세' : (cfIsNew ? '사용자 등록' : (cfDtlMode ? '사용자 상세' : '사용자 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.userId)">
  <!-- ===== ■.■. 기본정보 폼 ============================================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
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
      <div v-if="cfDtlMode" class="readonly-field">
        {{ [form.zipcode ? '('+form.zipcode+')' : '', form.address, form.addressDetail].filter(Boolean).join(' ') || '-' }}
      </div>
      <div v-else style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;align-items:flex-end;">
          <input class="form-control" style="width:130px;" :value="form.zipcode" readonly placeholder="우편번호" />
          <button type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('addr-search')" style="white-space:nowrap;">
            🔍 주소 검색
          </button>
          <button v-if="form.zipcode || form.address" type="button" title="주소 초기화" @click="form.zipcode=''; form.address='';"
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
        :max-size-mb="5" allow-ext="jpg,jpeg,png,gif,webp" width="120px" height="120px" :show-toast="showToast" />
    </template>
  </bo-form-area>
  <!-- ===== □.□. 기본정보 폼 (주소/프로필 포함, 단일 BoFormArea) ================== -->
  <!-- ===== ■.■. 폼 액션 (active 일 때만 노출) ================================ -->
  <div class="form-actions" v-if="active">
    <template v-if="cfDtlMode">
      <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
      <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
    </template>
    <template v-else>
      <button class="btn btn_save" @click="handleBtnAction('form-save')">저장</button>
      <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
    </template>
  </div>
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
<!-- ===== ■. 부서 선택 팝업 ================================================ -->
<dept-tree-modal v-if="deptModal && deptModal.show" :exclude-id="null" modal-name="dept-pick" :on-callback="fnCallbackModal" />
<!-- ===== □. 부서 선택 팝업 ================================================ -->
`,
};
