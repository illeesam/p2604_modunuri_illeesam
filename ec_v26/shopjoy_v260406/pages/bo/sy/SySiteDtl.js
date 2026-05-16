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

    /* 사이트 fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.site_oper_statuses = codeStore.sgGetGrpCodes('SITE_OPER_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


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

    /* ── 카카오 주소 검색 ── */
    const openKakaoPostcode = () => {
      /* 사이트 run */
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

    /* 사이트 저장 */
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

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, codes, cfIsNew, form, errors, handleSave, addrDetailRef, openKakaoPostcode, cfDtlMode };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
    <div class="page-title">{{ cfIsNew ? '사이트 등록' : (cfDtlMode ? '사이트 상세' : '사이트 수정') }}</div>
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.siteId }}</span>
  </div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트코드 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.siteCode" placeholder="ST0001" style="font-family:monospace;font-weight:600;" :readonly="cfDtlMode" :class="errors.siteCode ? 'is-invalid' : ''" />
        <span v-if="errors.siteCode" class="field-error">{{ errors.siteCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">사이트유형</label>
        <select class="form-control" v-model="form.siteTypeCd" :disabled="cfDtlMode">
          <option v-for="t in codes.site_types" :key="t">{{ t }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.siteNm" placeholder="ShopJoy" :readonly="cfDtlMode" :class="errors.siteNm ? 'is-invalid' : ''" />
        <span v-if="errors.siteNm" class="field-error">{{ errors.siteNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">도메인 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.siteDomain" placeholder="shopjoy.com" :readonly="cfDtlMode" :class="errors.siteDomain ? 'is-invalid' : ''" />
        <span v-if="errors.siteDomain" class="field-error">{{ errors.siteDomain }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">사이트 설명</label>
        <input class="form-control" v-model="form.siteDesc" placeholder="사이트 한줄 설명" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표이메일</label>
        <input class="form-control" v-model="form.siteEmail" placeholder="help@shopjoy.com" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">대표전화</label>
        <input class="form-control" v-model="form.sitePhone" placeholder="02-1234-5678" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표자명</label>
        <input class="form-control" v-model="form.siteCeo" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">사업자등록번호</label>
        <input class="form-control" v-model="form.siteBusinessNo" placeholder="000-00-00000" :readonly="cfDtlMode" />
      </div>
    </div>

    <!-- ── 주소 영역 ──────────────────────────────────────────────────────── -->
    <div class="form-group">
      <label class="form-label">주소</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input class="form-control" v-model="form.siteZipCode" placeholder="우편번호"
          style="width:110px;flex-shrink:0;" readonly />
        <button v-if="!cfDtlMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
          style="white-space:nowrap;">🔍 주소 검색</button>
      </div>
      <input class="form-control" v-model="form.siteAddress"
        placeholder="기본주소 (주소 검색 후 자동 입력)" readonly />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">로고 URL</label>
        <input class="form-control" v-model="form.logoUrl" placeholder="/assets/img/logo.png" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">파비콘 URL</label>
        <input class="form-control" v-model="form.faviconUrl" placeholder="/favicon.ico" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">운영상태</label>
        <select class="form-control" v-model="form.siteStatusCd" :disabled="cfDtlMode">
          <option v-for="c in codes.site_oper_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('sySiteMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('sySiteMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
