/* ShopJoy Admin - 클레임관리 상세/등록 */
window._odClaimDtlState = window._odClaimDtlState || { activeTab: 'info', tabMode: 'tab' };
window.OdClaimDtl = {
  name: 'OdClaimDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, activeTab: window._odClaimDtlState.activeTab || 'info', tabMode2: window._odClaimDtlState.tabMode || 'tab' });
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ claim_statuses: [], claim_types: [] });
    const claimItems = reactive([]);                                            // 클레임 항목 목록
    const expandedItems = reactive(new Set());                                  // 펼쳐진 클레임 항목 행 인덱스
    const orderPick = reactive({ open: false });                                // 주문 선택 모달 상태
    const memberPick = reactive({ open: false });                               // 회원 선택 모달 상태

    const cfIsNew = computed(() => !props.dtlId);

    const form = reactive({
      claimId: '', memberId: '', memberNm: '', orderId: '', prodNm: '',
      claimTypeCd: '', claimStatusCd: '', reasonCd: '', reasonDetail: '',
      refundAmt: '', refundMethodCd: '', requestDate: '', memo: '',
    });
    /* _applyNewDefaults — 신규 진입 시에만 비어있지 않던 기본값 채움 (inactive/초기화 시 빈 폼 유지) */
    const _applyNewDefaults = () => {
      Object.assign(form, {
        claimTypeCd: '취소', claimStatusCd: '신청',
        refundAmt: 0, refundMethodCd: '계좌환불',
      });
    };
    const errors = reactive({});

    const schema = yup.object({
      claimId: yup.string().required('클레임ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdClaimDtl.js : handleBtnAction -> ', cmd, param);
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
      // 주문 선택 모달 열기
      } else if (cmd === 'orderPickModal-open') {
        orderPick.open = true; return;
      // 주문 선택 모달 닫기
      } else if (cmd === 'orderPickModal-close') {
        orderPick.open = false; return;
      // 회원 선택 모달 열기
      } else if (cmd === 'memberPickModal-open') {
        memberPick.open = true; return;
      // 회원 선택 모달 닫기
      } else if (cmd === 'memberPickModal-close') {
        memberPick.open = false; return;
      // 주문ID 초기화
      } else if (cmd === 'orderId-clear') {
        form.orderId = ''; return;
      // 회원ID 초기화
      } else if (cmd === 'memberId-clear') {
        form.memberId = ''; form.memberNm = ''; return;
      // 주문 참조 모달 열기
      } else if (cmd === 'form-orderRef') {
        return showRefModal('order', form.orderId);
      // 회원 참조 모달 열기
      } else if (cmd === 'form-memberRef') {
        return showRefModal('member', form.memberId);
      // 탭 전환
      } else if (cmd === 'tab-change') {
        if (uiState.tabMode2 === 'tab') { uiState.activeTab = param; }
        return;
      // 뷰모드 전환
      } else if (cmd === 'viewMode-change') {
        uiState.tabMode2 = param;
        return;
      // 클레임항목 전체 펼침 토글
      } else if (cmd === 'claimItems-toggleExpandAll') {
        if (cfAllExpanded.value) { expandedItems.clear(); }
        else { expandedItems.clear(); claimItems.forEach((_, i) => expandedItems.add(i)); }
        return;
      // 배송 추적 창 열기
      } else if (cmd === 'tracking-open') {
        return openTracking(param.courier, param.trackingNo);
      // 환불 계산 모달 열기
      } else if (cmd === 'calc-open') {
        return handleOpenDtlCalc();
      // 환불 계산 모달 닫기
      } else if (cmd === 'calc-close') {
        dtlCalcDialog.show = false; return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdClaimDtl.js : handleSelectAction -> ', cmd, param);
      // 클레임항목 행 펼침 토글
      if (cmd === 'claimItems-rowToggleExpand') {
        if (expandedItems.has(param)) { expandedItems.delete(param); }
        else { expandedItems.add(param); }
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모달 선택 결과 처리 (cmd = modalName) */
    const fnCallbackModal = (cmd, param, result) => {
      // 주문 선택
      if (cmd === 'order-pick') {
        orderPick.open = false;
        if (result) {
          form.orderId  = result.orderId || '';
          // 주문에서 회원정보 자동 채움
          if (result.memberNm || result.userNm) { form.memberNm = result.memberNm || result.userNm || ''; }
        }
        return;
      // 회원 선택
      } else if (cmd === 'member-pick') {
        memberPick.open = false;
        if (result) {
          form.memberId = result.memberId || '';
          form.memberNm = result.memberNm || result.loginId || result.memberId || '';
        }
        return;
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS');
      codes.claim_types = codeStore.sgGetGrpCodes('CLAIM_TYPE');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const cfClaimSteps = computed(() => {
      const typeKey = coConsts.CLAIM_TYPE_CD_MAP[form.claimTypeCd] || form.claimTypeCd || 'CANCEL';
      return coConsts.CLAIM_STEP_MAP[typeKey] || coConsts.CLAIM_STEP_MAP.CANCEL;
    });
    /* cfClaimStatusCodes: status 드롭다운용 — DB 코드 전체 (필터 없이) */
    const cfClaimStatusCodes = computed(() =>
      (codes.claim_statuses || []).filter(c => c.useYn === 'Y').sort((a, b) => a.sortOrd - b.sortOrd)
    );
    const cfCurrentStepIdx = computed(() => cfClaimSteps.value.indexOf(form.claimStatusCd));
    const cfStatusOptions   = computed(() => cfClaimSteps.value);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.odClaim.getById(props.dtlId, '클레임관리', '상세조회');
        const c = res.data?.data || res.data || {};
        Object.assign(form, { ...c });
        if (!form.claimId) { form.claimId = props.dtlId; }
        // getById 응답에 임베드된 클레임항목(claimItems) 사용
        claimItems.splice(0, claimItems.length, ...((c.claimItems || []).map(x => ({
          ...x,
          prodNm: x.prodNm,
          color: x.prodOption || '',
          size: '',
          qty: x.claimQty || 1,
          salePrice: x.unitPrice || 0,
          price: x.itemAmt || 0,
          discAmount: x.discAmount || 0,
          discInfo: x.discInfo || '',
          // 교환 대상 필드 (new_* 컬럼)
          newProdId: x.newProdId || null,
          newProdSkuId: x.newProdSkuId || null,
          newProdOptId1: x.newProdOptId1 || null,
          newProdOptId2: x.newProdOptId2 || null,
          newProdNm: x.newProdNm || null,
          newProdOption: x.newProdOption || null,
          newQty: x.newQty || null,
          newUnitPrice: x.newUnitPrice || null,
        }))));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleSearchDetail();
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    });

    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      uiState.activeTab = 'items'; // 행 변경 시 클레임항목 탭 기본
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

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
      const isNewClaim = cfIsNew.value;
      const ok = await showConfirm(isNewClaim ? '등록' : '저장', isNewClaim ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await (isNewClaim
          ? boApiSvc.odClaim.create({ ...form, refundAmt: Number(form.refundAmt) }, '클레임관리', '등록')
          : boApiSvc.odClaim.update(form.claimId, { ...form, refundAmt: Number(form.refundAmt) }, '클레임관리', '저장'));
        if (showToast) { showToast(isNewClaim ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('odClaimMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    watch(() => uiState.activeTab, v => { window._odClaimDtlState.activeTab = v; });
    watch(() => uiState.tabMode2, v => { window._odClaimDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.activeTab === id;

    /* fmt — 포맷 */
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

    const CLAIM_TYPE_COLOR = coConsts.CLAIM_TYPE_COLOR;

    /* isExpanded — 여부 확인 */
    const isExpanded = (i) => expandedItems.has(i);
    /* fnItemExpanded — 유틸 */
    const fnItemExpanded = (row, i) => isExpanded(i) && form.claimTypeCd === '교환';
    const cfAllExpanded = computed(() => claimItems.length > 0 && window.safeArrayUtils.safeEvery(claimItems, (_,i) => expandedItems.has(i)));

    watch(claimItems, (list) => { expandedItems.clear(); list.forEach((_,i) => expandedItems.add(i)); });

    /* getExchangedItem — 교환 요청 대상 정보 반환 (new_* 실데이터 기반) */
    const getExchangedItem = (it) => {
      if (form.claimTypeCd !== '교환') { return {}; }
      return {
        prodNm: it.newProdNm || '-',
        prodOption: it.newProdOption || '-',
        qty: it.newQty != null ? it.newQty : '-',
        unitPrice: it.newUnitPrice != null ? it.newUnitPrice : null,
        prodId: it.newProdId || null,
        prodSkuId: it.newProdSkuId || null,
        prodOptId1: it.newProdOptId1 || null,
        prodOptId2: it.newProdOptId2 || null,
        courier: form.exchangeCourierCd || null,
        trackingNo: form.exchangeTrackingNo || null,
      };
    };

    /* trackingUrl — 추적 URL */
    const trackingUrl = (courier, no) => {
      if (!no) { return ''; }
      if (courier === 'CJ대한통운') return 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' + no;
      if (courier === '롯데택배')   return 'https://www.lotteglogis.com/open/tracking?invno=' + no;
      if (courier === '한진택배')   return 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=' + no;
      if (courier === '우체국택배') return 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' + no;
      if (courier === '로젠택배')   return 'https://www.ilogen.com/web/personal/trace/' + no;
      return '';
    };

    /* openTracking — 열기 */
    const openTracking = (courier, no) => {
      const url = trackingUrl(courier, no);
      if (!url) { showToast && showToast('운송장 정보가 없습니다.', 'error'); return; }
      window.open(url, 'dlivTrack', 'width=900,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
    };
    const cfPaymentList = computed(() => form.refundAmt || form.claimId ? [{
      method: form.refundMethodCd || '-', status: form.claimStatusCd || '-',
      amount: form.refundAmt || 0, payDate: form.requestDate || '-',
      account: form.refundAccount || '-', apprNo: form.apprNo || '-',
    }] : []);
    const cfStatusHistList = computed(() => {
      if (!form.claimId) { return []; }
      const d = String(form.requestDate || '').slice(0,10) || '-';
      return [
        { date: d+' 09:10', user:'회원',   from:'-',           to: form.claimTypeCd+'요청', memo: form.claimTypeCd+' 접수' },
        { date: d+' 11:30', user:'bo',  from: form.claimTypeCd+'요청', to:'처리중',        memo:'검토 후 처리 시작' },
        { date: d+' 15:00', user:'bo',  from:'처리중',      to: form.claimStatusCd,  memo:'상태 갱신' },
      ];
    });
    const cfEditHistList = computed(() => form.claimId ? [
      { date: String(form.requestDate||'').slice(0,10)+' 10:00', user:'bo', field:'사유',      before:'-', after: form.reasonCd || '-' },
      { date: String(form.requestDate||'').slice(0,10)+' 12:20', user:'bo', field:'환불금액',  before:'0', after: (form.refundAmt||0).toLocaleString() },
    ] : []);
    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'클레임항목',    icon:'↩', get count() { return claimItems.length; } },
      { id:'payment',  label:'결제정보',      icon:'💳', get count() { return cfPaymentList.value.length; } },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', get count() { return cfStatusHistList.value.length; } },
      { id:'editHist', label:'정보수정이력',  icon:'📝', get count() { return cfEditHistList.value.length; } },
    ]);

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* 결제정보 탭 그리드 컬럼 */
    const columns = {};
    columns.paymentGrid = [
      { key: 'method',  label: '환불수단' },
      { key: 'status',  label: '환불상태', badge: () => 'badge-orange' },
      { key: 'amount',  label: '환불금액', style: 'text-align:right;', fmt: (v) => fmt(v),
        align: 'right', cellStyle: 'font-weight:700;' },
      { key: 'payDate', label: '처리일시', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
      { key: 'account', label: '계좌/카드' },
      { key: 'apprNo',  label: '승인번호' },
    ];

    /* 정보수정이력 탭 그리드 컬럼 */
    columns.editHistGrid = [
      { key: 'date',   label: '수정일시', style: 'width:140px;' },
      { key: 'user',   label: '수정자',   style: 'width:100px;' },
      { key: 'field',  label: '항목',     style: 'width:120px;' },
      { key: 'before', label: '변경 전', cellStyle: 'color:#888;' },
      { key: 'after',  label: '변경 후', cellStyle: 'color:#e8587a;font-weight:600;' },
    ];

    /* 클레임항목 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    columns.claimItemGrid = [
      { key: 'prodNm',      label: '상품명' },
      { key: 'color',       label: '색상',       style: 'width:60px;',                fmt: v => v || '-' },
      { key: 'size',        label: '사이즈',     style: 'width:50px;',                fmt: v => v || '-' },
      { key: 'qty',         label: '수량',       style: 'width:44px;text-align:center;',
        align: 'center', fmt: (v) => v || 1, cellStyle: 'font-weight:600;' },
      { key: 'salePrice',   label: '판매금액',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v, row) => fmt(row.salePrice || row.price || 0), cellStyle: 'color:#666;' },
      { key: 'discInfo',    label: '할인정보',   style: 'width:80px;', cellStyle: 'font-size:12px;',
        fmt: (v) => v || '-',
        cellInnerStyle: (v) => v ? 'font-size:11px;padding:2px 7px;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:600;' : 'color:#bbb;' },
      { key: 'discAmount',  label: '할인금액',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v) => v ? '-' + fmt(v) : '-', cellStyle: 'color:#d84315;font-weight:600;' },
      { key: 'price',       label: '결제금액',   style: 'width:100px;text-align:right;',
        align: 'right', fmt: (v) => fmt(v || 0), cellStyle: 'font-weight:700;color:#1a1a1a;' },
      { key: 'orderStatus', label: '주문상태',   style: 'width:90px;text-align:center;', align: 'center',
        fmt: () => form.orderStatusCd || '-',
        cellInnerStyle: () => form.orderStatusCd
          ? 'font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;'
          : 'color:#ccc;' },
      { key: 'claimStatus', label: '클레임상태', style: 'width:110px;text-align:center;', align: 'center',
        fmt: () => `${form.claimTypeCd || ''} · ${form.claimStatusCd || ''}`,
        cellInnerStyle: () => `font-size:10px;padding:2px 8px;border-radius:8px;color:#fff;font-weight:700;background:${CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af'};` },
      { key: 'exchInfo',    label: '교환정보',   style: 'width:140px;', cellStyle: 'font-size:12px;',
        trackBoxes: {
          items: () => form.claimTypeCd !== '교환' ? [] : [
            ...(form.exchangeCourierCd ? [{ label: '발송', courier: form.exchangeCourierCd, trackingNo: form.exchangeTrackingNo, colorVariant: 'blue' }] : []),
            ...(form.returnCourierCd   ? [{ label: '수거', courier: form.returnCourierCd,   trackingNo: form.returnTrackingNo,   colorVariant: 'orange' }] : []),
          ],
          onTrack: openTracking,
        } },
    ];

    // 기본 폼 (cols=3 한 줄 3필드 + 상세 사유는 한 줄 전체)
    columns.baseForm = [
      // 1행: 클레임ID / 주문ID / 회원ID
      { key: 'claimId',      label: '클레임ID', type: 'text', required: true,
        placeholder: 'CLM-2026-XXX', readonly: !cfIsNew.value },
      { key: 'orderId',      label: '주문ID', type: 'slot', name: 'orderId', required: true },
      { key: 'memberId',     label: '회원ID', type: 'slot', name: 'memberId' },
      // 2행: 회원명 / 클레임유형 / 처리상태
      { key: 'memberNm',     label: '회원명', type: 'text' },
      { key: 'claimTypeCd',  label: '클레임 유형', type: 'select', options: () => codes.claim_types },
      { key: 'claimStatusCd', label: '처리 상태', type: 'select',
        nullLabel: '상태 선택',
        options: () => cfStatusOptions.value.length ? cfStatusOptions.value : cfClaimStatusCodes.value.map(c => c.codeLabel) },
      // 3행: 상품명 / 사유 / 신청일
      { key: 'prodNm',       label: '상품명', type: 'text' },
      { key: 'reasonCd',     label: '사유', type: 'text' },
      { key: 'requestDate',  label: '신청일', type: 'text', placeholder: '2026-04-08 10:00' },
      // 4행: 상세 사유 (한 줄 전체)
      { key: 'reasonDetail', label: '상세 사유', type: 'textarea', rows: 3, colSpan: 3 },
    ];

    /* ##### [06] 클레임 금액 계산 ##################################################### */

    const dtlCalcDialog = reactive({ show: false, loading: false, claimId: '', data: null, orderClaims: [], switchLoading: false });

    const fnLoadDtlCalcData = async function (claimId, orderId) {
      var cr = await boApiSvc.odClaim.getById(claimId, '클레임상세', '계산조회');
      var claimData = (cr.data && cr.data.data) || cr.data || {};
      var resolvedOrderId = orderId || claimData.orderId || '';
      var orderData = {};
      if (resolvedOrderId) {
        var or = await boApiSvc.odOrder.getById(resolvedOrderId, '클레임상세', '주문조회');
        orderData = (or.data && or.data.data) || or.data || {};
      }
      var hr = await boApiSvc.odClaim.getStatusHist(claimId, '클레임상세', '상태이력');
      var statusHist = (hr.data && hr.data.data) || [];
      return { claimData, orderData, statusHist, resolvedOrderId };
    };

    const fnDtlCalcAmt = function (claimData, orderData) {
      var claimItemList = claimData.claimItems || [];
      var itemAmt = claimItemList.reduce(function (s, it) { return s + (it.itemAmt || it.item_amt || (it.unitPrice || 0) * (it.claimQty || 1)); }, 0);
      var orderItemAmt = (orderData.orderItems || []).reduce(function (s, it) {
        return s + (it.itemOrderAmt || it.item_order_amt || (it.unitPrice || it.unit_price || it.salePrice || 0) * (it.orderQty || it.order_qty || 1));
      }, 0);
      var orderTotalAmt = orderData.payAmt || orderData.pay_amt || orderData.totalAmt || 0;
      var ratio = orderItemAmt > 0 ? Math.min(1, itemAmt / orderItemAmt) : (orderTotalAmt > 0 ? Math.min(1, itemAmt / orderTotalAmt) : 0);
      var couponDiscAmt = Math.round((orderData.couponDiscntAmt || orderData.couponDiscAmt || 0) * ratio);
      var saveUsedAmt   = Math.round((orderData.saveUseAmt || orderData.saveUsedAmt || 0) * ratio);
      var cacheUsedAmt  = Math.round((orderData.cacheUsedAmt || 0) * ratio);
      var totalClaimQty = claimItemList.reduce(function (s, it) { return s + (it.claimQty || 1); }, 0);
      var totalOrderQty = (orderData.orderItems || []).reduce(function (s, it) { return s + (it.orderQty || it.order_qty || 1); }, 0);
      var isFullCancel  = totalOrderQty > 0 && totalClaimQty >= totalOrderQty;
      var dlivFeeRefund = isFullCancel ? (orderData.shippingFee || orderData.dlivFee || 0) : 0;
      var refundBase    = Math.max(0, itemAmt - couponDiscAmt - saveUsedAmt - cacheUsedAmt + dlivFeeRefund);
      return { itemAmt, couponDiscAmt, saveUsedAmt, cacheUsedAmt, dlivFeeRefund, refundBase,
               isFullCancel, ratio, orderTotalAmt, couponNm: orderData.couponNm || '', saveGradePct: orderData.saveGradePct || 0 };
    };

    const handleOpenDtlCalc = async function () {
      var cid = form.claimId || props.dtlId;
      dtlCalcDialog.claimId     = cid;
      dtlCalcDialog.data        = null;
      dtlCalcDialog.orderClaims = [];
      dtlCalcDialog.loading     = true;
      dtlCalcDialog.show        = true;
      try {
        var { claimData, orderData, statusHist, resolvedOrderId } = await fnLoadDtlCalcData(cid, form.orderId || '');
        dtlCalcDialog.data = { claim: claimData, order: orderData, calc: fnDtlCalcAmt(claimData, orderData), statusHist };
        if (resolvedOrderId) {
          var lor = await boApiSvc.odClaim.getPage({ orderId: resolvedOrderId, pageNo: 1, pageSize: 100 }, '클레임상세', '주문클레임목록').catch(function () { return null; });
          var allClaims = (lor && (lor.data?.data?.pageList || lor.data?.data?.list || [])) || [];
          dtlCalcDialog.orderClaims = allClaims.length ? allClaims : [claimData];
        }
      } catch (e) {
        showToast('계산 정보 조회 중 오류가 발생했습니다.', 'error', 0);
        dtlCalcDialog.show = false;
      } finally {
        dtlCalcDialog.loading = false;
      }
    };

    const handleDtlCalcSwitch = async function (claimId) {
      if (!claimId || !dtlCalcDialog.data) return;
      var curClaimId = dtlCalcDialog.data.claim.claimId || dtlCalcDialog.data.claimId;
      if (claimId === curClaimId) return;
      dtlCalcDialog.switchLoading = true;
      try {
        var targetClaim = dtlCalcDialog.orderClaims.find(function (c) { return c.claimId === claimId; }) || {};
        var { claimData, orderData, statusHist } = await fnLoadDtlCalcData(claimId, targetClaim.orderId || dtlCalcDialog.data.claim.orderId || form.orderId || '');
        dtlCalcDialog.data = { claim: claimData, order: orderData, calc: fnDtlCalcAmt(claimData, orderData), statusHist };
      } catch (e) {
        showToast('클레임 전환 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        dtlCalcDialog.switchLoading = false;
      }
    };

    /* ##### [07] return (템플릿 노출) ############################################## */

    /* claimItemGridRowDetail — 클레임항목 행 펼침 BoFormArea 컬럼 (교환품 정보) */
    columns.claimItemGridRowDetail = [
      { key: '_exchLabel',  label: '교환품',   type: 'readonly', html: true,
        fmt: () => `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#3b82f6;color:#fff;font-weight:800;">↔ 교환 요청</span>` },
      { key: '_exchProd',   label: '교환 상품명', type: 'readonly', html: true,
        fmt: (v, row) => `<b style="color:#1e40af;">${getExchangedItem(row).prodNm || '-'}</b>` },
      { key: '_exchOption', label: '교환 옵션',   type: 'readonly',
        fmt: (v, row) => getExchangedItem(row).prodOption || '-' },
      { key: '_exchQty',    label: '교환 수량',   type: 'readonly',
        fmt: (v, row) => getExchangedItem(row).qty != null ? getExchangedItem(row).qty : '-' },
      { key: '_exchPrice',  label: '교환 단가',   type: 'readonly',
        fmt: (v, row) => getExchangedItem(row).unitPrice != null ? fmt(getExchangedItem(row).unitPrice) : '-' },
      { key: '_priceDiff',  label: '정산 차액',   type: 'readonly', html: true,
        fmt: (v, row) => {
          const ex = getExchangedItem(row);
          if (ex.unitPrice == null || ex.qty == null) { return '<span style="color:#bbb;">-</span>'; }
          const diff = (ex.unitPrice * ex.qty) - ((row.unitPrice || 0) * (row.qty || 1));
          const color = diff > 0 ? '#d84315' : diff < 0 ? '#059669' : '#555';
          return `<b style="color:${color};">${diff >= 0 ? '+' : ''}${fmt(diff)}</b>`;
        } },
      { key: '_tracking',   label: '발송추적',    type: 'slot', name: 'tracking',
        visible: (row) => !!getExchangedItem(row).courier },
    ];

    return {
      columns,
      form, errors, claimItems, activeTab, tabMode2,                      // 상태 / 데이터
      orderPick, memberPick,                                               // 모달 상태
      handleBtnAction, handleSelectAction, fnCallbackModal,               // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode, cfClaimSteps, cfCurrentStepIdx, tabs, cfEditHistList,                 // computed
      cfPaymentList, cfStatusHistList, cfAllExpanded, // computed
      CLAIM_TYPE_COLOR, // 상수
      fmt, showTab, isExpanded, fnItemExpanded, getExchangedItem, // 헬퍼
      showRefModal,                                                                                       // 모달 (template 직접 참조)
      dtlCalcDialog, handleOpenDtlCalc, handleDtlCalcSwitch,                                            // 환불 계산 모달
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '클레임 상세' : (cfIsNew ? '클레임 등록' : (cfDtlMode ? '클레임 상세' : '클레임 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.claimId)">
  <!-- ===== ■.■. 탭바 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="activeTab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-change', id)"
    @mode-select="m => handleBtnAction('viewMode-change', m)" />
  <!-- ===== □. 탭바 ====================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <div v-if="showTab('info')" class="dtl-pane">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>
      <!-- ===== ■.■.■. 클레임 진행 상태 흐름 ======================================== -->
      <div style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <span :style="{
            fontSize:'11px',padding:'3px 10px',borderRadius:'10px',color:'#fff',fontWeight:800,
            background: CLAIM_TYPE_COLOR[form.claimTypeCd] || '#9ca3af',
            }">
            ↩ {{ form.claimTypeCd || (cfIsNew ? '신규 클레임' : '') }}
          </span>
          <span style="font-size:13px;font-weight:700;color:#222;">{{ form.claimId }}</span>
          <span v-if="form.requestDate" style="font-size:11px;color:#888;">신청일: {{ form.requestDate }}</span>
          <span v-if="form.reasonDetail" style="font-size:11px;color:#888;">사유: {{ form.reasonDetail }}</span>
          <button v-if="!cfIsNew" class="btn btn-xs" style="margin-left:auto;background:#059669;color:#fff;border:none;padding:2px 8px;" @click="handleBtnAction('calc-open')">💰 계산</button>
        </div>
        <div style="display:flex;align-items:flex-start;overflow-x:auto;">
          <template v-for="(step, idx) in cfClaimSteps" :key="step">
            <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
              <div :style="{
                width: idx === cfCurrentStepIdx ? '14px' : '10px',
                height: idx === cfCurrentStepIdx ? '14px' : '10px',
                borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
                boxShadow: idx === cfCurrentStepIdx ? '0 0 0 3px '+(CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af')+'40' : 'none',
                background: idx <= cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : '#bbb',
                }"></div>
              <div :style="{
                fontSize:'11.5px', fontWeight: idx === cfCurrentStepIdx ? 800 : 600,
                color: idx === cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : (idx < cfCurrentStepIdx ? '#444' : '#bbb'),
                whiteSpace:'nowrap', textAlign:'center',
                }">
                {{ step }}
              </div>
              <span v-if="step==='수거중' ? (form.returnTrackingNo) : false" @click="handleBtnAction('tracking-open', { courier: form.returnCourierCd, trackingNo: form.returnTrackingNo })" title="수거 배송조회" style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;user-select:none;">
                {{ (form.returnCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}수거 🔍
              </span>
              <span v-if="step==='완료' ? (form.exchangeTrackingNo) : false" @click="handleBtnAction('tracking-open', { courier: form.exchangeCourierCd, trackingNo: form.exchangeTrackingNo })" title="발송 배송조회" style="margin-top:4px;padding:1px 7px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:0.7rem;font-weight:700;user-select:none;">
                {{ (form.exchangeCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}발송 🔍
              </span>
            </div>
            <div v-if="idx < cfClaimSteps.length - 1"
              :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : '#bbb'}"></div>
          </template>
        </div>
      </div>
      <!-- ===== ■.■.■. 기본정보 폼 (BoFormArea 자동 렌더) =========================== -->
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="active"
        @save="handleBtnAction('form-save')"
        @cancel="handleBtnAction('form-cancel')"
        @edit="handleBtnAction('form-edit')"
        @close="handleBtnAction('form-close')">
        <!-- ===== ■.■.■.■. 주문ID + 선택/초기화/보기 ===================================== -->
        <template #orderId>
          <div style="display:flex;gap:6px;align-items:center;">
            <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="cfDtlMode" :class="errors.orderId ? 'is-invalid' : ''" style="flex:1;" />
            <template v-if="!cfDtlMode">
              <button class="btn btn-sm btn-secondary" style="padding:2px 7px;" @click="handleBtnAction('orderPickModal-open')" title="선택">🔍</button>
              <button v-if="form.orderId" class="btn btn-sm" style="padding:1px 5px;font-size:10px;line-height:1;color:#aaa;background:none;border:1px solid #e0e0e0;" @click="handleBtnAction('orderId-clear')" title="초기화">✕</button>
            </template>
            <span v-if="form.orderId" class="ref-link" @click="handleBtnAction('form-orderRef')">보기</span>
          </div>
          <span v-if="errors.orderId" class="field-error">{{ errors.orderId }}</span>
        </template>
        <!-- ===== ■.■.■.■. 회원ID + 선택/초기화/보기 ===================================== -->
        <template #memberId>
          <div style="display:flex;gap:6px;align-items:center;">
            <input class="form-control" v-model="form.memberId" placeholder="회원 ID" :readonly="cfDtlMode" style="flex:1;" />
            <template v-if="!cfDtlMode">
              <button class="btn btn-sm btn-secondary" style="padding:2px 7px;" @click="handleBtnAction('memberPickModal-open')" title="선택">🔍</button>
              <button v-if="form.memberId" class="btn btn-sm" style="padding:1px 5px;font-size:10px;line-height:1;color:#aaa;background:none;border:1px solid #e0e0e0;" @click="handleBtnAction('memberId-clear')" title="초기화">✕</button>
            </template>
            <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('form-memberRef')">보기</span>
          </div>
        </template>
      </bo-form-area>
    </div>
    <!-- ===== ■.■. 클레임항목목록 탭 ============================================= -->
    <div v-if="showTab('items')" class="dtl-pane" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">↩ 클레임항목 <span class="tab-count"> {{ claimItems.length }} </span></div>
      <div v-if="form.claimTypeCd==='교환'" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('claimItems-toggleExpandAll')">
          {{ cfAllExpanded ? '▲ 교환품 모두접기' : '▼ 교환품 모두펼치기' }}
        </button>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.claimItemGrid" :rows="claimItems"
        :is-expanded="fnItemExpanded"
        empty-text="클레임 항목 정보가 없습니다.">
        <template #cell-prodNm="{ row, idx }">
          <td style="font-size:12px;">
            <span v-if="form.claimTypeCd==='교환'" @click="handleSelectAction('claimItems-rowToggleExpand', idx)" style="font-size:11px;color:#3b82f6;font-weight:800;user-select:none;margin-right:6px;" :title="isExpanded(idx)?'교환품 숨기기':'교환품 보기'">
              {{ isExpanded(idx) ? '▼' : '▶' }}
            </span>
            {{ row.prodNm }}
          </td>
        </template>
        <template #row-expand="{ row, colspan }">
          <td :colspan="colspan" style="padding:10px 14px;background:#f0f7ff;">
            <bo-form-area :columns="columns.claimItemGridRowDetail" :form="row" :cols="3" compact readonly label-left :show-actions="false">
              <template #tracking>
                <div class="readonly-field" @click="handleBtnAction('tracking-open', { courier: getExchangedItem(row).courier, trackingNo: getExchangedItem(row).trackingNo })" style="padding:2px 8px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:11px;font-weight:700;display:inline-block;cursor:pointer;">
                  {{ getExchangedItem(row).courier }} · {{ getExchangedItem(row).trackingNo || '-' }} 🔍
                </div>
              </template>
            </bo-form-area>
          </td>
        </template>
        <template #tfoot>
          <tr style="background:#fafafa;font-weight:700;">
            <td style="width:36px;"></td>
            <td colspan="4" style="text-align:right;color:#555;">합계</td>
            <td style="width:90px;text-align:right;color:#666;">{{ fmt(claimItems.reduce((s,x)=>s+(x.salePrice||x.price||0),0)) }}</td>
            <td style="width:80px;"></td>
            <td style="width:90px;text-align:right;color:#d84315;">-{{ fmt(claimItems.reduce((s,x)=>s+(x.discAmount||0),0)) }}</td>
            <td style="width:100px;text-align:right;color:#1a1a1a;">{{ fmt(claimItems.reduce((s,x)=>s+(x.price||0),0)) }}</td>
            <td colspan="3"></td>
          </tr>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 클레임항목목록 탭 ============================================= -->
    <!-- ===== ■.■. 결제정보 탭 ================================================ -->
    <div v-if="showTab('payment')" class="dtl-pane" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💳 결제정보 <span class="tab-count"> {{ cfPaymentList.length }} </span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.paymentGrid" :rows="cfPaymentList" empty-text="결제·환불 정보가 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 결제정보 탭 ================================================ -->
    <!-- ===== ■.■. 상태변경이력 탭 ============================================== -->
    <div v-if="showTab('hist')" class="dtl-pane">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">
        🕒 상태변경이력
        <span class="tab-count">{{ cfStatusHistList.length }}</span>
      </div>
      <od-claim-hist :claim-id="form.claimId" :navigate="navigate" />
    </div>
    <!-- ===== □.□. 상태변경이력 탭 ============================================== -->
    <!-- ===== ■.■. 정보수정이력 탭 ============================================== -->
    <div v-if="showTab('editHist')" class="dtl-pane" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 정보수정이력 <span class="tab-count"> {{ cfEditHistList.length }} </span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.editHistGrid" :rows="cfEditHistList" empty-text="정보 수정 이력이 없습니다."></bo-grid>
    </div>
  </div>
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<!-- ===== □.□. 정보수정이력 탭 ============================================== -->
<!-- ===== ■. 주문 선택 모달 ================================================= -->
<div v-if="orderPick.open">
  <order-select-modal modal-name="order-pick" :on-callback="fnCallbackModal"
    @close="handleBtnAction('orderPickModal-close')" />
</div>
<!-- ===== ■. 회원 선택 모달 ================================================= -->
<od-member-pick-modal :show="memberPick.open" ui-nm="클레임관리"
  subtitle="클레임 등록할 회원을 선택해주세요" modal-name="member-pick"
  :on-callback="fnCallbackModal"
  @close="handleBtnAction('memberPickModal-close')" />
<!-- ===== ■. 환불 계산 모달 ================================================= -->
<od-claim-calc-modal :show="dtlCalcDialog.show" :claim-id="dtlCalcDialog.claimId" @close="handleBtnAction('calc-close')" />
`
};
