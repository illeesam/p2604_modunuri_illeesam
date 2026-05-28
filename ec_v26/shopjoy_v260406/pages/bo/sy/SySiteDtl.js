/* ShopJoy Admin - 사이트관리 상세/등록 */
window.SySiteDtl = {
  name: 'SySiteDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false }); // UI 상태
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
    });
    const errors = reactive({});                   // 폼 검증 에러
    const addrDetailRef = ref(null);               // 상세주소 input ref

    const schema = yup.object({                    // 폼 검증 스키마
      siteCode: yup.string().required('사이트코드를 입력해주세요.'),
      siteNm: yup.string().required('사이트명을 입력해주세요.'),
      siteDomain: yup.string().required('도메인을 입력해주세요.'),
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
      // 폼 편집 취소 → 목록으로 이동
      } else if (cmd === 'form-cancel') {
        return props.navigate('sySiteMng');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 목록으로 이동
      } else if (cmd === 'form-close') {
        return props.navigate('sySiteMng');
      // 카카오 우편번호 팝업 열기
      } else if (cmd === 'addr-search') {
        return openKakaoPostcode();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

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

    /* openKakaoPostcode — 카카오 우편번호 팝업 열기 */
    const openKakaoPostcode = () => {
      /* run — 팝업 실행 */
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.siteZipCode = data.zonecode;
            form.siteAddress = data.roadAddress || data.jibunAddress;
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
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('sySiteMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.site_oper_statuses = codeStore.sgGetGrpCodes('SITE_OPER_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      if (!cfIsNew.value) {
        await handleLoadDetail();
      }
    });

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 폼 (cols=3 — 빈 칸 없이 3열을 모두 채우도록 colSpan 배치)
    const baseFormColumns = [
      // 1행: 사이트코드 / 사이트유형 / 사이트명
      { key: 'siteCode',       label: '사이트코드', type: 'text', required: true,
        placeholder: 'ST0001', mono: true },
      { key: 'siteTypeCd',     label: '사이트유형', type: 'select', nullable: false,
        options: () => codes.site_types },
      { key: 'siteNm',         label: '사이트명',   type: 'text', required: true, placeholder: 'ShopJoy' },
      // 2행: 도메인(2) / 운영상태(1)
      { key: 'siteDomain',     label: '도메인',     type: 'text', required: true, placeholder: 'shopjoy.com', colSpan: 2 },
      { key: 'siteStatusCd',   label: '운영상태',   type: 'select', options: () => codes.site_oper_statuses },
      // 3행: 사이트 설명 (3열 전체)
      { key: 'siteDesc',       label: '사이트 설명', type: 'text', placeholder: '사이트 한줄 설명', colSpan: 3 },
      // 4행: 대표이메일 / 대표전화 / 대표자명
      { key: 'siteEmail',      label: '대표이메일', type: 'text', placeholder: 'help@shopjoy.com' },
      { key: 'sitePhone',      label: '대표전화',   type: 'text', placeholder: '02-1234-5678' },
      { key: 'siteCeo',        label: '대표자명',   type: 'text' },
      // 5행: 사업자등록번호 / 주소(2)
      { key: 'siteBusinessNo', label: '사업자등록번호', type: 'text', placeholder: '000-00-00000' },
      { key: '_addr',          label: '주소', type: 'slot', name: 'addr', colSpan: 2 },
      // 6행: 로고 URL / 파비콘 URL / (빈칸 1)
      { key: 'logoUrl',        label: '로고 URL',   type: 'text', placeholder: '/assets/img/logo.png' },
      { key: 'faviconUrl',     label: '파비콘 URL', type: 'text', placeholder: '/favicon.ico' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, codes, form, errors, addrDetailRef,           // 상태 / 데이터
      baseFormColumns,                                       // 컬럼 정의
      handleBtnAction,                                       // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode,                                    // computed
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '사이트 등록' : (cfDtlMode ? '사이트 상세' : '사이트 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.siteId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 (BoFormArea 자동 렌더) ================================= -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="3"
      @save="handleBtnAction('form-save')"
      @cancel="handleBtnAction('form-cancel')"
      @edit="handleBtnAction('form-edit')"
      @close="handleBtnAction('form-close')">
      <!-- ===== ■.■.■. 주소: 우편번호+검색버튼+기본주소 (카카오 우편번호 연동) ============= -->
      <template #addr>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <input class="form-control" v-model="form.siteZipCode" placeholder="우편번호"
            style="width:110px;flex-shrink:0;" readonly />
          <button v-if="!cfDtlMode" type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('addr-search')"
            style="white-space:nowrap;">
            🔍 주소 검색
          </button>
        </div>
        <input class="form-control" v-model="form.siteAddress"
          placeholder="기본주소 (주소 검색 후 자동 입력)" readonly />
      </template>
    </bo-form-area>
  </div>
  <!-- ===== □. 폼 영역 ==================================================== -->
</div>
`,
};
