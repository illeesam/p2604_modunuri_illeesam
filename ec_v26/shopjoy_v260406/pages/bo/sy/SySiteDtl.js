/* ShopJoy Admin - 사이트관리 상세/등록 */
window.SySiteDtl = {
  name: 'SySiteDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ site_oper_statuses: [], site_types: ['이커머스','숙박공유','전문가연결','IT매칭','부동산','교육','중고거래','영화예매','음식배달','가격비교','시각화','홈페이지','기타'] });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);

    const form = reactive({
      siteId: null, siteCode: '', siteTypeCd: '홈페이지', siteNm: '', siteDomain: '',
      logoUrl: '', faviconUrl: '', siteDesc: '',
      siteEmail: '', sitePhone: '',
      siteZipCode: '', siteAddress: '',
      siteBusinessNo: '', siteCeo: '', siteStatusCd: 'ACTIVE',
    });
    const errors = reactive({});
    const addrDetailRef = ref(null);

    const schema = yup.object({
      siteCode: yup.string().required('사이트코드를 입력해주세요.'),
      siteNm: yup.string().required('사이트명을 입력해주세요.'),
      siteDomain: yup.string().required('도메인을 입력해주세요.'),
    });

    /* 사이트 상세조회 */

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.sySite.getById(props.dtlId, '사이트관리', '상세조회');
        const data = res.data?.data;
        if (data) Object.assign(form, data);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
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
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) {
        await handleLoadDetail();
      }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* openKakaoPostcode — 열기 */
    const openKakaoPostcode = () => {
      /* run — 실행 */
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.siteZipCode = data.zonecode;
            form.siteAddress = data.roadAddress || data.jibunAddress;
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
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.sySite.create({ ...form }, '사이트관리', '등록') : boApiSvc.sySite.update(form.siteId, { ...form }, '사이트관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('sySiteMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // --- [컬럼 정의] ---

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const baseFormColumns = [
      { key: 'siteCode',       label: '사이트코드', type: 'text', required: true,
        placeholder: 'ST0001', mono: true },
      { key: 'siteTypeCd',     label: '사이트유형', type: 'select', nullable: false,
        options: () => codes.site_types },
      { key: 'siteNm',         label: '사이트명',   type: 'text', required: true, placeholder: 'ShopJoy' },
      { key: 'siteDomain',     label: '도메인',     type: 'text', required: true, placeholder: 'shopjoy.com' },
      { type: 'rowBreak' },
      { key: 'siteDesc',       label: '사이트 설명', type: 'text', placeholder: '사이트 한줄 설명', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'siteEmail',      label: '대표이메일', type: 'text', placeholder: 'help@shopjoy.com' },
      { key: 'sitePhone',      label: '대표전화',   type: 'text', placeholder: '02-1234-5678' },
      { key: 'siteCeo',        label: '대표자명',   type: 'text' },
      { key: 'siteBusinessNo', label: '사업자등록번호', type: 'text', placeholder: '000-00-00000' },
      { type: 'rowBreak' },
      { key: '_addr',          label: '주소', type: 'slot', name: 'addr', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'logoUrl',        label: '로고 URL',   type: 'text', placeholder: '/assets/img/logo.png' },
      { key: 'faviconUrl',     label: '파비콘 URL', type: 'text', placeholder: '/favicon.ico' },
      { type: 'rowBreak' },
      { key: 'siteStatusCd',   label: '운영상태',   type: 'select', options: () => codes.site_oper_statuses },
    ];

    // ===== setup() return ===================================================

    // ===== return (템플릿 노출) ===============================================

    return { uiState, codes, cfIsNew, form, errors, handleSave, addrDetailRef, openKakaoPostcode, cfDtlMode, baseFormColumns };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '사이트 등록' : (cfDtlMode ? '사이트 상세' : '사이트 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.siteId }}</span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 (BoFormArea 자동 렌더) ================================= -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2"
      @save="handleSave"
      @cancel="navigate('sySiteMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('sySiteMng')">
      <!-- ===== ■.■.■. 주소: 우편번호+검색버튼+기본주소 (카카오 우편번호 연동) ==================== -->
      <template #addr>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <input class="form-control" v-model="form.siteZipCode" placeholder="우편번호"
            style="width:110px;flex-shrink:0;" readonly />
          <button v-if="!cfDtlMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
            style="white-space:nowrap;">
            🔍 주소 검색
          </button>
        </div>
        <input class="form-control" v-model="form.siteAddress"
          placeholder="기본주소 (주소 검색 후 자동 입력)" readonly />
      </template>
    </bo-form-area>
  </div>
</div>

    <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->`
};
