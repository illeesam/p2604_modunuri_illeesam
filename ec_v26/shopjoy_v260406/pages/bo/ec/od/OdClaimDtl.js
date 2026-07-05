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

    /* CLAIM_STEPS: 정책서 1-C 기준 static 흐름 (parentCodeValues DB 동기 불필요) */
    const CLAIM_STEP_MAP = {
      CANCEL:   ['취소요청', '취소처리중', '취소완료'],
      RETURN:   ['반품요청', '수거예정', '수거중', '검수중', '환불대기', '환불완료'],
      EXCHANGE: ['교환요청', '수거예정', '수거중', '교환완료'],
    };
    const TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const cfClaimSteps = computed(() => {
      const typeKey = TYPE_CD[form.claimTypeCd] || form.claimTypeCd || 'CANCEL';
      return CLAIM_STEP_MAP[typeKey] || CLAIM_STEP_MAP.CANCEL;
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

    const CLAIM_TYPE_COLOR = { '취소':'#ef4444', '반품':'#FFBB00', '교환':'#3b82f6' };

    /* isExpanded — 여부 확인 */
    const isExpanded = (i) => expandedItems.has(i);
    /* fnItemExpanded — 유틸 */
    const fnItemExpanded = (row, i) => isExpanded(i) && form.claimTypeCd === '교환';
    const cfAllExpanded = computed(() => claimItems.length > 0 && window.safeArrayUtils.safeEvery(claimItems, (_,i) => expandedItems.has(i)));

    watch(claimItems, (list) => { expandedItems.clear(); list.forEach((_,i) => expandedItems.add(i)); });

    /* getExchangedItem — 조회 */
    const getExchangedItem = (it) => {
      if (form.claimTypeCd !== '교환') { return null; }
      const swapColor = { '블랙':'네이비','네이비':'차콜','화이트':'아이보리','차콜':'블랙' };

      return {
        prodNm: it.prodNm + ' (교환품)',
        color: swapColor[it.color] || '네이비',
        size: it.size, qty: it.qty, price: it.price,
        courier: form.exchangeCourierCd,
        trackingNo: form.exchangeTrackingNo,
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
      { key: '_exchLabel', label: '교환품',  type: 'readonly', html: true, fmt: () => `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#3b82f6;color:#fff;font-weight:800;">↔ 교환</span>` },
      { key: '_exchProd',  label: '상품명',  type: 'readonly', html: true, fmt: (v, row) => `<b style="color:#1e40af;">${getExchangedItem(row).prodNm || '-'}</b>` },
      { key: '_exchColor', label: '색상',    type: 'readonly', html: true, fmt: (v, row) => `<b>${row.color || '-'}</b> → <b style="color:#1e40af;">${getExchangedItem(row).color || '-'}</b>` },
      { key: '_exchSize',  label: '사이즈',  type: 'readonly', fmt: (v, row) => getExchangedItem(row).size || '-' },
      { key: '_exchQty',   label: '수량',    type: 'readonly', fmt: (v, row) => getExchangedItem(row).qty || '-' },
      { key: '_tracking',  label: '발송추적', type: 'slot', name: 'tracking', visible: (row) => !!getExchangedItem(row).courier },
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
                <div class="readonly-field" @click="handleBtnAction('tracking-open', { courier: getExchangedItem(row).courier, trackingNo: getExchangedItem(row).trackingNo })" style="padding:2px 8px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:11px;font-weight:700;display:inline-block;">
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
<!-- ===== (구 인라인 모달 — OdClaimCalcModal 컴포넌트로 대체됨) -->
<bo-modal :show="false" title="환불 (예정) 계산" width="760px"
  @close="handleBtnAction('calc-close')">
  <template #default>
    <div v-if="dtlCalcDialog.loading" style="text-align:center;padding:40px 0;color:#94a3b8;">⏳ 계산 중...</div>
    <template v-else-if="dtlCalcDialog.data">
      <!-- ① 메타 바: 회원·주문·클레임·신청일·상태 한 줄 -->
      <div style="display:grid;grid-template-columns:auto auto 1fr auto auto;gap:0;align-items:stretch;margin-bottom:14px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;font-size:11px;">
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">회원</div>
          <div style="font-weight:700;color:#111;white-space:nowrap;">{{ form.memberNm || '-' }}</div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">주문번호</div>
          <div style="font-weight:700;color:#1d4ed8;font-family:monospace;white-space:nowrap;">{{ form.orderId || '-' }}</div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">클레임번호</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:700;font-family:monospace;color:#111;">{{ dtlCalcDialog.data.claimId }}</span>
            <span style="padding:1px 8px;border-radius:8px;font-size:10px;font-weight:700;"
              :style="dtlCalcDialog.data.claimType==='CANCEL'?'background:#fee2e2;color:#b91c1c':dtlCalcDialog.data.claimType==='RETURN'?'background:#fff7ed;color:#9a3412':'background:#dbeafe;color:#1d4ed8'">
              {{ dtlCalcDialog.data.claimType==='CANCEL'?'취소':dtlCalcDialog.data.claimType==='RETURN'?'반품':'교환' }}
            </span>
          </div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">신청일</div>
          <div style="font-weight:600;color:#111;white-space:nowrap;">{{ (form.requestDate || '').replace('T',' ').slice(0,10) || '-' }}</div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;">
          <div style="color:#94a3b8;margin-bottom:2px;">상태</div>
          <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;"
            :style="(form.claimStatusCd||'').includes('COMPLT')?'background:#dcfce7;color:#15803d':(form.claimStatusCd||'').includes('CANCEL')?'background:#fee2e2;color:#b91c1c':'background:#fef9c3;color:#92400e'">
            {{ {'REQUEST':'접수','PROCESS':'처리중','COMPLT':'완료','CANCEL':'취소'}[form.claimStatusCd] || form.claimStatusCd || '-' }}
          </span>
        </div>
      </div>
      <!-- ② 클레임 전환 선택바 -->
      <div v-if="dtlCalcDialog.orderClaims.length >= 1" style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:11px;">
        <span style="color:#6b7280;white-space:nowrap;">이 주문의 클레임</span>
        <span style="font-weight:700;color:#1d4ed8;">{{ dtlCalcDialog.orderClaims.length }}건</span>
        <select :value="dtlCalcDialog.data.claim.claimId || dtlCalcDialog.data.claimId" @change="handleDtlCalcSwitch($event.target.value)" :disabled="dtlCalcDialog.switchLoading"
          style="flex:1;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;">
          <option v-for="c in dtlCalcDialog.orderClaims" :key="c.claimId" :value="c.claimId">
            {{ c.claimId }} — {{ c.claimTypeCd==='CANCEL'?'취소':c.claimTypeCd==='RETURN'?'반품':'교환' }} / {{ c.claimStatusCd==='REQUEST'?'접수':c.claimStatusCd==='PROCESS'?'처리중':c.claimStatusCd==='COMPLT'?'완료':c.claimStatusCd==='CANCEL'?'취소':c.claimStatusCd }}
          </option>
        </select>
        <span v-if="dtlCalcDialog.switchLoading" style="color:#94a3b8;">⏳</span>
      </div>
      <!-- ③ 상품 정보 카드 (3열: 현재 주문상품 정보 | 클레임 신청 후 (환불 예정) | 최종 정보) -->
      <div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="padding:8px 12px;background:#f1f5f9;font-size:11px;font-weight:800;color:#374151;border-bottom:1px solid #e2e8f0;">🛍 상품 정보</div>
        <div style="padding:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:start;">
        <!-- 1열: 현재 주문상품 정보 -->
        <div style="border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="padding:7px 10px;background:#f8fafc;font-size:11px;font-weight:700;color:#374151;border-bottom:1px solid #e2e8f0;">🛒 현재 주문상품 정보</div>
          <div style="padding:10px 12px;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">
              <thead><tr style="background:#f8fafc;">
                <th style="padding:4px 6px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">상품명</th>
                <th style="padding:4px 6px;text-align:center;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap;">수량</th>
                <th style="padding:4px 6px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap;">금액</th>
              </tr></thead>
              <tbody>
                <tr v-for="(it, i) in (dtlCalcDialog.data.order.orderItems || dtlCalcDialog.data.claim.claimItems || [])" :key="i">
                  <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</td>
                  <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:center;">{{ it.orderQty || it.order_qty || it.claimQty || 1 }}</td>
                  <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:monospace;">{{ ((it.itemAmt || it.item_amt || (it.salePrice || it.sale_price || 0) * (it.orderQty || it.order_qty || 1)) || 0).toLocaleString() }}원</td>
                </tr>
                <tr v-if="!(dtlCalcDialog.data.order.orderItems || dtlCalcDialog.data.claim.claimItems || []).length">
                  <td colspan="3" style="text-align:center;padding:8px;color:#94a3b8;">-</td>
                </tr>
              </tbody>
            </table>
            <div style="border-top:1px solid #e5e7eb;padding-top:6px;font-size:11px;">
              <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                <span>상품 합계</span><span style="font-family:monospace;">{{ (dtlCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.order.shippingFee || dtlCalcDialog.data.order.dlivFee" style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                <span>배송비</span><span style="font-family:monospace;">{{ (dtlCalcDialog.data.order.shippingFee || dtlCalcDialog.data.order.dlivFee || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.order.couponDiscntAmt || dtlCalcDialog.data.order.couponDiscAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                <span>쿠폰 할인</span><span style="font-family:monospace;">- {{ (dtlCalcDialog.data.order.couponDiscntAmt || dtlCalcDialog.data.order.couponDiscAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                <span>적립금 사용</span><span style="font-family:monospace;">- {{ (dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.order.cacheUsedAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                <span>충전금 사용</span><span style="font-family:monospace;">- {{ (dtlCalcDialog.data.order.cacheUsedAmt || 0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:5px 0 1px;font-weight:800;border-top:1px solid #e2e8f0;margin-top:3px;">
                <span>실 결제액</span>
                <span style="font-family:monospace;color:#1d4ed8;">{{ (dtlCalcDialog.data.order.payAmt || dtlCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 2열: 클레임 신청 후 (환불 예정) -->
        <div style="border-radius:8px;border:1px solid #bbf7d0;overflow:hidden;">
          <div style="padding:7px 10px;background:#f0fdf4;font-size:11px;font-weight:700;color:#14532d;border-bottom:1px solid #bbf7d0;">♻️ 클레임 신청 후 (환불 예정)</div>
          <div style="padding:10px 12px;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">
              <thead><tr style="background:#f0fdf4;">
                <th style="padding:4px 6px;text-align:left;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;">상품명</th>
                <th style="padding:4px 6px;text-align:center;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;white-space:nowrap;">수량</th>
                <th style="padding:4px 6px;text-align:right;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;white-space:nowrap;">항목금액</th>
              </tr></thead>
              <tbody>
                <tr v-for="(it, i) in (dtlCalcDialog.data.claim.claimItems || [])" :key="i">
                  <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" :title="it.prodNm">{{ it.prodNm || '-' }}</td>
                  <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;text-align:center;">{{ it.claimQty || 1 }}</td>
                  <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;text-align:right;font-family:monospace;">{{ (it.itemAmt || 0).toLocaleString() }}원</td>
                </tr>
                <tr v-if="!(dtlCalcDialog.data.claim.claimItems || []).length">
                  <td colspan="3" style="text-align:center;padding:8px;color:#94a3b8;">항목 없음</td>
                </tr>
              </tbody>
            </table>
            <div style="border-top:1px solid #bbf7d0;padding-top:6px;font-size:11px;">
              <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                <span>클레임 항목 금액</span><span style="font-family:monospace;">{{ (dtlCalcDialog.data.calc.itemAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.calc.dlivFeeRefund > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#059669;">
                <span>배송비 환불 (전체취소)</span><span style="font-family:monospace;">+ {{ dtlCalcDialog.data.calc.dlivFeeRefund.toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.calc.couponDiscAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                <span>쿠폰 차감 (비례)</span><span style="font-family:monospace;">- {{ dtlCalcDialog.data.calc.couponDiscAmt.toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.calc.saveUsedAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                <span>적립금 차감 (비례)</span><span style="font-family:monospace;">- {{ dtlCalcDialog.data.calc.saveUsedAmt.toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.calc.cacheUsedAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                <span>충전금 차감 (비례)</span><span style="font-family:monospace;">- {{ dtlCalcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:5px 0 1px;font-size:13px;font-weight:800;border-top:1px solid #bbf7d0;margin-top:3px;">
                <span>환불 예정액</span>
                <span style="font-family:monospace;color:#059669;">{{ (dtlCalcDialog.data.calc.refundBase || 0).toLocaleString() }}원</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 3열: 최종 정보 -->
        <div style="border-radius:8px;border:1px solid #a5b4fc;overflow:hidden;">
          <div style="padding:7px 10px;background:#eef2ff;font-size:11px;font-weight:700;color:#3730a3;border-bottom:1px solid #a5b4fc;">✅ 최종 정보</div>
          <div style="padding:10px 12px;font-size:11px;">
            <div style="font-size:10px;font-weight:700;color:#4f46e5;margin-bottom:4px;">유지되는 주문상품</div>
            <div style="background:#f5f3ff;border-radius:6px;padding:6px 8px;margin-bottom:8px;">
              <template v-if="(dtlCalcDialog.data.order.orderItems || []).length > (dtlCalcDialog.data.claim.claimItems || []).length">
                <div v-for="(it, i) in (dtlCalcDialog.data.order.orderItems || [])" :key="i"
                  style="display:flex;justify-content:space-between;padding:2px 0;color:#374151;">
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</span>
                  <span style="font-family:monospace;white-space:nowrap;margin-left:4px;">{{ it.orderQty || it.order_qty || 1 }}개</span>
                </div>
              </template>
              <div v-else style="color:#94a3b8;font-size:11px;text-align:center;padding:4px 0;">전량 클레임 처리</div>
            </div>
            <div style="font-size:10px;font-weight:700;color:#4f46e5;margin-bottom:4px;">최종 금액 요약</div>
            <div style="display:flex;flex-direction:column;gap:3px;">
              <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                <span>원 결제액</span>
                <span style="font-family:monospace;">{{ (dtlCalcDialog.data.order.payAmt || dtlCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:2px 0;color:#059669;">
                <span>환불 예정액</span>
                <span style="font-family:monospace;font-weight:700;">- {{ (dtlCalcDialog.data.calc.refundBase || 0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:5px 0 2px;font-weight:800;border-top:1px solid #a5b4fc;margin-top:2px;">
                <span style="color:#3730a3;">최종 부담액</span>
                <span style="font-family:monospace;color:#1d4ed8;">
                  {{ ((dtlCalcDialog.data.order.payAmt || dtlCalcDialog.data.calc.orderTotalAmt || 0) - (dtlCalcDialog.data.calc.refundBase || 0)).toLocaleString() }}원
                </span>
              </div>
              <div style="margin-top:6px;padding:5px 8px;background:#e0e7ff;border-radius:6px;text-align:center;font-size:10px;color:#4338ca;font-weight:700;">
                비례율 {{ Math.round((dtlCalcDialog.data.calc.ratio || 0) * 100) }}% 적용
              </div>
            </div>
          </div>
        </div>
        </div><!-- /grid -->
      </div><!-- /상품 정보 카드 -->
      <!-- ③ 결제 정보 카드 (3열: 결제 상세 | 환불 예정 결제수단 | 최종 결제 요약) -->
      <div style="margin-top:12px;border-radius:10px;border:1px solid #bfdbfe;overflow:hidden;">
        <div style="padding:8px 12px;background:#eff6ff;font-size:11px;font-weight:800;color:#1e40af;border-bottom:1px solid #bfdbfe;">💳 결제 정보</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;">
          <!-- 결제 상세 -->
          <div style="padding:10px 14px;border-right:1px solid #bfdbfe;">
            <div style="font-size:10px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">📌 결제 상세</div>
            <template v-if="(dtlCalcDialog.data.order.orderPays || []).length">
              <div v-for="(pay, pi) in (dtlCalcDialog.data.order.orderPays || [])" :key="pi"
                style="font-size:11px;padding:5px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #dbeafe;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#374151;font-weight:700;">{{ pay.payMethodCdNm || pay.payMethodCd || '-' }}</span>
                  <span style="font-family:monospace;color:#1d4ed8;font-weight:700;">{{ (pay.payAmt || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:3px;color:#94a3b8;font-size:10px;">
                  <span>{{ pay.payStatusCdNm || pay.payStatusCd || '' }}</span>
                  <span>{{ (pay.payDate || '').replace('T',' ').slice(0,16) }}</span>
                  <span v-if="pay.cardNo">카드 {{ pay.cardNo }}</span>
                  <span v-if="pay.pgTransactionId" style="font-family:monospace;">PG {{ pay.pgTransactionId }}</span>
                </div>
              </div>
            </template>
            <div v-else style="font-size:11px;color:#94a3b8;padding:6px 8px;background:#f8fafc;border-radius:6px;text-align:center;">결제 데이터 없음</div>
          </div>
          <!-- 환불 예정 결제수단 -->
          <div style="padding:10px 14px;border-right:1px solid #bfdbfe;">
            <div style="font-size:10px;font-weight:700;color:#059669;margin-bottom:6px;">♻️ 환불 예정 결제수단</div>
            <template v-if="(dtlCalcDialog.data.order.orderPays || []).length">
              <div v-for="(pay, pi) in (dtlCalcDialog.data.order.orderPays || [])" :key="pi"
                style="font-size:11px;padding:5px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#374151;font-weight:700;">{{ pay.payMethodCdNm || pay.payMethodCd || '-' }}</span>
                  <span style="font-family:monospace;color:#059669;font-weight:700;">
                    {{ Math.round((pay.payAmt || 0) * (dtlCalcDialog.data.calc.ratio || 0)).toLocaleString() }}원 예정
                  </span>
                </div>
                <div style="font-size:10px;color:#6b9b7a;margin-top:2px;">
                  원결제 {{ (pay.payAmt || 0).toLocaleString() }}원의 {{ Math.round((dtlCalcDialog.data.calc.ratio || 0) * 100) }}%
                </div>
              </div>
            </template>
            <div v-else style="font-size:11px;color:#94a3b8;padding:6px 8px;background:#f0fdf4;border-radius:6px;text-align:center;">결제 데이터 없음</div>
          </div>
          <!-- 최종 결제 요약 -->
          <div style="padding:10px 14px;background:#f8faff;">
            <div style="font-size:10px;font-weight:700;color:#6366f1;margin-bottom:6px;">✅ 최종 결제 요약</div>
            <div style="font-size:11px;display:flex;flex-direction:column;gap:4px;">
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#6b7280;">
                <span>원 결제액</span>
                <span style="font-family:monospace;">{{ (dtlCalcDialog.data.order.payAmt || dtlCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#059669;">
                <span>환불 예정액</span>
                <span style="font-family:monospace;font-weight:700;">{{ (dtlCalcDialog.data.calc.refundBase || 0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid #e2e8f0;margin-top:2px;font-weight:800;">
                <span style="color:#374151;">최종 부담액</span>
                <span style="font-family:monospace;color:#1d4ed8;">
                  {{ ((dtlCalcDialog.data.order.payAmt || dtlCalcDialog.data.calc.orderTotalAmt || 0) - (dtlCalcDialog.data.calc.refundBase || 0)).toLocaleString() }}원
                </span>
              </div>
              <div style="margin-top:6px;padding:5px 8px;background:#e0e7ff;border-radius:6px;text-align:center;font-size:10px;color:#4338ca;font-weight:700;">
                비례율 {{ Math.round((dtlCalcDialog.data.calc.ratio || 0) * 100) }}% 적용
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- ④ 프로모션 정보 카드 (3열: 사용된 | 복구되는 | 최종 프로모션 현황) -->
      <div style="margin-top:12px;border-radius:10px;border:1px solid #e9d5ff;overflow:hidden;">
        <div style="padding:8px 12px;background:#f5f3ff;font-size:11px;font-weight:800;color:#6d28d9;border-bottom:1px solid #e9d5ff;">🎁 프로모션 정보</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;">
          <!-- 사용된 프로모션 -->
          <div style="padding:10px 14px;border-right:1px solid #e9d5ff;">
            <div style="font-size:10px;font-weight:700;color:#7c3aed;margin-bottom:8px;">📌 사용된 프로모션 (주문 시)</div>
            <div v-if="!(dtlCalcDialog.data.order.couponDiscntAmt || dtlCalcDialog.data.order.couponDiscAmt) &amp;&amp; !(dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt) &amp;&amp; !dtlCalcDialog.data.order.cacheUsedAmt"
              style="font-size:11px;color:#94a3b8;padding:4px 0;">사용된 프로모션 없음</div>
            <template v-else>
              <div v-if="dtlCalcDialog.data.order.couponDiscntAmt || dtlCalcDialog.data.order.couponDiscAmt"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <span style="color:#7c3aed;font-weight:700;">🎟 쿠폰 할인</span>
                <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (dtlCalcDialog.data.order.couponDiscntAmt || dtlCalcDialog.data.order.couponDiscAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <span style="color:#7c3aed;font-weight:700;">⭐ 적립금 사용</span>
                <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.order.cacheUsedAmt"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <span style="color:#7c3aed;font-weight:700;">💰 충전금 사용</span>
                <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (dtlCalcDialog.data.order.cacheUsedAmt || 0).toLocaleString() }}원</span>
              </div>
            </template>
          </div>
          <!-- 복구되는 프로모션 -->
          <div style="padding:10px 14px;border-right:1px solid #e9d5ff;">
            <div style="font-size:10px;font-weight:700;color:#059669;margin-bottom:8px;">♻️ 복구되는 프로모션 (클레임 완료 후)</div>
            <div v-if="!(dtlCalcDialog.data.calc.couponDiscAmt > 0) &amp;&amp; !(dtlCalcDialog.data.calc.saveUsedAmt > 0) &amp;&amp; !(dtlCalcDialog.data.calc.cacheUsedAmt > 0)"
              style="font-size:11px;color:#94a3b8;padding:4px 0;">복구되는 프로모션 없음</div>
            <template v-else>
              <div v-if="dtlCalcDialog.data.calc.couponDiscAmt > 0"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                <span style="color:#059669;font-weight:700;">🎟 쿠폰</span>
                <span style="background:#ffedd5;color:#c2410c;padding:1px 8px;border-radius:8px;font-size:10px;font-weight:700;">재발급 필요</span>
              </div>
              <div v-if="dtlCalcDialog.data.calc.saveUsedAmt > 0"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                <span style="color:#059669;font-weight:700;">⭐ 적립금 복구</span>
                <span style="font-family:monospace;color:#059669;font-weight:700;">+{{ dtlCalcDialog.data.calc.saveUsedAmt.toLocaleString() }}원</span>
              </div>
              <div v-if="dtlCalcDialog.data.calc.cacheUsedAmt > 0"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                <span style="color:#059669;font-weight:700;">💰 충전금 복구</span>
                <span style="font-family:monospace;color:#1d4ed8;font-weight:700;">+{{ dtlCalcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원</span>
              </div>
            </template>
          </div>
          <!-- 최종 프로모션 현황 -->
          <div style="padding:10px 14px;background:#faf5ff;">
            <div style="font-size:10px;font-weight:700;color:#6d28d9;margin-bottom:8px;">✅ 최종 프로모션 현황</div>
            <div style="font-size:11px;display:flex;flex-direction:column;gap:4px;">
              <!-- 쿠폰 최종 -->
              <div v-if="dtlCalcDialog.data.order.couponDiscntAmt || dtlCalcDialog.data.order.couponDiscAmt"
                style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#6b7280;">🎟 쿠폰 잔여</span>
                  <span v-if="dtlCalcDialog.data.calc.couponDiscAmt > 0" style="background:#ffedd5;color:#c2410c;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;">재발급 필요</span>
                  <span v-else style="color:#94a3b8;font-size:10px;">해당없음</span>
                </div>
              </div>
              <!-- 적립금 최종 -->
              <div v-if="dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt"
                style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <div style="display:flex;justify-content:space-between;color:#6b7280;">
                  <span>⭐ 적립금</span>
                  <div style="text-align:right;">
                    <div style="color:#dc2626;">사용 -{{ (dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt || 0).toLocaleString() }}원</div>
                    <div v-if="dtlCalcDialog.data.calc.saveUsedAmt > 0" style="color:#059669;">복구 +{{ dtlCalcDialog.data.calc.saveUsedAmt.toLocaleString() }}원</div>
                    <div style="font-weight:700;color:#374151;border-top:1px solid #e9d5ff;margin-top:2px;padding-top:2px;">
                      순차감 {{ ((dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt || 0) - (dtlCalcDialog.data.calc.saveUsedAmt || 0)).toLocaleString() }}원
                    </div>
                  </div>
                </div>
              </div>
              <!-- 충전금 최종 -->
              <div v-if="dtlCalcDialog.data.order.cacheUsedAmt"
                style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <div style="display:flex;justify-content:space-between;color:#6b7280;">
                  <span>💰 충전금</span>
                  <div style="text-align:right;">
                    <div style="color:#dc2626;">사용 -{{ (dtlCalcDialog.data.order.cacheUsedAmt || 0).toLocaleString() }}원</div>
                    <div v-if="dtlCalcDialog.data.calc.cacheUsedAmt > 0" style="color:#059669;">복구 +{{ dtlCalcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원</div>
                    <div style="font-weight:700;color:#374151;border-top:1px solid #e9d5ff;margin-top:2px;padding-top:2px;">
                      순차감 {{ ((dtlCalcDialog.data.order.cacheUsedAmt || 0) - (dtlCalcDialog.data.calc.cacheUsedAmt || 0)).toLocaleString() }}원
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!(dtlCalcDialog.data.order.couponDiscntAmt || dtlCalcDialog.data.order.couponDiscAmt) &amp;&amp; !(dtlCalcDialog.data.order.saveUseAmt || dtlCalcDialog.data.order.saveUsedAmt) &amp;&amp; !dtlCalcDialog.data.order.cacheUsedAmt"
                style="font-size:11px;color:#94a3b8;padding:4px 0;">프로모션 없음</div>
            </div>
          </div>
        </div>
      </div>
      <!-- ③ 상세 사유 (있을 때만) -->
      <div v-if="form.reasonDetail"
        style="margin-top:10px;padding:8px 12px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb;font-size:11px;">
        <span style="color:#9ca3af;margin-right:8px;">상세 사유</span>
        <span style="color:#374151;">{{ form.reasonDetail }}</span>
      </div>
      <!-- ④ 진행 이력 타임라인 -->
      <div v-if="(dtlCalcDialog.data.statusHist || []).length"
        style="margin-top:10px;padding:10px 14px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="font-size:10px;color:#6b7280;font-weight:700;margin-bottom:10px;">📋 진행 이력</div>
        <div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:4px;">
          <template v-for="(h, i) in (dtlCalcDialog.data.statusHist || [])" :key="i">
            <div style="display:flex;flex-direction:column;align-items:center;min-width:90px;max-width:110px;">
              <div style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;white-space:nowrap;margin-bottom:4px;"
                :style="(h.claimStatusCd||'').indexOf('COMPLT')>=0?'background:#dcfce7;color:#15803d':(h.claimStatusCd||'').indexOf('CANCEL')>=0?'background:#fee2e2;color:#b91c1c':'background:#dbeafe;color:#1d4ed8'">
                {{ {'REQUEST':'접수','RECEIPT':'접수','PROCESS':'처리중','INSPECT':'검수중','COMPLT':'완료','CANCEL':'취소','REJECT':'반려','HOLD':'보류'}[h.claimStatusCd] || h.claimStatusCd }}
              </div>
              <div style="font-size:9px;color:#9ca3af;text-align:center;">{{ (h.chgDate||'').replace('T',' ').slice(0,16) }}</div>
              <div v-if="h.chgUserId" style="font-size:9px;color:#cbd5e1;text-align:center;margin-top:1px;">{{ h.chgUserId }}</div>
            </div>
            <div v-if="i < (dtlCalcDialog.data.statusHist||[]).length - 1"
              style="flex-shrink:0;padding:0 4px;color:#d1d5db;font-size:14px;margin-top:6px;">›</div>
          </template>
        </div>
      </div>
      <!-- ⑤ 안내 -->
      <div style="margin-top:8px;font-size:10px;color:#9ca3af;padding:5px 10px;background:#f9fafb;border-radius:6px;border-left:3px solid #e5e7eb;">
        ※ 실제 환불액은 결제 수단별 환불 정책에 따라 달라질 수 있습니다. 비례율 {{ Math.round(dtlCalcDialog.data.calc.ratio * 100) }}% 적용
      </div>
    </template>
  </template>
</bo-modal>
`
};
