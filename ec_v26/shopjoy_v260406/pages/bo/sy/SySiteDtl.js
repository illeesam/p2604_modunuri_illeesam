/* ShopJoy Admin - 사이트관리 상세/등록 */
window.SySiteDtl = {
  name: 'SySiteDtl',
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

    const modals = reactive({ isPathPickModal: false, isAddrSearchModal: false });   // 표시경로 picker 모달  주소검색 모달 (카카오 우편번호, 인라인 레이어)
    const uiState = reactive({ loading: false, error: null }); // UI 상태
    const codes = reactive({                       // 공통코드 / 정적 옵션
      site_oper_statuses: [],
      site_types: ['이커머스','숙박공유','전문가연결','IT매칭','부동산','교육','중고거래','영화예매','음식배달','가격비교','시각화','홈페이지','기타'],
    });

    const form = reactive({                        // 사이트 폼 데이터
      siteId: null, siteCode: '', siteTypeCd: '홈페이지', siteNm: '', siteDomain: '',
      logoUrl: '', faviconUrl: '', siteDesc: '',
      siteEmail: '', sitePhone: '',
      siteZipCode: '', siteAddress: '',
      siteBusinessNo: '', siteCeo: '', siteStatusCd: 'ACTIVE',
      pathId: null,
    });
    const errors = reactive({});                   // 폼 검증 에러
    const addrDetailRef = ref(null);               // 상세주소 input ref

    const schema = yup.object({                    // 폼 검증 스키마
      siteCode: yup.string().required('사이트코드를 입력해주세요.'),
      siteNm: yup.string().required('사이트명을 입력해주세요.'),
      siteDomain: yup.string().required('도메인을 입력해주세요.'),
      siteEmail: yup.string().matches(coUtil.REGEX_EMAIL, '올바른 이메일 형식이 아닙니다.'),
      sitePhone: yup.string().matches(coUtil.REGEX_PHONE, '올바른 전화번호 형식이 아닙니다. (예: 02-1234-5678)'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용, 'new'/'edit' 이면 편집

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SySiteDtl.js : handleBtnAction -> ', cmd, param);
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
      // 주소 검색 모달 열기 (카카오 우편번호, 인라인 레이어)
      } else if (cmd === 'addr-search') {
        modals.isAddrSearchModal = true;
        return;
      // 주소 초기화
      } else if (cmd === 'addr-clear') {
        form.siteZipCode = '';
        form.siteAddress = '';
        return;
      // 표시경로 picker 열기
      } else if (cmd === 'pathModal-open') {
        modals.isPathPickModal = true;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모달 콜백 통합 dispatch. cmd=모달명, param=호출 파라미터, result=응답 결과 (null=닫기) */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ SySiteDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-path-pick') {
        if (result == null) { modals.isPathPickModal = false; return; }
        form.pathId = result;
        modals.isPathPickModal = false;
        return;
      // 주소검색 모달 콜백 → 우편번호/주소 반영
      } else if (popCmd === 'addr-search') {
        modals.isAddrSearchModal = false;
        if (result == null) { return; }
        form.siteZipCode = result.zonecode;
        form.siteAddress = result.address;
        if (addrDetailRef.value) { addrDetailRef.value.focus(); }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.sySite.getById(props.dtlId, '사이트관리', '상세조회');
        const data = res.data?.data;
        if (data) { Object.assign(form, data); }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSave — 저장 (신규 등록 / 수정) */
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
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await (cfIsNew.value
          ? boApiSvc.sySite.create({ ...form }, '사이트관리', '등록')
          : boApiSvc.sySite.update(form.siteId, { ...form }, '사이트관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('sySiteMng', { reload: true }); }
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
        await codeStore.saLoadCodes(['SITE_OPER_STATUS'], {compNm: 'SySiteDtl'});
        codes.site_oper_statuses = codeStore.sgGetGrpCodes('SITE_OPER_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ★ onMounted — 코드 로드 + 상세 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      if (!cfIsNew.value) {
        await handleLoadDetail();
      }
    };
    onMounted(initPage);

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 폼 (cols=3 — 빈 칸 없이 3열을 모두 채우도록 colSpan 배치)
    const columns = {};
    columns.baseForm = [
      { type: 'group', label: '사이트정보' },
      // 1행: 사이트코드 / 사이트유형 / 사이트명
      { key: 'siteCode',       label: '사이트코드', type: 'text', required: true,
        placeholder: 'ST0001', mono: true },
      { key: 'siteTypeCd',     label: '사이트유형', type: 'select', nullable: false,
        options: () => codes.site_types },
      { key: 'siteNm',         label: '사이트명',   type: 'text', required: true, placeholder: 'ShopJoy' },
      // 2행: 도메인 / 운영상태 / 표시경로
      { key: 'siteDomain',     label: '도메인',     type: 'text', required: true, placeholder: 'shopjoy.com' },
      { key: 'siteStatusCd',   label: '운영상태',   type: 'select', options: () => codes.site_oper_statuses },
      { key: 'pathId',         label: '표시경로',   type: 'pathPick',
        pathLabel: (id) => pathLabel(id),
        onOpen: () => handleBtnAction('pathModal-open') },
      // 3행: 사이트 설명 (1열만 차지)
      { key: 'siteDesc',       label: '사이트 설명', type: 'text', placeholder: '사이트 한줄 설명' },
      { type: 'group', label: '연락처 · 브랜딩' },
      // 4행: 대표이메일 / 대표전화 / 대표자명
      { key: 'siteEmail',      label: '대표이메일', type: 'text', placeholder: 'help@shopjoy.com',
        validate: (v) => !coUtil.cofIsValidEmail(v) ? '올바른 이메일 형식이 아닙니다.' : null },
      { key: 'sitePhone',      label: '대표전화',   type: 'text', placeholder: '02-1234-5678',
        validate: (v) => !coUtil.cofIsValidPhone(v) ? '올바른 전화번호 형식이 아닙니다. (예: 02-1234-5678)' : null },
      { key: 'siteCeo',        label: '대표자명',   type: 'text' },
      // 5행: 사업자등록번호 / 주소(2)
      { key: 'siteBusinessNo', label: '사업자등록번호', type: 'text', placeholder: '000-00-00000' },
      { key: '_addr',          label: '주소', type: 'slot', name: 'addr', colSpan: 2 },
      // 6행: 로고 URL / 파비콘 URL / (빈칸 1)
      { key: 'logoUrl',        label: '로고 URL',   type: 'text', placeholder: '/assets/img/logo.png' },
      { key: 'faviconUrl',     label: '파비콘 URL', type: 'text', placeholder: '/favicon.ico' },
      { type: 'group', label: '정산 · 수수료' },
      // 7행: 사이트 기본 플랫폼수수료율 (상품별 platform_fee_rate 미지정 시 이 값이 기본 적용)
      { key: 'platformFeeRate', label: '기본 플랫폼수수료율(%)', type: 'number', min: 0, max: 100,
        hint: '상품마다 개별 수수료율을 지정하지 않으면 이 사이트 기본값이 적용됩니다.' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {

      modals,   // 모달 표시 상태 모음
      columns,
      form, errors, // 상태 / 데이터
      handleBtnAction, fnCallbackModal, // dispatch + 모달 통합 콜백
      cfIsNew, cfDtlMode, // computed
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 카드 (bo-container 가 카드 담당 = template 루트, 모달은 형제 루트) ============= -->
<bo-container :title="!active ? '사이트 상세' : (cfIsNew ? '사이트 등록' : (cfDtlMode ? '사이트 상세' : '사이트 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.siteId)">
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="active"
    @save="handleBtnAction('form-save')"
    @cancel="handleBtnAction('form-cancel')"
    @edit="handleBtnAction('form-edit')"
    @close="handleBtnAction('form-close')">
    <!-- ===== ■.■.■. 주소: 우편번호+검색버튼+기본주소 (카카오 우편번호 연동) ============= -->
    <template #addr>
      <div v-if="cfDtlMode" class="readonly-field-plain">
        {{ [form.siteZipCode, form.siteAddress].filter(Boolean).join(' ') || '-' }}
      </div>
      <template v-else>
        <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:6px;">
          <input class="form-control" v-model="form.siteZipCode" placeholder="우편번호"
            style="width:110px;flex-shrink:0;" readonly />
          <button type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('addr-search')"
            style="white-space:nowrap;">
            🔍 주소 검색
          </button>
          <button v-if="form.siteZipCode || form.siteAddress" type="button"
            title="주소 초기화" @click="handleBtnAction('addr-clear')"
            style="background:none;border:none;padding:0 2px 2px;margin-left:-6px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;">
            x
          </button>
        </div>
        <input class="form-control" v-model="form.siteAddress"
          placeholder="기본주소 (주소 검색 후 자동 입력)" readonly />
      </template>
    </template>
  </bo-form-area>
</bo-container>
<!-- ===== ■. 표시경로 선택 모달 (형제 루트 — Vue3 fragment) ============================ -->
<bo-cm-popup-modal v-if="modals.isPathPickModal" popup-cmd="cmPopup-path-pick" popup-code="path" result-type="id" :init-param="{ bizCd: 'sy_site' }" title="사이트 표시경로 선택" :on-callback="fnCallbackModal" />
<!-- ===== ■. 주소 검색 모달 (카카오 우편번호, 인라인 레이어) ============================ -->
<bo-addr-search-modal v-if="modals.isAddrSearchModal" modal-name="addr-search" :on-callback="fnCallbackModal" />
`,
};
