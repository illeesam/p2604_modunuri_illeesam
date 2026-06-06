/* ShopJoy Admin - 업체정보 상세/등록 */
window.SyVendorDtl = {
  name: 'SyVendorDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, watch, onMounted, ref, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false }); // UI 상태
    const codes = reactive({ active_statuses: [], vendor_type_kr: [] });              // 공통코드

    const form = reactive({                        // 업체 폼 데이터
      vendorId: null, vendorType: '판매업체', vendorNm: '', ceoNm: '', vendorNo: '', vendorPhone: '', vendorEmail: '',
      vendorZipCode: '', vendorAddr: '', vendorAddrDetail: '',
      contractDate: '', vendorStatusCd: '활성', vendorRemark: '',
    });
    const errors = reactive({});                   // 폼 검증 에러
    const addrDetailRef = ref(null);               // 상세주소 input ref

    const schema = yup.object({                    // 폼 검증 스키마
      vendorNm: yup.string().required('업체명을 입력해주세요.'),
      vendorNo: yup.string().required('사업자등록번호를 입력해주세요.'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용, 'new'/'edit' 이면 편집

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorDtl.js : handleBtnAction -> ', cmd, param);
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
        const res = await boApiSvc.syVendor.getById(props.dtlId, '판매자관리', '상세조회');
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
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.vendorZipCode = data.zonecode;
            form.vendorAddr = data.roadAddress || data.jibunAddress;
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
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await (cfIsNew.value ? boApiSvc.syVendor.create({ ...form }, '판매자관리', '등록') : boApiSvc.syVendor.update(form.vendorId, { ...form }, '판매자관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syVendorMng', { reload: true }); }
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
        codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
        codes.vendor_type_kr = codeStore.sgGetGrpCodes('VENDOR_TYPE_KR');
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
    // 기본 폼 (cols=3 빈칸 최소화 + 메모는 한 줄 전체 폭)
    const columns = {};
    columns.baseForm = [
      // 1행: 사이트명(2) + 업체유형(1)
      { key: '_siteNm',        label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
      { key: 'vendorType',     label: '업체유형', type: 'select', nullable: false, required: true,
        options: () => codes.vendor_type_kr },
      // 2행: 업체명 / 사업자등록번호 / 대표자명
      { key: 'vendorNm',       label: '업체명', type: 'text', required: true, placeholder: '업체명' },
      { key: 'vendorNo',       label: '사업자등록번호', type: 'text', required: true, placeholder: '000-00-00000' },
      { key: 'ceoNm',          label: '대표자명', type: 'text' },
      // 3행: 전화번호 / 이메일 / 계약일
      { key: 'vendorPhone',    label: '전화번호', type: 'text' },
      { key: 'vendorEmail',    label: '이메일', type: 'text' },
      { key: 'contractDate',   label: '계약일', type: 'date' },
      // 4행: 주소(2) + 상태(1)
      { key: '_addr',          label: '주소', type: 'slot', name: 'addr', colSpan: 2 },
      { key: 'vendorStatusCd', label: '상태', type: 'select', options: () => codes.active_statuses },
      // 5행: 메모 (3, 한 줄 전체)
      { key: 'vendorRemark',   label: '메모', type: 'slot', name: 'remark', colSpan: 3 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, codes, form, errors, addrDetailRef,           // 상태 / 데이터
      handleBtnAction,                                       // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode,                                    // computed
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 영역 (제목/라벨/폼 모두 컨테이너 안에) ============================= -->
<bo-container :title="!active ? '업체 상세' : (cfIsNew ? '업체 등록' : (cfDtlMode ? '업체 상세' : '업체 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.vendorId)">
  <!-- ===== ■.■. 헤더 (제목 = list-title, 페이지 타이틀 아님 → 폰트 축소) ========= -->
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="active"
    @save="handleBtnAction('form-save')"
    @cancel="handleBtnAction('form-cancel')"
    @edit="handleBtnAction('form-edit')"
    @close="handleBtnAction('form-close')">
    <!-- ===== ■.■.■. 주소: 우편번호+검색버튼+기본주소+상세주소 ============================= -->
    <template #addr>
      <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:6px;">
        <input class="form-control" v-model="form.vendorZipCode" placeholder="우편번호"
          style="width:110px;flex-shrink:0;" readonly />
        <button v-if="!cfDtlMode" type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('addr-search')"
          style="white-space:nowrap;">
          🔍 주소 검색
        </button>
        <button v-if="!cfDtlMode && (form.vendorZipCode || form.vendorAddr)" type="button" title="주소 초기화"
          @click="form.vendorZipCode=''; form.vendorAddr='';"
          style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;">
          x
        </button>
      </div>
      <input class="form-control" v-model="form.vendorAddr" placeholder="기본주소 (주소 검색 후 자동 입력)"
        style="margin-bottom:6px;" readonly />
      <input class="form-control" v-model="form.vendorAddrDetail" ref="addrDetailRef"
        placeholder="상세주소 (동/호수 등)" :readonly="cfDtlMode" />
    </template>
    <!-- ===== ■.■.■. 메모: Quill 또는 view 모드 HTML =========================== -->
    <template #remark>
      <div v-if="cfDtlMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.vendorRemark || '<span style=color:#bbb>-</span>'">
      </div>
      <base-html-editor v-else v-model="form.vendorRemark" height="180px" />
    </template>
  </bo-form-area>
  <!-- ===== □.□. 폼 영역 ================================================== -->
</bo-container>
<!-- ===== □. 컨테이너 영역 =================================================== -->
`,
};
