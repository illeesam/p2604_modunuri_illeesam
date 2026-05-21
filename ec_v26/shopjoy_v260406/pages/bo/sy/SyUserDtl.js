/* ShopJoy Admin - 사용자관리(관리자) 상세/등록 */
window.SyUserDtl = {
  name: 'SyUserDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ active_statuses: [], user_roles: [] });

    /* 사용자(관리자) fnLoadCodes */
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

    // ── watch ────────────────────────────────────────────────────────────────


    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    const form = reactive({
      userId: null, loginId: '', userNm: '', userEmail: '', userPhone: '',
      deptNm: '', deptId: null, roleId: null,
      zipcode: '', address: '', addressDetail: '',
      userStatusCd: 'ACTIVE', password: '',
      profileAttachId: null,
    });
    const errors = reactive({});
    const addrDetailRef = ref(null);

    const schema = yup.object({
      loginId:  yup.string().required('로그인ID를 입력해주세요.'),
      userNm:   yup.string().required('이름을 입력해주세요.'),
      userEmail: yup.string().required('이메일을 입력해주세요.'),
    });

    /* 사용자(관리자) 상세조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syUser.getById(props.dtlId, '사용자관리', '상세조회');
        const d = res.data?.data;
        if (d) Object.assign(form, { ...d, password: '' });
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ── 카카오 주소 검색 ── */
    const openKakaoPostcode = () => {
      /* 사용자(관리자) run */
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.zipcode = data.zonecode;
            form.address = data.roadAddress || data.jibunAddress;
            if (addrDetailRef.value) addrDetailRef.value.focus();
          },
        }).open();
      };
      if (window.daum && window.daum.Postcode) { run(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = run;
      document.head.appendChild(s);
    };

    /* ── 부서 선택 팝업 ── */
    const deptModal = reactive({ show: false });

    /* 사용자(관리자) openDeptModal */
    const openDeptModal = () => { deptModal.show = true; };

    /* 사용자(관리자) onDeptSelect */
    const onDeptSelect = (dept) => {
      form.deptId  = dept.deptId;
      form.deptNm  = dept.deptNm;
      deptModal.show = false;
    };

    /* 사용자(관리자) clearDept */
    const clearDept = () => { form.deptId = null; form.deptNm = ''; };

    /* ── 현재 적용 역할 목록 (빈 배열 정적 — computed 불필요) ── */
    const cfUserRoles = [];

    /* BoGrid(bare) 컬럼 정의 — 적용 역할 목록 */
    const userRoleGridColumns = [
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

    /* 사용자(관리자) fnRoleTypeBadge */
    const fnRoleTypeBadge = (t) => ({
      '시스템': 'badge-purple', '업무': 'badge-blue', '기타': 'badge-gray',
    }[t] || 'badge-gray');

    /* 사용자(관리자) 저장 */
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
      if (!ok) return;
      try {
        const { password, ...rest } = form;
        const body = { ...rest };
        if (password) body.loginPwdHash = password;
        const res = await (cfIsNew.value ? boApiSvc.syUser.create(body, '사용자관리', '등록') : boApiSvc.syUser.update(form.userId, body, '사용자관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syUserMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 기본정보 영역 ================
    const baseFormColumns = [
      { key: 'siteNm',       label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'loginId',      label: '로그인ID', type: 'text', required: true,
        placeholder: '로그인 아이디',
        // 신규 등록 시에만 편집 가능, 수정 시는 readonly (form key 자체에 readonly 부여)
        readonly: !cfIsNew.value },
      { key: 'password',     label: '비밀번호', type: 'password',
        required: cfIsNew.value, placeholder: '비밀번호',
        visible: () => !cfDtlMode.value,
        hint: cfIsNew.value ? '' : '변경 시에만 입력' },
      { type: 'rowBreak' },
      { key: 'userNm',       label: '이름', type: 'text', required: true, placeholder: '이름' },
      { key: 'userEmail',    label: '이메일', type: 'text', required: true, placeholder: '이메일' },
      { type: 'rowBreak' },
      { key: 'userPhone',    label: '연락처', type: 'text', placeholder: '010-0000-0000' },
      { key: 'deptNm',       label: '부서', type: 'slot', name: 'dept' },
      { type: 'rowBreak' },
      { key: 'roleId',       label: '역할', type: 'select', options: () => codes.user_roles },
      { key: 'userStatusCd', label: '상태', type: 'select', options: () => codes.active_statuses },
    ];

    // 주소 영역 (BoFormArea slot 활용)
    const addrFormColumns = [
      { key: '_addr', label: '주소', type: 'slot', name: 'addr', colSpan: 2 },
    ];
    // 프로필 이미지 (slot)
    const profileFormColumns = [
      { key: 'profileAttachId', label: '프로필 이미지', type: 'slot', name: 'profile', colSpan: 2 },
    ];

    // ===== setup() return ===================================================
    return { uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm,
             cfDtlMode, addrDetailRef, openKakaoPostcode,
             deptModal, openDeptModal, onDeptSelect, clearDept,
             cfUserRoles, userRoleGridColumns, fnRoleTypeBadge, showToast, baseFormColumns,
             addrFormColumns, profileFormColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '사용자 등록' : (cfDtlMode ? '사용자 상세' : '사용자 수정') }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.userId }}</span></div>
  <div class="card">
    <!-- 기본 정보 (BoFormArea 자동 렌더) -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2" :show-actions="false">

      <!-- 부서: picker -->
      <template #dept>
        <div v-if="cfDtlMode" class="readonly-field">{{ form.deptNm || '-' }}</div>
        <div v-else style="display:flex;gap:8px;align-items:center;">
          <div class="form-control" style="flex:1;cursor:pointer;background:#fafafa;display:flex;align-items:center;min-height:36px;"
            @click="openDeptModal">
            <span v-if="form.deptNm" style="color:#1a1a2e;">{{ form.deptNm }}</span>
            <span v-else style="color:#bbb;font-size:12px;">부서를 선택하세요</span>
          </div>
          <button type="button" class="btn btn-blue btn-sm" @click="openDeptModal" style="white-space:nowrap;">🏢 선택</button>
          <button v-if="form.deptId" type="button" class="btn btn-secondary btn-sm" @click="clearDept" >✕</button>
        </div>
      </template>
    </bo-form-area>

    <!-- 주소 영역 (BoFormArea 자동 렌더) -->
    <bo-form-area :columns="addrFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2" :show-actions="false">
      <template #addr>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <input class="form-control" v-model="form.zipcode" placeholder="우편번호"
            style="width:110px;flex-shrink:0;" readonly />
          <button v-if="!cfDtlMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
            style="white-space:nowrap;">🔍 주소 검색</button>
        </div>
        <input class="form-control" v-model="form.address"
          placeholder="기본주소 (주소 검색 후 자동 입력)" style="margin-bottom:6px;" readonly />
        <input class="form-control" v-model="form.addressDetail" ref="addrDetailRef"
          placeholder="상세주소 (동/호수 등)" :readonly="cfDtlMode" />
      </template>
    </bo-form-area>

    <!-- 프로필 이미지 (BoFormArea 자동 렌더) -->
    <bo-form-area :columns="profileFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2" :show-actions="false">
      <template #profile>
        <base-attach-one
          v-model="form.profileAttachId"
          grp-code="USER_PROFILE"
          grp-nm="사용자 프로필"
          :max-size-mb="5"
          allow-ext="jpg,jpeg,png,gif,webp"
          width="120px"
          height="120px"
          :show-toast="showToast" />
      </template>
    </bo-form-area>

    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syUserMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('syUserMng')">취소</button>
      </template>
    </div>
  </div>

  <!-- ── 적용 역할 목록 ─────────────────────────────────────────────────────── -->
  <div v-if="!cfIsNew" class="card">
    <div class="toolbar" style="margin-bottom:12px;">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        적용 역할 목록
        <span class="list-count">{{ cfUserRoles.length }}건</span>
      </span>
    </div>
    <bo-grid bare :columns="userRoleGridColumns" :rows="cfUserRoles" row-key="roleId"
             empty-text="배정된 역할이 없습니다." />

  </div>

  <!-- ── 부서 선택 팝업 ─────────────────────────────────────────────────────── -->
  <dept-tree-modal
    v-if="deptModal && deptModal.show" :exclude-id="null"
    @select="onDeptSelect"
    @close="deptModal.show=false" />
</div>
`
};
