/* ShopJoy – components/modals/BoModals.js
   BO(Back Office, 관리자) 전용 모달 모음. bo.html 에서만 로드.
   FO 모달은 components/modals/FoModals.js 참조.

   ───────────────────────────────────────────────────────────────────────
   정의된 컴포넌트 (36개) — 태그는 kebab-case (예: <site-select-modal>)
   ※ 모든 모달의 template 최상위는 <bo-modal> 사용 (BoAreaComp.js)

   [인증 모달] — boApp.js 로그인/마이 화면용. 상태/액션은 parent(boApp.js) 소유, 모달은 dumb-view
     AuthLoginModal         — 로그인 / 회원가입 (loginModal/loginForm/regForm props, do-login/do-register emit)
     AuthPwChangeModal      — 비밀번호 변경 (pwForm props, save emit)
     AuthUserPickModal      — 사용자 선택 로그인(개발용) (userPickModal props, pick emit)
     AuthProfileModal       — 프로필 (profileForm/profileImg props, save/img-change/img-remove emit)

   [선택/피커 모달]
     RowPickModal           — 위젯 행(row) 선택

   [상품 관련 모달]
                              사용: PdCategoryProdMng(카테고리 상품 추가)
                              props: show, title, excludeIds, uiNm, modalName, onCallback
                              콜백 payload: 선택한 상품 row 객체 (prodId / prodNm / salePrice 등)
                              사용: PdCategoryMng(상위 카테고리 변경)
                              props: show, categories, excludeId, modalName, onCallback
                              콜백 payload: 선택한 category row (null = 최상위)
     PdReviewStatusModal    — 리뷰 상태 변경 사유 입력
                              사용: PdReviewMng(상태 변경 확인)
                              props: show, reviewTitle, currentStatus, newStatus, statusLabel, badgeFn, modalName, onCallback
                              콜백 payload: { reason } — 사유 입력 후 저장 시, null = 취소

   [트리 모달]

   [템플릿]
     TemplatePreviewModal   — 템플릿 미리보기
     TemplateSendModal      — 템플릿 발송

   [전시 미리보기]
     DispPreviewModal       — 전시 미리보기
     DispUiModal            — 전시 UI 미리보기

   [참조/공통코드]
     BoRefModal             — 회원/상품/주문/클레임/쿠폰 참조 상세 (showRefModal 헬퍼)

   (재귀 노드: PathPickTreeNode — PathPickModal 내부 + 직접 사용 가능)
                BoCodeGrpTreeNode — BoCodeGrpModal 내부에서 사용)
   ───────────────────────────────────────────────────────────────────────

   ───────────────────────────────────────────────────────────────────────
   [공통 props: reloadTrigger]
   ───────────────────────────────────────────────────────────────────────
   목적: 모달이 열려있는 상태에서 부모가 외부 변화에 따라
         "지금 다시 조회하라"는 신호를 보내고 싶을 때 사용한다.
         (모달이 keep-alive 되거나, 재마운트 없이 prop만 바뀔 때
          onMounted 가 다시 호출되지 않으므로 별도 트리거가 필요)

   동작: 모달 내부에서 watch(() => props.reloadTrigger, ...) 로 변화를
         감지해 fetch 함수(handleSearchList 등)를 자동 호출한다.

   사용법 (부모):
     const modal = reactive({ show: false, kind: '', reloadTrigger: 0 });

     // openA
     const openA = () => { modal.kind = 'a'; modal.reloadTrigger++; modal.show = true; };

     // openB
     const openB = () => { modal.kind = 'b'; modal.reloadTrigger++; modal.show = true; };

     // refresh
     const refresh = () => { modal.reloadTrigger++; };

   템플릿:
     <some-modal v-if="modal.show"
                 :kind="modal.kind"
                 :reload-trigger="modal.reloadTrigger"
                 @select="..." @close="modal.show=false" />

   주의:
     - 0 → 1 같이 값이 바뀌어야 watch 가 발동한다. ++ 사용 권장.
     - 처음 마운트(onMounted)에서도 fetch 가 한 번 실행되므로,
       reloadTrigger 는 부모가 "다시" 조회시키고 싶을 때만 증가시킨다.
   ───────────────────────────────────────────────────────────────────────
*/

/* ── 공통 모달 ESC 키 핸들러 ───────────────────────────────────
 * 모달 디자인 CSS 는 assets/css/boGlobalStyle{01,02,03}.css 로 이동(2026-05-28).
 * 이 블록에는 키 이벤트(JS) 만 남긴다. */
(() => {
  if (window.__shopjoy_modal_esc_attached__) return;
  window.__shopjoy_modal_esc_attached__ = true;
  /* ESC 키로 최상단 모달 닫기 — overlay 클릭과 동일 효과 */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.click();
  });
})();

/* ══════════════════════════════════════════════════════
   어드민 공통필터 팝업 선택 모달 (5종)
   Props: dispDataset  Emits: select(item), close
   ══════════════════════════════════════════════════════ */

window.TemplatePreviewModal = {
  name: 'TemplatePreviewModal',
  inheritAttrs: false,
  props: {
    tmpl:          { type: Object,    default: () => ({}) },              // 템플릿 데이터
    sampleParams:  { type: String,    default: '{}' },                    // 샘플 파라미터 (JSON 문자열)
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ TemplatePreviewModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (해당 모달은 선택 동작 없음) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ TemplatePreviewModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const cfParams = computed(() => {
      try { return JSON.parse(props.sampleParams || '{}'); }
      catch { return {}; }
    });

    const cfIsHtml = computed(() =>
      ['메일템플릿', 'MMS템플릿'].includes(props.tmpl?.templateType)
    );

    /* 텍스트에 파라미터 치환 → HTML 반환 (미치환 변수는 빨간색 표시) */
    const handleApplyAndRender = (text) => {
      if (!text) return '';
      let base = text;
      if (!cfIsHtml.value) {
        /* 텍스트 계열: HTML 이스케이프 후 파라미터 치환 */
        base = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return base.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        cfParams.value[k] !== undefined
          ? `<span style="background:#fff3cd;color:#856404;border-radius:3px;padding:0 2px;font-weight:600;">${String(cfParams.value[k])}</span>`
          : `<span style="color:#dc3545;font-weight:600;">{{${k}}}</span>`
      );
    };

    const cfRenderedSubject = computed(() => handleApplyAndRender(props.tmpl?.subject || ''));
    const cfRenderedContent = computed(() => handleApplyAndRender(props.tmpl?.content || ''));

    const cfTypeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const cfParamList = computed(() => Object.entries(cfParams.value).map(([k, v]) => ({ k, v })));

    /* setup에서 tmpl을 반환해 템플릿에서 직접 접근 가능하게 */
    const fmtKey = k => '{{' + k + '}}';
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    return {
      cfSiteNm, tmpl: computed(() => props.tmpl),                            // 데이터
      cfRenderedSubject, cfRenderedContent, cfIsHtml, cfTypeBadge,           // computed
      cfParamList, fmtKey,                                                   // computed/헬퍼
      handleBtnAction, handleSelectAction,                                   // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="700px" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      📄 템플릿 미리보기
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <!-- 템플릿 기본정보 -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:#f8f9fa;border-radius:8px;">
    <span class="badge" :class="cfTypeBadge">
      {{ tmpl?.templateType }}
    </span>
    <span style="font-weight:700;font-size:14px;color:#1a1a2e;">
      {{ tmpl?.templateNm }}
    </span>
  </div>
  <!-- 파라미터 샘플 뱃지 -->
  <div v-if="cfParamList.length" style="margin-bottom:12px;">
    <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">
      파라미터 샘플값
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">
      <span v-for="p in cfParamList" :key="p.k"
        style="display:inline-flex;align-items:center;gap:3px;font-size:11px;background:#f0f4ff;border:1px solid #d0d9ff;border-radius:4px;padding:2px 8px;color:#2563eb;">
        <b>
          {{ fmtKey(p.k) }}
        </b>
        <span style="color:#aaa;margin:0 2px;">
          =
        </span>
        <span style="color:#856404;background:#fff3cd;border-radius:2px;padding:0 3px;">
          {{ p.v }}
        </span>
      </span>
    </div>
  </div>
  <div v-else style="margin-bottom:12px;font-size:12px;color:#aaa;">
    파라미터 샘플값 없음
  </div>
  <!-- 제목 -->
  <div v-if="tmpl?.subject" style="margin-bottom:12px;">
    <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:4px;">
      제목 (Subject)
    </div>
    <div style="padding:9px 13px;background:#fff;border:1px solid #e8e8e8;border-radius:7px;font-size:13px;color:#333;"
      v-html="cfRenderedSubject">
    </div>
  </div>
  <!-- 내용 미리보기 -->
  <div>
    <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">
      내용 미리보기
    </div>
    <!-- HTML 타입 -->
    <div v-if="cfIsHtml"
      style="padding:18px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;min-height:120px;max-height:380px;overflow-y:auto;font-size:13px;line-height:1.8;"
      v-html="cfRenderedContent">
    </div>
    <!-- 텍스트 타입 -->
    <pre v-else
      style="padding:14px 16px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;min-height:80px;max-height:280px;overflow-y:auto;font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;margin:0;color:#333;"
      v-html="cfRenderedContent"></pre>
    </div>
    <div style="margin-top:18px;display:flex;justify-content:flex-end;">
      <button class="btn btn_close" @click="handleBtnAction('modal-close')">
        닫기
      </button>
    </div>
  </bo-modal>
`,
};

/* ── 템플릿 발송하기 모달 ── */
window.TemplateSendModal = {
  name: 'TemplateSendModal',
  inheritAttrs: false,
  props: {
    tmpl:          { type: Object,    default: () => ({}) },              // 템플릿 데이터
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    showToast:     { type: Function,  default: () => {} },                // 토스트 알림
    showConfirm:   { type: Function,  default: () => Promise.resolve(true) },  // 확인 모달
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    const searchParam = reactive({ type: 'member', searchValue: '' });
    const selected = reactive([]);

    /* getId */
    const getId = (item) => item.memberId || item.userId || item.boUserId;

    /* ── API 데이터 ── */
    const allDepts = reactive([]);
    const allMembers = reactive([]);
    const allBoUsers = reactive([]);

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const [deptRes, memberRes, userRes] = await Promise.all([
          boApiSvc.syDept.getList({ pageSize: 10000 }, '부서관리', '목록조회'),
          boApiSvc.mbMember.getList({ pageSize: 10000 }, '회원관리', '목록조회'),
          boApiSvc.syUser.getList({ pageSize: 10000 }, '사용자관리', '목록조회'),
        ]);
        allDepts.splice(0, allDepts.length, ...(deptRes.data?.data || []));
        allMembers.splice(0, allMembers.length, ...(memberRes.data?.data || []));
        allBoUsers.splice(0, allBoUsers.length, ...(userRes.data?.data || []));
      } catch (e) {}
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* ── 부서 트리 (관리자 탭) ── */
    const uiState = reactive({ selectedDeptId: null, selectedGrade: null, deptSearchValue: '' });
    const selectedDeptId = computed(() => uiState.selectedDeptId);
    const selectedGrade = computed(() => uiState.selectedGrade);

    /* fnBuildDeptTree */
    const fnBuildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentDeptId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: fnBuildDeptTree(items, d.deptId, depth + 1) }));

    /* fnFlattenDept */
    const fnFlattenDept = (nodes, result = []) => { nodes.forEach(n => { result.push(n); fnFlattenDept(n._kids, result); }); return result; };
    const cfFlatDeptTree = computed(() => {
      const k = uiState.deptSearchValue.trim().toLowerCase();
      const base = k ? allDepts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(k)) : allDepts;
      return fnFlattenDept(fnBuildDeptTree(base, null, 1));
    });

    /* fnGetDescDeptIds */
    const fnGetDescDeptIds = (deptId) => {
      const ids = new Set();
      const queue = [deptId];
      while (queue.length) {
        const id = queue.shift();
        ids.add(id);
        allDepts.filter(x => x.parentDeptId === id).forEach(c => queue.push(c.deptId));
      }
      return ids;
    };

    /* ── 등급 필터 (회원 탭) ── */
    const MEMBER_GRADES = ['VIP', '우수', '일반'];

    /* ── 목록 ── */
    const cfMemberList = computed(() => {
      const k = searchParam.searchValue.trim().toLowerCase();
      let list = allMembers;
      if (selectedGrade.value) list = list.filter(m => m.memberGrade === selectedGrade.value || m.grade === selectedGrade.value);
      if (k) list = list.filter(m => (m.memberNm || '').toLowerCase().includes(k) || (m.memberEmail || m.email || '').toLowerCase().includes(k) || String(m.memberId || m.userId || '').includes(k));
      return list;
    });
    const cfUserList = computed(() => {
      const k = searchParam.searchValue.trim().toLowerCase();
      let list = allBoUsers;
      if (selectedDeptId.value !== null) {
        const ids = fnGetDescDeptIds(selectedDeptId.value);
        list = list.filter(u => ids.has(u.deptId));
      }
      if (k) list = list.filter(u => (u.userNm || u.name || '').toLowerCase().includes(k) || (u.userEmail || u.email || '').toLowerCase().includes(k) || String(u.userId || u.boUserId || '').includes(k));
      return list;
    });
    const cfList = computed(() => searchParam.type === 'member' ? cfMemberList.value : cfUserList.value);

    /* fnIsSelected */
    const fnIsSelected = (item) => selected.includes(getId(item));

    /* handleToggleSelect */
    const handleToggleSelect = (item) => {
      const id = getId(item);
      const idx = selected.indexOf(id);
      if (idx === -1) selected.push(id); else selected.splice(idx, 1);
    };
    const cfAllChecked = computed(() => cfList.value.length > 0 && cfList.value.every(x => selected.includes(getId(x))));

    /* handleToggleAll */
    const handleToggleAll = () => {
      if (cfAllChecked.value) { selected.splice(0); }
      else { cfList.value.forEach(x => { const id = getId(x); if (!selected.includes(id)) selected.push(id); }); }
    };

    watch(() => searchParam.type, () => { selected.splice(0); searchParam.searchValue = ''; uiState.selectedDeptId = null; uiState.selectedGrade = null; });

    const cfTypeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[props.tmpl?.templateType] || 'badge-gray'));

    /* fnGradeBadgeColor */
    const fnGradeBadgeColor = g => ({ 'VIP': '#f59e0b', '우수': '#2563eb', '일반': '#6b7280' }[g] || '#6b7280');

    /* fnDisplayNm — 회원/관리자 공통 이름 (널 안전) */
    const fnDisplayNm = (item) => (searchParam.type === 'member'
      ? (item.memberNm || item.memberEmail || '')
      : (item.userNm || item.loginId || '')) || '';

    /* fnDisplayLogin — loginId 또는 email 보조 표기 */
    const fnDisplayLogin = (item) => (searchParam.type === 'member'
      ? (item.memberEmail || item.email || '')
      : (item.loginId || item.userEmail || '')) || '';

    /* fnDisplaySub — 두 번째 줄 보조 정보 */
    const fnDisplaySub = (item) => {
      if (searchParam.type === 'member') return item.memberEmail || item.email || item.memberPhone || '';
      const dept = (allDepts.find(d => d.deptId === item.deptId) || {}).deptNm || '';
      return [dept, item.userEmail || ''].filter(Boolean).join(' · ') || '-';
    };

    /* fnDisplayBadge — 우측 배지 텍스트 */
    const fnDisplayBadge = (item) => searchParam.type === 'member'
      ? (item.memberGrade || item.grade || '')
      : (item.userStatusCd || '');

    /* fnBadgeStyle — 배지 색상 */
    const fnBadgeStyle = (item) => {
      if (searchParam.type === 'user') {
        return item.userStatusCd === 'ACTIVE'
          ? 'background:#dcfce7;color:#16a34a;'
          : 'background:#f3f4f6;color:#9ca3af;';
      }
      const g = item.memberGrade || item.grade;
      return g === 'VIP' ? 'background:#fef3c7;color:#d97706;'
        : g === '우수' ? 'background:#dbeafe;color:#1d4ed8;'
        : 'background:#f3f4f6;color:#6b7280;';
    };

    /* handleSend */
    const handleSend = async () => {
      if (!selected.length) { props.showToast('발송할 수신자를 선택하세요.', 'info'); return; }
      const typeLabel = searchParam.type === 'member' ? '회원' : '관리자';
      const ok = await props.showConfirm('템플릿 발송',
        `[${props.tmpl?.templateNm}] 템플릿을 선택된 ${typeLabel} ${selected.length}명에게 발송하시겠습니까?`,
        { btnOk: '발송', btnCancel: '취소' });
      if (!ok) return;
      props.showToast(`${typeLabel} ${selected.length}명에게 발송 요청이 완료되었습니다.`);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ TemplateSendModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 발송
      } else if (cmd === 'modal-send') {
        return handleSend();
      // 탭 변경 (member/user)
      } else if (cmd === 'searchParam-type') {
        searchParam.type = param;
        return;
      // 전체 선택/해제 토글
      } else if (cmd === 'list-toggle-all') {
        return handleToggleAll();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ TemplateSendModal : handleSelectAction -> ', cmd, param);
      // 부서 선택
      if (cmd === 'deptTree-select') {
        uiState.selectedDeptId = param;
        return;
      // 등급 선택
      } else if (cmd === 'grade-select') {
        uiState.selectedGrade = param;
        return;
      // 수신자 토글
      } else if (cmd === 'list-toggle') {
        return handleToggleSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      cfSiteNm, searchParam, uiState, cfList, selected,                      // 데이터
      fnIsSelected, cfAllChecked, cfTypeBadge, fnGradeBadgeColor,            // 헬퍼/computed
      fnDisplayNm, fnDisplayLogin, fnDisplaySub, fnDisplayBadge, fnBadgeStyle, getId, // list 렌더 헬퍼
      selectedDeptId, selectedGrade, cfFlatDeptTree, MEMBER_GRADES,          // computed/상수
      tmpl: computed(() => props.tmpl),                                      // 템플릿 객체
      handleBtnAction, handleSelectAction,                                   // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="800px" max-height="84vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;flex-shrink:0;">
          📨 {{ tmpl?.templateNm || '발송하기' }}
        </span>
        <code v-if="tmpl?.templateCode" style="font-size:11px;color:#888;background:#efefef;padding:1px 8px;border-radius:4px;flex-shrink:0;">
          {{ tmpl.templateCode }}
        </code>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;flex-shrink:0;">
          {{ cfSiteNm }}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="selected.length" style="font-size:12px;color:#52c41a;font-weight:700;background:#f6ffed;padding:3px 10px;border-radius:20px;">
          {{ selected.length }}명 선택됨
        </span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="handleBtnAction('modal-close')">
          ✕
        </span>
      </div>
    </div>
    <!-- ── 탭 ── -->
      <div style="display:flex;border-bottom:2px solid #f0f0f0;flex-shrink:0;background:#fff;">
        <button @click="handleBtnAction('searchParam-type', 'member')"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="searchParam.type==='member'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
          👥 회원
        </button>
        <button @click="handleBtnAction('searchParam-type', 'user')"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="searchParam.type==='user'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
          👤 관리자
        </button>
      </div>
      <!-- ── 바디: 좌(필터) + 우(목록) ── -->
      <div style="display:flex;min-height:420px;max-height:60vh;overflow:hidden;">
        <!-- 좌: 필터 패널 -->
        <div style="width:200px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">
          <!-- 관리자 탭: 부서 트리 -->
          <template v-if="searchParam.type==='user'">
            <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
              <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">
                조직 / 부서
              </div>
              <div style="position:relative;">
                <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#bbb;">
                  🔍
                </span>
                <input v-model="uiState.deptSearchValue" placeholder="부서 검색"
                style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;" />
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:6px 6px;">
              <!-- 전체 루트 -->
              <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="handleSelectAction('deptTree-select', null)">
                <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedDeptId===null?'#fff':'#e8587a' }">
                  ●
                </span>
                <span style="font-size:13px;font-weight:700;flex:1;" :style="{ color: selectedDeptId===null?'#fff':'#374151' }">
                  전체
                </span>
              </div>
              <!-- 부서 트리 -->
              <div v-for="d in cfFlatDeptTree" :key="d.deptId"
              style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="handleSelectAction('deptTree-select', d.deptId)">
                <span style="flex-shrink:0;font-weight:800;"
                :style="{ marginLeft:((d._depth-1)*13)+'px', fontSize:d._depth===1?'10px':'8px',
                color:selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)] }">
                  {{ ['●','◦','·'][Math.min(d._depth-1,2)] }}
                </span>
                <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                :style="{ fontWeight:d._depth===1?'600':'400', color:selectedDeptId===d.deptId?'#fff':'#374151' }">
                  {{ d.deptNm }}
                </span>
              </div>
            </div>
          </template>
          <!-- 회원 탭: 등급 필터 -->
          <template v-else>
            <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
              <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;">
                회원 등급
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:6px 6px;">
              <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedGrade===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="handleSelectAction('grade-select', null)">
                <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedGrade===null?'#fff':'#e8587a' }">
                  ●
                </span>
                <span style="font-size:13px;font-weight:700;" :style="{ color: selectedGrade===null?'#fff':'#374151' }">
                  전체
                </span>
              </div>
              <div v-for="g in MEMBER_GRADES" :key="g"
              style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedGrade===g?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="handleSelectAction('grade-select', g)">
                <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;"
                :style="{ background: selectedGrade===g?'#fff':fnGradeBadgeColor(g) }">
                </span>
                <span style="font-size:13px;font-weight:600;" :style="{ color: selectedGrade===g?'#fff':'#374151' }">
                  {{ g }}
                </span>
              </div>
            </div>
          </template>
        </div>
        <!-- 우: 사용자 목록 -->
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
          <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
            <div style="position:relative;">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">
                🔍
              </span>
              <input v-model="searchParam.searchValue" :placeholder="searchParam.type==='member'?'이름 / 이메일 / ID 검색':'이름 / 이메일 / ID 검색'"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;" />
            </div>
          </div>
          <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
              <input type="checkbox" :checked="cfAllChecked" @change="handleBtnAction('list-toggle-all')" style="width:14px;height:14px;" />
              전체선택
            </label>
            <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
              총
              <b style="color:#374151;">
                {{ cfList.length }}
              </b>
              명
            </span>
          </div>
          <div style="flex:1;overflow-y:auto;">
            <div v-if="cfList.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
              <div style="font-size:32px;margin-bottom:8px;">
                🔍
              </div>
              검색 결과가 없습니다.
            </div>
            <div v-for="item in cfList" :key="getId(item)"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="fnIsSelected(item)?'background:#f0fff4;':''"
            @click="handleSelectAction('list-toggle', item)">
              <input type="checkbox" :checked="fnIsSelected(item)" @click.stop="handleSelectAction('list-toggle', item)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#52c41a;cursor:pointer;" />
              <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="fnIsSelected(item)?'background:#52c41a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
                {{ fnDisplayNm(item).charAt(0) || '·' }}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                  {{ fnDisplayNm(item) }}
                  <span style="font-size:11px;color:#9ca3af;font-weight:400;">
                    {{ fnDisplayLogin(item) }}
                  </span>
                </div>
                <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">
                  {{ fnDisplaySub(item) }}
                </div>
              </div>
              <span v-if="fnDisplayBadge(item)" style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="fnBadgeStyle(item)">
                {{ fnDisplayBadge(item) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- ── 푸터 ── -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
        <span style="font-size:12px;" :style="selected.length?'color:#52c41a;font-weight:600;':'color:#bbb;'">
          {{ selected.length ? selected.length+'명이 선택되었습니다.' : '목록에서 수신자를 선택하세요.' }}
        </span>
        <div style="display:flex;gap:8px;">
          <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="handleBtnAction('modal-close')">
            취소
          </button>
          <button :disabled="!selected.length"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="selected.length?'background:#52c41a;color:#fff;box-shadow:0 2px 8px rgba(82,196,26,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="handleBtnAction('modal-send')">
            📨 발송{{ selected.length?' ('+selected.length+'명)':'' }}
          </button>
        </div>
      </div>
    </div>
  </bo-modal>
`,
};

/* ── 부서 트리 선택 모달 ──────────────────────────────────
   Props: dispDataset, excludeId (선택 불가 부서 ID, 보통 자기 자신)
   Emits: select({ deptId, deptNm }), close
   ─────────────────────────────────────────────────── */
/* ── 메뉴 트리 선택 모달 ──────────────────────────────
   Props: dispDataset, excludeId
   Emits: select({ menuId, menuNm }), close
   ─────────────────────────────────────────────────── */
/* ── 권한 트리 선택 모달 ──────────────────────────────
   Props: dispDataset, excludeId
   Emits: select({ roleId, roleNm }), close
   ─────────────────────────────────────────────────── */
window.DispPreviewModal = {
  name: 'DispPreviewModal',
  inheritAttrs: false,
  props: {
    show:     { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    mode:     { type: String,  default: 'single' },   /* 'all' | 'single' */
    tabLabel: { type: String,  default: '위젯미리보기' },
    area:     { type: String,  default: '' },
    widgets:  { type: Array,   default: () => [] },
    widget:   { type: Object,  default: () => ({}) },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* mode=all: 해당 area의 활성 위젯 목록 */
    const cfAreaWidgets = computed(() =>
      props.widgets
        .filter(w => w.area === props.area && w.status === '활성')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );

    /* mode=single: form 스냅샷에 status='활성' 강제 적용하여 렌더 */
    const cfPreviewWidget = computed(() => ({ ...props.widget, status: '활성' }));

    const cfWidgetLabel = computed(() => boConsts.WIDGET_LABEL[props.widget && props.widget.widgetType] || (props.widget && props.widget.widgetType) || '');

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DispPreviewModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DispPreviewModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    return {
      cfAreaWidgets, cfPreviewWidget, cfWidgetLabel,                          // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" max-width="720px" max-height="88vh" box-pad="0" body-pad="0" :z-index="500" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:12px;height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- 헤더 -->
    <div style="padding:14px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#fafafa;">
      <div>
        <span style="font-size:14px;font-weight:700;color:#333;">
          👁 위젯미리보기
        </span>
        <span style="margin-left:8px;font-size:12px;color:#e8587a;font-weight:600;">
          {{ tabLabel }}
        </span>
        <span v-if="mode==='single' ? (cfWidgetLabel) : false" style="margin-left:6px;font-size:11px;color:#aaa;">
        ({{ cfWidgetLabel }})
      </span>
      <span v-if="mode==='all' ? (area) : false" style="margin-left:6px;font-size:11px;color:#aaa;">
      영역: {{ area }}
    </span>
  </div>
  <button @click="handleBtnAction('modal-close')"
        style="background:none;border:none;cursor:pointer;font-size:18px;color:#aaa;line-height:1;padding:2px 6px;">
    ✕
  </button>
</div>
<!-- 콘텐츠 -->
<div style="flex:1;overflow-y:auto;padding:20px;">
  <!-- mode=all: 해당 area 전체 위젯 -->
  <template v-if="mode==='all'">
    <div v-if="cfAreaWidgets.length===0"
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
      <div style="font-size:32px;margin-bottom:8px;">
        📭
      </div>
      [{{ area }}] 영역에 활성 위젯이 없습니다.
    </div>
    <div v-else style="display:flex;flex-direction:column;gap:12px;">
      <div v-for="w in cfAreaWidgets" :key="w.dispId">
        <div style="font-size:10px;color:#bbb;margin-bottom:4px;font-family:monospace;">
          #{{ w.dispId }} {{ w.name }} · 순서{{ w.sortOrder }}
        </div>
        <disp-x04-widget
              :params="{ isLoggedIn: false, userGrade: '' }"
              :disp-dataset="{ displays: [], codes: [] }"
              :disp-opt="{ showBadges: true }"
              :widget-item="w"
              />
      </div>
    </div>
  </template>
  <!-- mode=single: 현재 form 단일 위젯 -->
  <template v-else>
    <div style="font-size:10px;color:#bbb;margin-bottom:8px;font-family:monospace;">
      현재 입력값 기준 실시간 위젯미리보기
    </div>
    <!-- widgetType 없으면 DispWidget 렌더 금지 (widgetType.startsWith 오류 방지) -->
    <div v-if="cfPreviewWidget.widgetType"
          style="border:1px dashed #e0e0e0;border-radius:8px;padding:16px;background:#fafbff;">
      <disp-x04-widget
            :params="{ isLoggedIn: false, userGrade: '' }"
            :disp-dataset="{ displays: [], codes: [] }"
            :disp-opt="{ showBadges: true }"
            :widget-item="cfPreviewWidget"
            />
    </div>
    <div v-else
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
      <div style="font-size:28px;margin-bottom:8px;">
        🎨
      </div>
      행(1~5행)에서 위젯 유형을 선택하면
      <br>
      위젯미리보기가 표시됩니다.
    </div>
  </template>
</div>
<!-- 푸터 -->
<div style="padding:10px 18px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
  <button class="btn btn_close" @click="handleBtnAction('modal-close')">
    닫기
  </button>
</div>
</div>
</bo-modal>
`,
};

/* ── 전시 DispUi 모달 ──────────────────────────────────────────
   Props:
     show      (Boolean)  — 표시 여부
     params    (Object)   — { areas[], date, time, status, condition,
                              authRequired, authGrade, siteId, memberId, viewOpts }
     dispDataset (Object)   — dispDataset 객체
     title     (String)   — 모달 헤더 제목
   Emits: close, open-popup
   ── DispUiPage.js와 동일한 DispX01Ui를 모달 안에서 렌더링
      파라미터 요약 바는 DispX01Ui 내부에서 viewOpts 있을 때 표시 ── */
window.RowPickModal = {
  name: 'RowPickModal',
  inheritAttrs: false,
  props: {
    title:          { type: String,   default: '전시항목 복사' },
    reloadTrigger:  { type: Number,   default: 0 },                     // 재조회 트리거
    displays:       { type: Array,    default: () => [] },              // 전체 패널(dispDataset.displays)
    areas:          { type: Array,    default: () => [] },              // DISP_AREA codes
    excludePanelId: { type: Number,   default: null },                  // 현재 패널 제외
    modalName:      { type: String,   default: '' },                    // 모달 식별자
    onCallback:     { type: Function, default: null },                  // 통합 콜백
  },
  emits: ['close', 'pick-multi'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchType = ref('');
    const searchValue = ref('');
    const searchStatus = ref('');
    const activeStatuses = reactive([]);
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));

    /* toggleTree */
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };

    /* isTreeOpen */
    const isTreeOpen = k => treeOpen.has(k);

    /* selectTree */
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    /* areaNm */
    const areaNm = (code) => {
      const a = props.areas.find(x => x.codeValue === code);
      return a ? a.codeLabel : code;
    };

    /* 모든 위젯을 flatten (panel 정보 포함) */
    const cfAllRows = computed(() => {
      const out = [];
      (props.displays || []).forEach(p => {
        if (props.excludePanelId && p.dispId === props.excludePanelId) return;
        (p.rows || []).forEach((r, i) => {
          out.push({
            __rowId: p.dispId + '_' + i,
            __panelId: p.dispId,
            __panelName: p.name,
            __area: p.area,
            __status: p.status,
            row: r,
            sortIdx: i,
          });
        });
      });
      return out;
    });

    const cfFiltered = computed(() => cfAllRows.value.filter(o => {
      const searchVal = searchValue.value.trim().toLowerCase();
      if (searchVal) {
        const types = searchType.value || 'widgetNm,panelNm,widgetType';
        const hits = [];
        if (types.includes('widgetNm')) hits.push((o.row.widgetNm   || '').toLowerCase().includes(searchVal));
        if (types.includes('panelNm'))  hits.push((o.__panelName    || '').toLowerCase().includes(searchVal));
        if (types.includes('widgetType'))     hits.push((o.row.widgetType || '').toLowerCase().includes(searchVal));
        if (!hits.some(Boolean)) return false;
      }
      if (searchStatus.value && o.__status !== searchStatus.value) return false;
      if (selectedTreeKey.value) {
        const top = (o.__area || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }));

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.size));
      pager.pageList = cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size);
      const cur=pager.page, last=pager.pageTotalPage, s=Math.max(1,cur-2), e=Math.min(last,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };
    Vue.watch(cfFiltered, () => { pager.page = 1; fnBuildPagerNums(); }, { immediate: true });
    const cfTree = computed(() => {
      const g = {};
      cfAllRows.value.forEach(o => {
        const top = (o.__area || '(미등록)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });

    const checked = reactive(new Set());

    /* isChecked */
    const isChecked = (id) => checked.has(id);

    /* toggleCheck — reactive Set 직접 변이 (const 재할당 금지) */
    const toggleCheck = (id) => {
      if (checked.has(id)) checked.delete(id); else checked.add(id);
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(o => checked.has(o.__rowId)));

    /* toggleCheckAll */
    const toggleCheckAll = () => {
      if (cfAllChecked.value) (pager.pageList||[]).forEach(o => checked.delete(o.__rowId));
      else (pager.pageList||[]).forEach(o => checked.add(o.__rowId));
    };

    /* pickMulti */
    const pickMulti = () => {
      const picks = cfAllRows.value.filter(o => checked.has(o.__rowId));
      if (!picks.length) return;
      emit('pick-multi', picks.map(o => ({ ...o.row })));
      if (props.onCallback) props.onCallback(props.modalName, null, picks.map(o => ({ ...o.row })));
      checked.clear();
    };

    /* pickOne */
    const pickOne = (o) => {
      emit('pick-multi', [{ ...o.row }]);
      if (props.onCallback) props.onCallback(props.modalName, null, [{ ...o.row }]);
    };

    /* statusCls */
    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';

    /* wLabel */
    const wLabel = (t) => boConsts.WIDGET_LABEL[t] || t || '-';

    Vue.onMounted(() => {
      /* 상태 = 어댑터 '활성'/'비활성' 값 (구 ACTIVE_STATUS 코드그룹 미사용) */
      activeStatuses.splice(0, activeStatuses.length,
        { codeValue: '활성', codeLabel: '활성' }, { codeValue: '비활성', codeLabel: '비활성' });
    });

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ RowPickModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 다중 복사
      } else if (cmd === 'modal-pick-multi') {
        return pickMulti();
      // 전체 토글
      } else if (cmd === 'list-toggle-all') {
        return toggleCheckAll();
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        pager.page = param;
        return;
      // 페이지 크기 변경
      } else if (cmd === 'pager-size') {
        pager.size = param;
        pager.page = 1;
        return fnBuildPagerNums();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ RowPickModal : handleSelectAction -> ', cmd, param);
      // 트리 펼침 토글
      if (cmd === 'tree-toggle') {
        return toggleTree(param);
      // 트리 노드 선택
      } else if (cmd === 'tree-select') {
        return selectTree(param);
      // 행 체크 토글
      } else if (cmd === 'list-toggle') {
        return toggleCheck(param);
      // 행 복사
      } else if (cmd === 'list-pick') {
        return pickOne(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      searchType, searchValue, searchStatus, activeStatuses, pager, PAGE_SIZES,  // 데이터
      selectedTreeKey, isTreeOpen, cfTree,                                       // 트리
      statusCls, areaNm, wLabel,                                                 // 헬퍼
      checked, isChecked, cfAllChecked,                                          // 선택
      handleBtnAction, handleSelectAction,                                       // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" width="1100px" max-width="98vw" max-height="92vh"
  box-pad="0" body-pad="0" :z-index="9999" @close="handleBtnAction('modal-close')">
  <div style="background:#fafafa;border-radius:14px;display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;font-weight:700;">
        🔗 {{ title }}
      </span>
      <button @click="handleBtnAction('modal-close')" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0;opacity:.85;">
        ×
      </button>
    </div>
    <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <bo-multi-check-select
        v-model="searchType"
        :options="[
        { value: 'widgetNm', label: '위젯명' },
        { value: 'panelNm',  label: '패널명' },
        { value: 'widgetType',     label: '유형' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchValue" placeholder="검색어 입력" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchStatus" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">패널상태 전체</option>
        <option v-for="c in activeStatuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">
          사용위치 트리
        </div>
        <div @click="handleSelectAction('tree-toggle', '__root__'); handleSelectAction('tree-select', '')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>
            {{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체
          </span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">
            {{ pager.pageTotalCount }}
          </span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in cfTree" :key="node.label"
            @click="handleSelectAction('tree-select', node.label)"
            :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
            <span>
              ▸ {{ node.label }}
            </span>
            <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">
              {{ node.count }}
            </span>
          </div>
        </div>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;display:flex;justify-content:space-between;align-items:center;">
          <span>
            총
            <b>
              {{ pager.pageTotalCount }}
            </b>
            건
            <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">
              선택 {{ checked.size }}개
            </span>
          </span>
          <button v-if="checked.size" @click="handleBtnAction('modal-pick-multi')" class="btn btn-primary btn-sm" style="font-size:11px;">
            선택한 {{ checked.size }}개 일괄 복사
          </button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" :checked="cfAllChecked" @change="handleBtnAction('list-toggle-all')" />
                </th>
                <th style="width:110px;">
                  위젯 유형
                </th>
                <th>
                  전시항목 정보
                </th>
                <th style="width:160px;text-align:left;">
                  사용위치경로
                </th>
                <th style="width:90px;text-align:right;">
                  선택
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(pager.pageList||[]).length">
                <td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">
                  표시할 전시항목이 없습니다.
                </td>
              </tr>
              <tr v-for="o in pager.pageList" :key="o.__rowId"
                :style="isChecked(o.__rowId)?'background:#eef6fd;':''">
                <td style="text-align:center;vertical-align:top;padding-top:14px;">
                  <input type="checkbox" :checked="isChecked(o.__rowId)" @change="handleSelectAction('list-toggle', o.__rowId)" />
                </td>
                <td style="vertical-align:top;padding-top:12px;">
                  <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">
                    {{ wLabel(o.row.widgetType) }}
                  </span>
                </td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <span style="font-size:14px;font-weight:700;color:#222;">
                      {{ o.row.widgetNm || ('위젯 '+(o.sortIdx+1)) }}
                    </span>
                    <span class="badge" :class="statusCls(o.__status)" style="font-size:11px;margin-left:8px;">
                      {{ o.__status }}
                    </span>
                  </div>
                  <div style="font-size:11px;color:#555;line-height:1.5;">
                    <span>
                      <b style="color:#888;">
                        소속 패널:
                      </b>
                      {{ o.__panelName }} (#{{ o.__panelId }})
                    </span>
                    <span v-if="o.row.clickAction ? (o.row.clickAction !== 'none') : false" style="margin-left:10px;">
                    <b style="color:#888;">
                      클릭:
                    </b>
                    {{ o.row.clickAction }}
                  </span>
                </div>
              </td>
              <td style="vertical-align:top;padding-top:12px;">
                <span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;font-size:11px;">
                  {{ (o.__area||'').split('_')[0] || '-' }} &gt; {{ areaNm(o.__area) }}
                </span>
              </td>
              <td style="vertical-align:top;padding-top:10px;text-align:right;">
                <button @click="handleSelectAction('list-pick', o)" class="btn btn-primary btn-sm" style="font-size:11px;">
                  복사
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" style="padding:10px 16px;border-top:1px solid #f0f0f0;margin-top:0;">
        <div>
        </div>
        <div class="pager">
          <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', 1)">
            «
          </button>
          <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', pager.page-1)">
            ‹
          </button>
          <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.page===n}" @click="handleBtnAction('pager-set', n)">
            {{ n }}
          </button>
          <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.page+1)">
            ›
          </button>
          <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
            »
          </button>
        </div>
        <div class="pager-right">
          <select class="size-select" :value="pager.size" @change="handleBtnAction('pager-size', Number($event.target.value))">
            <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</div>
</bo-modal>
`,
};

/* ═══════════════════════════════════════════════════════════════════
 * WidgetLibPickModal — 전시위젯Lib 선택 팝업 (내용복사 / 참조)
 * ═══════════════════════════════════════════════════════════════════ */
window.BoRefModal = {
  name: 'BoRefModal',
  inheritAttrs: false,
  props: {
    state:         { type: Object, default: () => ({}) }, // 공유 상태
    reloadTrigger: { type: Number, default: 0 }, // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { reactive, watch } = Vue;

    /* close */
    const close = () => {
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };
    const s = props.state;

    /* -- 각 타입별 데이터 -- */
    const member = reactive({});
    const product = reactive({});
    const order = reactive({});
    const claim = reactive({});
    const coupon = reactive({});

    const API_MAP = {
      member:  (id) => boApiSvc.mbMember.getById(id, '회원상세', '상세조회'),
      product: (id) => boApiSvc.pdProd.getById(id, '상품상세', '상세조회'),
      order:   (id) => boApiSvc.odOrder.getById(id, '주문상세', '상세조회'),
      claim:   (id) => boApiSvc.odClaim.getById(id, '클레임상세', '상세조회'),
      coupon:  (id) => boApiSvc.pmCoupon.getById(id, '쿠폰상세', '상세조회'),
    };
    const DATA_MAP = { member, product, order, claim, coupon };

    watch(() => [s.type, s.id], async ([type, id]) => {
      Object.values(DATA_MAP).forEach(obj => { Object.keys(obj).forEach(k => delete obj[k]); });
      if (!type || !id || !API_MAP[type]) return;
      try {
        const res = await API_MAP[type](id);
        if (res.data?.data) Object.assign(DATA_MAP[type], res.data.data);
      } catch (_) {}
    }, { immediate: true });

    /* badgeCls */
    const badgeCls = (status) => {
      const map = {
        '활성': 'badge-green', '판매중': 'badge-green', '진행중': 'badge-blue',
        '완료': 'badge-gray', '종료': 'badge-gray', '배송완료': 'badge-gray',
        '취소됨': 'badge-red', '정지': 'badge-red', '품절': 'badge-red',
        '배송중': 'badge-orange', '배송준비중': 'badge-orange', '결제완료': 'badge-orange',
        '만료': 'badge-red', '예정': 'badge-purple',
      };
      return map[status] || 'badge-gray';
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoRefModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return close();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoRefModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* memberFormColumns — 회원 상세 (BoFormArea readonly, cols=2, labelLeft) */
    const memberFormColumns = [
      { key: 'memberId',          label: '회원ID',      type: 'readonly' },
      { key: 'memberNm',          label: '이름',        type: 'readonly' },
      { key: 'loginId',           label: '이메일(ID)',  type: 'readonly' },
      { key: 'memberPhone',       label: '연락처',      type: 'readonly', fmt: (v) => v || '-' },
      { key: 'gradeCd',           label: '등급',        type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge badge-purple">${v}</span>` : '-' },
      { key: 'memberStatusCd',    label: '상태',        type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
      { key: 'joinDate',          label: '가입일',      type: 'readonly', fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'lastLogin',         label: '최근 로그인', type: 'readonly', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
      { key: 'orderCount',        label: '주문수',      type: 'readonly', fmt: (v) => (v != null ? v + '건' : '-') },
      { key: 'totalPurchaseAmt',  label: '총 구매액',   type: 'readonly', fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
    ];

    /* productFormColumns — 상품 상세 */
    const productFormColumns = [
      { key: 'productId', label: '상품ID',   type: 'readonly' },
      { key: 'prodNm',    label: '상품명',   type: 'readonly' },
      { key: 'category',  label: '카테고리', type: 'readonly' },
      { key: 'price',     label: '가격',     type: 'readonly', fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
      { key: 'stock',     label: '재고',     type: 'readonly', fmt: (v) => (v != null ? v + '개' : '-') },
      { key: 'brand',     label: '브랜드',   type: 'readonly' },
      { key: 'statusCd',  label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
      { key: 'regDate',   label: '등록일',   type: 'readonly' },
    ];

    /* orderFormColumns — 주문 상세 */
    const orderFormColumns = [
      { key: 'orderId',     label: '주문ID',   type: 'readonly' },
      { key: '_member',     label: '회원',     type: 'readonly', fmt: (v, row) => `${row.userNm || '-'} (ID: ${row.userId || '-'})` },
      { key: 'orderDate',   label: '주문일시', type: 'readonly' },
      { key: 'prodNm',      label: '상품',     type: 'readonly' },
      { key: 'totalPrice',  label: '결제금액', type: 'readonly', fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
      { key: 'payMethodCd', label: '결제수단', type: 'readonly' },
      { key: 'statusCd',    label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
    ];

    /* claimFormColumns — 클레임 상세 */
    const claimFormColumns = [
      { key: 'claimId',      label: '클레임ID', type: 'readonly' },
      { key: 'userNm',       label: '회원',     type: 'readonly' },
      { key: 'orderId',      label: '주문ID',   type: 'readonly' },
      { key: 'type',         label: '유형',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge badge-orange">${v}</span>` : '-' },
      { key: 'statusCd',     label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
      { key: 'prodNm',       label: '상품명',   type: 'readonly' },
      { key: 'reasonCd',     label: '사유',     type: 'readonly' },
      { key: 'requestDate',  label: '신청일',   type: 'readonly' },
      { key: 'refundAmount', label: '환불금액', type: 'readonly', visible: (row) => !!row.refundAmount, fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
    ];

    /* couponFormColumns — 쿠폰 상세 */
    const couponFormColumns = [
      { key: 'couponId',  label: '쿠폰ID',   type: 'readonly' },
      { key: 'name',      label: '쿠폰명',   type: 'readonly' },
      { key: 'code',      label: '코드',     type: 'readonly' },
      { key: '_discount', label: '할인',     type: 'readonly', fmt: (v, row) => row.discountTypeCd === 'rate' ? (row.discountValue + '%') : row.discountTypeCd === 'shipping' ? '무료배송' : (row.discountValue != null ? row.discountValue.toLocaleString() + '원' : '-') },
      { key: '_minOrder', label: '최소주문', type: 'readonly', fmt: (v, row) => row.minOrder ? row.minOrder.toLocaleString() + '원 이상' : '제한없음' },
      { key: 'issueTo',   label: '발급대상', type: 'readonly' },
      { key: 'expiry',    label: '만료일',   type: 'readonly' },
      { key: 'statusCd',  label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
    ];

    return {
      member, product, order, claim, coupon, badgeCls, s,                     // 데이터
      memberFormColumns, productFormColumns, orderFormColumns, claimFormColumns, couponFormColumns,  // 컬럼 정의
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      {{ s.type==='member'?'회원 상세':s.type==='product'?'상품 상세':s.type==='order'?'주문 상세':s.type==='claim'?'클레임 상세':'쿠폰 상세' }}
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ×
    </span>
  </div>
  <!-- 회원 -->
  <template v-if="s.type==='member'">
    <bo-form-area v-if="member.userId" :columns="memberFormColumns" :form="member" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      회원 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 상품 -->
  <template v-else-if="s.type==='product'">
    <bo-form-area v-if="product.productId" :columns="productFormColumns" :form="product" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      상품 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 주문 -->
  <template v-else-if="s.type==='order'">
    <bo-form-area v-if="order.orderId" :columns="orderFormColumns" :form="order" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      주문 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 클레임 -->
  <template v-else-if="s.type==='claim'">
    <bo-form-area v-if="claim.claimId" :columns="claimFormColumns" :form="claim" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      클레임 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 쿠폰 -->
  <template v-else-if="s.type==='coupon'">
    <bo-form-area v-if="coupon.couponId" :columns="couponFormColumns" :form="coupon" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      쿠폰 정보를 찾을 수 없습니다.
    </div>
  </template>
  <div style="margin-top:16px;text-align:right;">
    <button class="btn btn_close" @click="handleBtnAction('modal-close')">
      닫기
    </button>
  </div>
</bo-modal>
`
};

/* ── BoCodeGrpModal ──────────────────────────────────────────
 * 공통코드 그룹 미리보기 모달.
 *
 * Props:
 *   show     (Boolean)  — 모달 노출 여부
 *   codeGrp  (String)   — 조회할 코드 그룹 (예: 'PROD_OPT_CATEGORY')
 *   title    (String)   — 헤더 타이틀 (선택, 미설정 시 codeGrp 사용)
 *
 * Emits:
 *   close             — 닫기 버튼/배경 클릭
 *   select(codeRow)   — 행 더블클릭 시 코드 선택 (선택 사용 시)
 *
 * 사용:
 *   <bo-code-grp-modal :show="codeModal.show" :code-grp="codeModal.grp"
 *                      :title="'옵션 카테고리 코드'"
 *                      @close="codeModal.show=false" @select="onCodePick" />
 * ──────────────────────────────────────────────────────────── */
window.AuthProfileModal = {
  name: 'AuthProfileModal',
  inheritAttrs: false,
  props: {
    show:       { type: Boolean, default: false },
    form:       { type: Object,  required: true },          // profileForm reactive (name/phone/email/dept)
    img:        { type: Object,  default: () => ({}) },      // profileImg reactive (cdnImgUrl)
    uploading:  { type: Boolean, default: false },           // profileImgUploading
    authUser:   { type: Object,  default: () => ({}) },      // currentAuthUser,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['save', 'img-change', 'img-remove', 'close'],
  setup(props, { emit }) {
    const fnInitial = () => ((props.authUser?.authNm || props.authUser?.name || '').charAt(0)) || '?';

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthProfileModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-save') {
        return emit('save');
      } else if (cmd === 'form-img-change') {
        emit('img-change', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else if (cmd === 'form-img-remove') {
        emit('img-remove');
        if (props.onCallback) props.onCallback(props.modalName, null, true);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthProfileModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* BoFormArea 컬럼 정의 */
    const baseFormColumns = [
      { key: 'name',  label: '이름',   type: 'text', required: true, placeholder: '이름' },
      { key: 'phone', label: '연락처', type: 'text', placeholder: '010-0000-0000' },
      { type: 'rowBreak' },
      { key: 'email', label: '이메일', type: 'readonly', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'dept',  label: '부서',   type: 'text', placeholder: '부서명', colSpan: 2 },
    ];

    return {
      baseFormColumns,                                                        // 컬럼 정의
      fnInitial,                                                              // 헬퍼
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" title="🙍 프로필" width="440px" @close="handleBtnAction('modal-close')">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:#fff5f7;border-radius:10px;">
    <!-- 프로필 사진 -->
    <label style="position:relative;cursor:pointer;flex-shrink:0;" :title="uploading ? '업로드 중...' : '클릭하여 사진 변경'">
      <img v-if="img.cdnImgUrl"
        :src="img.cdnImgUrl"
        style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #e8587a;" />
      <div v-else style="width:64px;height:64px;border-radius:50%;background:#e8587a;color:#fff;font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;">
        {{ fnInitial() }}
      </div>
      <div style="position:absolute;bottom:0;right:0;width:20px;height:20px;border-radius:50%;background:#e8587a;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">
        <span v-if="uploading">
          ⏳
        </span>
        <span v-else>
          📷
        </span>
      </div>
      <input type="file" accept="image/*" style="display:none;" :disabled="uploading" @change="handleBtnAction('form-img-change', $event)" />
    </label>
    <div>
      <div style="font-size:15px;font-weight:700;color:#1a1a2e;">
        {{ authUser?.authNm || authUser?.name || '' }}
      </div>
      <div style="font-size:12px;color:#e8587a;font-weight:600;margin-top:3px;">
        {{ authUser?.role || '' }}
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:2px;">
        가입일: {{ authUser?.regDate || '' }}
      </div>
      <div v-if="img.cdnImgUrl" style="font-size:11px;color:#bbb;margin-top:2px;">
        <span style="cursor:pointer;color:#e8587a;" @click.prevent="handleBtnAction('form-img-remove')">
          ✕ 사진 삭제
        </span>
      </div>
    </div>
  </div>
  <bo-form-area :columns="baseFormColumns" :form="form" :cols="2" :show-actions="false" />
  <template #footer>
    <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
      취소
    </button>
    <button class="btn btn_save" @click="handleBtnAction('modal-save')">
      저장
    </button>
  </template>
</bo-modal>
`,
};

/* ── 사용자 선택 모달 (로그인 화면 개발용 picker) ──────────────────────────────
   boApp.js 인증 setup 의 상태/조회를 그대로 사용하는 dumb-view 모달.
   modal(=userPickModal reactive) 을 ref 로 받아 v-model 직접 바인딩, 액션은 emit.
   ※ BoUserSelectModal / SimpleUserPickModal 과 용도가 달라 Auth* 접두어로 구분 ── */
window.AuthUserPickModal = {
  name: 'AuthUserPickModal',
  inheritAttrs: false,
  props: {
    modal:     { type: Object, required: true },  // userPickModal reactive (show/searchValue/pageNo/loading)
    rows:      { type: Array,  default: () => [] },   // cfPickRows
    total:     { type: Number, default: 0 },          // cfPickTotal
    totalPage: { type: Number, default: 1 },          // cfPickTotalPage
    loginId:   { type: String, default: '' },         // loginForm.loginId (선택 행 강조용)
    pageSize:  { type: Number, default: 20 },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['search', 'go-page', 'pick', 'close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthUserPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return emit('search');
      } else if (cmd === 'pager-set') {
        return emit('go-page', param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthUserPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'users-pick') {
        emit('pick', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* cfPager — BoGrid 호환 pager 객체 (부모 props로부터 합성) */
    const cfPager = computed(() => {
      const c = props.modal.pageNo, l = props.totalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return {
        pageNo: props.modal.pageNo,
        pageSize: props.pageSize,
        pageTotalCount: props.total,
        pageTotalPage: props.totalPage,
        pageNums: Array.from({ length: e - s + 1 }, (_, i) => s + i),
      };
    });

    /* userGridColumns — BoGrid 컬럼 정의 */
    const userGridColumns = [
      { key: 'userNm',       label: '이름', cellStyle: 'font-weight:700;color:#1a1a2e;', fmt: (v, row) => v || row.label || '-' },
      { key: 'loginId',      label: '로그인ID', mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
      { key: 'siteNm',       label: '사이트', cellStyle: 'color:#777;', fmt: (v) => v || '-' },
      { key: 'deptNm',       label: '부서', cellStyle: 'color:#777;', fmt: (v) => v || '-' },
      { key: 'roleNm',       label: '권한', html: true, fmt: (v) => v ? `<span style="display:inline-block;padding:1px 7px;border-radius:9px;background:#ede9fe;color:#7c3aed;font-size:10px;font-weight:700;">${v}</span>` : '<span style="color:#ddd;">—</span>' },
      { key: 'userStatusCd', label: '상태', align: 'center', html: true, fmt: (v, row) => v === 'ACTIVE'
        ? `<span style="display:inline-block;padding:1px 8px;border-radius:9px;background:#dcfce7;color:#16a34a;font-size:10px;font-weight:700;">활성</span>`
        : `<span style="display:inline-block;padding:1px 8px;border-radius:9px;background:#fee2e2;color:#dc2626;font-size:10px;font-weight:700;">${row.userStatusCdNm || '비활성'}</span>` },
      { key: 'userEmail',    label: '이메일', cellStyle: 'color:#999;font-size:11px;', fmt: (v) => v || '-' },
    ];

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '이름 / 로그인ID / 이메일 검색...' },
    ];

    return {
      cfPager, userGridColumns, baseSearchColumns,                             // 헬퍼 / 컬럼
      handleBtnAction, handleSelectAction,                                     // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="modal.show" width="820px" max-width="96vw" box-pad="0" body-pad="0"
  :z-index="9100" @close="handleBtnAction('modal-close')">
  <div style="display:flex;flex-direction:column;max-height:90vh;">
    <!-- 모달 헤더 -->
    <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffc8d6;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">
          👥
        </span>
        <div>
          <div style="font-size:14px;font-weight:800;color:#1a1a2e;">
            사용자 선택
          </div>
          <div style="font-size:10px;color:#e8587a;margin-top:1px;">
            선택 시 마스터 패스워드(1111)로 자동 로그인
          </div>
        </div>
      </div>
      <button @click="handleBtnAction('modal-close')" style="background:none;border:none;cursor:pointer;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;color:#e8587a;" onmouseover="this.style.background='#ffd5e1'" onmouseout="this.style.background='none'">
        ✕
      </button>
    </div>
    <!-- 본문 (스크롤 영역) -->
    <div style="padding:14px 18px;overflow-y:auto;flex:1;">
      <!-- 검색바 -->
      <bo-search-area :columns="baseSearchColumns" :param="modal" :show-reset="false"
        @search="handleBtnAction('searchParam-search')" />
      <!-- 건수 -->
      <div style="font-size:11px;color:#aaa;margin:8px 0;">
        총
        <b style="color:#e8587a;">
          {{ total }}
        </b>
        명
      </div>
      <!-- 테이블 + 페이저 (BoGrid 내장) -->
      <div style="overflow-x:auto;border-radius:8px;border:1px solid #f0e0e8;">
        <bo-grid :columns="userGridColumns" :rows="modal.loading ? [] : rows" :pager="cfPager" row-key="loginId"
          :empty-text="modal.loading ? '⏳ 조회 중...' : '🔍 검색 결과가 없습니다.'"
          row-clickable :row-actions="true"
          :row-style="row => loginId===(row.loginId||row.userId) ? 'background:#fff0f4;' : ''"
          @row-click="row => handleSelectAction('users-pick', row)">
          <template #row-actions="{ row }">
            <button @click.stop="handleSelectAction('users-pick', row)" style="background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;border:none;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;">
              선택
            </button>
          </template>
        </bo-grid>
        <bo-pager :pager="cfPager" :on-set-page="n => handleBtnAction('pager-set', n)" :on-size-change="() => handleBtnAction('pager-set', 1)" />
      </div>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 비밀번호 변경 모달 ───────────────────────────────────────────────────────
   form(=pwForm reactive) 을 ref 로 받아 v-model 직접 바인딩. 저장 로직은 parent emit. ── */
window.AuthPwChangeModal = {
  name: 'AuthPwChangeModal',
  inheritAttrs: false,
  props: {
    show:  { type: Boolean, default: false },
    form:  { type: Object,  required: true },  // pwForm reactive (current/next/confirm)
    error: { type: String,  default: '' },     // pwError,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['save', 'close'],
  setup(_, { emit }) {
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthPwChangeModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-save') {
        return emit('save');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthPwChangeModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* BoFormArea 컬럼 정의 — 비밀번호 변경 폼 */
    const basePwFormColumns = [
      { key: 'current', label: '현재 비밀번호',    type: 'password', required: true, placeholder: '현재 비밀번호' },
      { key: 'next',    label: '새 비밀번호',      type: 'password', required: true, placeholder: '새 비밀번호 (6자 이상)' },
      { key: 'confirm', label: '새 비밀번호 확인', type: 'password', required: true, placeholder: '새 비밀번호 재입력' },
    ];

    return {
      basePwFormColumns,                                                      // 컬럼 정의
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" title="🔑 비밀번호 변경" width="380px" @close="handleBtnAction('modal-close')">
  <bo-form-area :columns="basePwFormColumns" :form="form" :cols="1" :show-actions="false" />
  <div v-if="error" class="login-error">
    {{ error }}
  </div>
  <template #footer>
    <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
      취소
    </button>
    <button class="btn btn-primary" @click="handleBtnAction('modal-save')">
      변경
    </button>
  </template>
</bo-modal>
`,
};

/* ── 로그인 / 회원가입 모달 ──────────────────────────────────────────────────
   modal(=loginModal) / loginForm / regForm 등 reactive 를 ref 로 받아 직접 바인딩.
   doLogin/doRegister/openUserPick 등 인증 액션은 모두 parent emit. ── */
window.AuthLoginModal = {
  name: 'AuthLoginModal',
  inheritAttrs: false,
  props: {
    modal:       { type: Object, required: true },  // loginModal reactive (show/tab)
    loginForm:   { type: Object, required: true },  // loginForm reactive
    regForm:     { type: Object, required: true },  // regForm reactive
    error:       { type: String, default: '' },     // loginError
    authMethods: { type: Array,  default: () => [] },// AUTH_METHODS
    userRoles:   { type: Array,  default: () => [] },// userRoles,
    mode:        { type: String,  default: 'modal' },// 'modal'(세션만료 재인증, 배경 비침) | 'page'(최초 미인증 진입, 전용 화면)
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['do-login', 'do-register', 'do-social', 'open-user-pick', 'close', 'clear-error'],
  setup(props, { emit }) {
    const setTab = (t) => { props.modal.tab = t; emit('clear-error'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthLoginModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-login') {
        return emit('do-login');
      } else if (cmd === 'modal-register') {
        return emit('do-register');
      } else if (cmd === 'modal-open-user-pick') {
        return emit('open-user-pick');
      } else if (cmd === 'modal-social') {
        return emit('do-social', param);
      } else if (cmd === 'tab-change') {
        return setTab(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthLoginModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* BoFormArea 컬럼 정의 — 회원가입 폼 */
    const baseRegFormColumns = [
      { key: 'name',      label: '이름',     type: 'text',     required: true, placeholder: '이름' },
      { key: 'phone',     label: '연락처',   type: 'text',     placeholder: '010-0000-0000' },
      { type: 'rowBreak' },
      { key: 'email',     label: '이메일',   type: 'text',     required: true, placeholder: '이메일 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'password',  label: '비밀번호', type: 'password', required: true, placeholder: '비밀번호' },
      { key: 'confirmPw', label: '비밀번호 확인', type: 'password', required: true, placeholder: '재입력' },
      { type: 'rowBreak' },
      { key: 'role',      label: '역할',     type: 'select',   colSpan: 2,
        options: () => (props.userRoles || []).map(c => ({ value: c.codeValue, label: c.codeLabel })) },
    ];

    /* BoFormArea 컬럼 정의 — 로그인 폼 (ID/PWD만, 인증방식은 slot) */
    const baseLoginFormColumns = [
      { key: 'loginId',    label: '로그인 ID', type: 'text',     placeholder: '로그인 ID 입력' },
      { key: 'loginPwd',   label: '비밀번호',  type: 'password', placeholder: '비밀번호 입력' },
      { key: 'authMethod', label: '인증방식',  type: 'slot', name: 'authMethod' },
    ];

    /* page 모드 = 최초 미인증 전용 화면 (불투명 배경 + 배경클릭/닫기 비활성) */
    const cfIsPage = Vue.computed(() => props.mode === 'page');

    return {
      baseRegFormColumns, baseLoginFormColumns,                               // 컬럼 정의
      cfIsPage,                                                              // 전용 화면 여부
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="cfIsPage ? true : !!modal.show" width="420px" box-pad="0" body-pad="0"
  :overlay-bg="cfIsPage ? '#f3f4f6' : 'rgba(18,24,40,0.55)'"
  :close-on-backdrop="!cfIsPage" @close="handleBtnAction('modal-close')">
  <div class="login-modal-box">
    <div class="login-modal-header">
      <div class="login-tabs">
        <span :class="{active: modal.tab==='login'}" @click="handleBtnAction('tab-change', 'login')">
          로그인
        </span>
        <span :class="{active: modal.tab==='register'}" @click="handleBtnAction('tab-change', 'register')">
          회원가입
        </span>
      </div>
      <span v-if="!cfIsPage" class="modal-close" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- 로그인 폼 -->
    <div v-if="modal.tab==='login'">
      <bo-form-area :columns="baseLoginFormColumns" :form="loginForm" :cols="1" :show-actions="false">
        <template #authMethod>
          <div class="auth-methods">
            <label v-for="m in authMethods" :key="m"
              class="auth-method-item" :class="{active: loginForm.authMethod===m}">
              <input type="radio" :value="m" v-model="loginForm.authMethod" style="display:none" />
              {{ m }}
            </label>
          </div>
        </template>
      </bo-form-area>
      <div v-if="error" class="login-error">
        {{ error }}
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="handleBtnAction('modal-login')">
        로그인
      </button>
      <!-- 소셜 로그인 (구글 / 카카오 / 네이버) -->
      <div style="display:flex;align-items:center;gap:10px;margin:16px 0 12px;color:#bbb;font-size:0.78rem;">
        <div style="flex:1;height:1px;background:#eee;">
        </div>
        소셜 로그인
        <div style="flex:1;height:1px;background:#eee;">
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button @click="handleBtnAction('modal-social', 'google')"
          style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.85rem;color:#333;font-weight:600;">
          <span style="font-size:1.05rem;">
            🌐
          </span>
          Google로 로그인
        </button>
        <button @click="handleBtnAction('modal-social', 'kakao')"
          style="width:100%;padding:10px;border:none;border-radius:8px;background:#FEE500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.85rem;color:#3C1E1E;font-weight:700;">
          <span style="font-size:1.05rem;">
            💬
          </span>
          카카오로 로그인
        </button>
        <button @click="handleBtnAction('modal-social', 'naver')"
          style="width:100%;padding:10px;border:none;border-radius:8px;background:#03C75A;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.85rem;color:#fff;font-weight:700;">
          <span style="font-size:1.05rem;font-weight:900;">
            N
          </span>
          네이버로 로그인
        </button>
      </div>
      <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
        <span>
          계정이 없으신가요?
        </span>
        <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="handleBtnAction('tab-change', 'register')">
          회원가입
        </span>
      </div>
      <div style="text-align:center;margin-top:14px;">
        <button @click="handleBtnAction('modal-open-user-pick')" style="background:none;border:none;cursor:pointer;font-size:0.72rem;color:#aaa;text-decoration:underline;padding:0;">
          사용자 선택하여 로그인 (개발)
        </button>
      </div>
    </div>
    <!-- 회원가입 폼 -->
    <div v-if="modal.tab==='register'">
      <bo-form-area :columns="baseRegFormColumns" :form="regForm" :cols="2" :show-actions="false" />
      <div v-if="error" class="login-error">
        {{ error }}
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="handleBtnAction('modal-register')">
        가입하기
      </button>
      <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
        <span>
          이미 계정이 있으신가요?
        </span>
        <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="handleBtnAction('tab-change', 'login')">
          로그인
        </span>
      </div>
    </div>
  </div>
</bo-modal>
`,
};

/* ══════════════════════════════════════════════════════════════════════
   엑셀 업로드 공통 모달 (BoExcelUploadModal)
   ─────────────────────────────────────────────────────────────────────
   탭: ① 업로드  ② 설명
   기능: 샘플 다운로드 / 조건데이타 다운로드 / 파일선택 → 미리보기 → 저장
   ─────────────────────────────────────────────────────────────────────
   props:
     title         — 모달 제목 (예: '사용자 엑셀업로드')
     uiNm          — apiHdr 용 UI 명 (예: '사용자관리')
     keyField      — 키 컬럼 필드명 (예: 'userId'). 키 값 있으면 UPDATE, 없으면 INSERT
     columns       — [{ field, label, required, codeGrp, readOnly, width, desc }]
                     codeGrp 주면 select 로 표시 + 검증, desc 는 설명탭 비고
     sampleUrl     — 샘플 다운로드 엔드포인트 (백엔드. 없으면 클라이언트가 빈 행으로 생성)
     allDataUrl    — 조건데이타 다운로드 엔드포인트 (필수, GET, 검색조건 없이 전체)
     existsCheckUrl— 키 존재체크 배치 엔드포인트 (POST, body: { keys: [] } → { existsMap })
     uploadUrl     — 업로드(upsert) 엔드포인트 (POST, body: { rows: [...] })
   emits: close, saved (업로드 완료 시 부모가 목록 재조회)
   ══════════════════════════════════════════════════════════════════════ */
window.BoExcelUploadModal = {
  name: 'BoExcelUploadModal',
  inheritAttrs: false,
  props: {
    /* 사용법:
     *   <bo-excel-upload-modal v-if="show" default-domain="role"
     *     @close="show=false" @saved="reload" />
     *
     * 모든 메타(URL/title/keyField/columns/codeGrp 등)는 자동:
     *   - URL: config/excelDomains.js 의 baseUrl + 컨벤션 (/excel, /exists-check, /upsert-list)
     *   - title/uiNm/areaNm: 선택된 도메인 라벨
     *   - keyField/columns: 다운로드 파일 3행 헤더에서 자동 추출
     *
     * default-domain 미지정 시 사용자가 모달 안 select 로 직접 선택. */
    defaultDomain: { type: String, default: '' },                          // config 키 (예: 'role', 'user'),
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;

    /* ##### [01] 초기 변수 정의 #################################################### */

    const tab = ref('upload');               // 'upload' | 'desc'
    const rows = ref([]);                    // 미리보기 행 [{ ...col, _exists, _err }]
    const fileName = ref('');                // 선택된 파일명
    const loading = ref(false);              // 업로드/체크 진행중
    const codesMap = reactive({});           // { codeGrp: [{value,label}] }
    const summary = reactive({ total: 0, insert: 0, update: 0, errors: 0 });

    /* 다운로드 시 함께 전달할 검색조건 — 모달 공통 영역에 노출.
     *   dateRangeType : 백엔드 BaseRequest 가 받는 기간 컬럼 토큰 (기본 reg_date)
     *   useYn    : USE_YN 코드값 (ACTIVE/INACTIVE/Y/N 등). 도메인별로 매핑되는 컬럼이 다르므로
     *              상태/사용여부 어느 쪽이든 매핑되도록 status 와 useYn 양쪽으로 전송.
     * 도메인이 받지 않는 필드는 Spring @ModelAttribute 가 자동으로 무시한다. */
    const _today = new Date();
    const _thisYear = _today.getFullYear();
    const searchParam = reactive({
      dateRangeType:  'reg_date',
      dateRangeStart: `${_thisYear - 3}-01-01`,
      dateRangeEnd:   `${_thisYear}-12-31`,
      useYn:     '',
    });
    const useYnOptions = ref([]);    // [{value,label}] — USE_YN 코드 그룹

    /* 원본 파일 보관 — [엑셀업로드] 시 multipart 로 그대로 전송하기 위함 */
    const selectedFile = ref(null);
    /** 파일에서 자동 추출되는 메타 정보 (3행 헤더 파싱 결과) */
    const detectedColumns = ref([]);     // [{ field, label, isKey, codeGrp }]
    const detectedKeyField = ref('');    // (key) 마커가 붙은 필드명
    const detectedTableLabel = ref('');  // Row 1 의 테이블 라벨

    /** 백엔드에서 받아온 도메인 메타 (도메인 변경 시 자동 fetch)
     *  { tableLabel, keyField, columns: [{fieldName, label, codeGrp, isKey, readOnly}, ...] } */
    const domainMeta = ref(null);
    const domainMetaLoading = ref(false);
    const domainMetaCache = new Map(); // domain key → meta 캐시 (모달 세션 동안)

    /** fnLoadDomainMeta — 선택된 도메인의 컬럼 메타를 백엔드에서 가져옴 (캐시 사용) */
    const fnLoadDomainMeta = async () => {
      const key = selectedDomainKey.value;
      if (!key) { domainMeta.value = null; return; }
      if (domainMetaCache.has(key)) {
        domainMeta.value = domainMetaCache.get(key);
        return;
      }
      const url = '/bo/excel/' + key + '/meta';
      domainMetaLoading.value = true;
      try {
        const res = await window.boApi.get(url, window.coUtil.cofApiHdr(cfUiNm.value, '도메인메타조회'));
        const meta = res.data?.data || null;
        domainMetaCache.set(key, meta);
        domainMeta.value = meta;
        /* 백엔드 메타가 들어왔으니 codeGrp 컬럼 코드도 미리 로드 */
        if (meta && Array.isArray(meta.columns)) {
          const store = window.sfGetBoCodeStore?.();
          if (store) {
            meta.columns.forEach(c => {
              if (c.codeGrp && !codesMap[c.codeGrp]) {
                const list = store.sgGetGrpCodes?.(c.codeGrp) || [];
                codesMap[c.codeGrp] = list.map(x => ({
                  value: x.codeValue ?? x.codeVal,
                  label: x.codeLabel ?? x.codeNm
                }));
              }
            });
          }
        }
      } catch (err) {
        console.warn('[BoExcelUploadModal] 도메인 메타 조회 실패:', err);
        domainMeta.value = null;
      } finally { domainMetaLoading.value = false; }
    };

    /** 업로드 점검 결과 — [업로드 점검하기] 클릭 후 채워짐.
     *  { ok, summary, items: [{level, label, detail, count?}], ranAt } */
    const inspect = reactive({ ran: false, ok: true, items: [], ranAt: '' });

    /* 도메인 select 상태 — defaultDomain prop 으로 초기값 결정. 모달 안에서 전환 가능. */
    const cfDomains = computed(() => window.BO_EXCEL_DOMAINS || []);
    const selectedDomainKey = ref(props.defaultDomain || (cfDomains.value[0]?.key || ''));
    /** 현재 선택된 도메인 메타 (key/label/baseUrl) */
    const cfDomain = computed(() => {
      if (!selectedDomainKey.value) return null;
      return cfDomains.value.find(d => d.key === selectedDomainKey.value) || null;
    });
    /* URL/라벨 자동 도출 — 선택된 도메인 baseUrl 에서 3개 URL + 화면명 컨벤션으로 도출 */
    const cfBaseUrl = computed(() => cfDomain.value?.baseUrl || '');
    const cfAllDataUrl     = computed(() => cfBaseUrl.value ? cfBaseUrl.value + '/excel'        : '');
    const cfExistsCheckUrl = computed(() => cfBaseUrl.value ? cfBaseUrl.value + '/exists-check' : '');
    const cfUploadUrl      = computed(() => cfBaseUrl.value ? cfBaseUrl.value + '/upsert-list'  : '');
    /* 라벨 — 도메인 라벨 > 파일에서 추출한 tableLabel > 기본값 */
    const cfLabel  = computed(() => cfDomain.value?.label || detectedTableLabel.value || '');
    const cfUiNm   = computed(() => cfLabel.value || '엑셀업로드');
    const cfAreaNm = computed(() => cfLabel.value || '데이터');
    const cfTitle  = computed(() => cfLabel.value ? cfLabel.value + ' 엑셀 업로드' : '엑셀 업로드');
    /* boApp 직접 호출 */
    const fnShowToast   = (msg, type, dur) => (window.boApp?.showToast   || (() => {}))(msg, type, dur);
    const fnShowConfirm = (t, m)           => (window.boApp?.showConfirm || (() => Promise.resolve(true)))(t, m);

    /* 컬럼/키 computed — 파일 3행 헤더의 (key), (gcd:XXX) 마커에서 자동 추출 */
    const cfCols = computed(() => detectedColumns.value);
    const cfKeyField = computed(() => detectedKeyField.value);
    const cfHasRows = computed(() => rows.value.length > 0);
    const cfValidRows = computed(() => rows.value.filter(r => !r._err));

    /** cfDescCols — [설명] 탭 전용 컬럼 목록.
     *   우선순위: 1) 파일에서 인식된 cfCols (파일 첨부된 경우)
     *             2) 백엔드 domainMeta.columns (파일 미첨부 시 도메인 선택만으로도 표시)
     *   양쪽 키 명을 {field, label, codeGrp, isKey, required, desc} 로 정규화. */
    const cfDescCols = computed(() => {
      if (cfCols.value.length) return cfCols.value;
      const meta = domainMeta.value;
      if (!meta || !Array.isArray(meta.columns)) return [];
      return meta.columns.map(c => ({
        field:    c.fieldName || c.field,
        label:    c.label || c.fieldName || c.field,
        codeGrp:  c.codeGrp || '',
        isKey:    !!c.isKey || (meta.keyField && (c.fieldName || c.field) === meta.keyField),
        required: !!c.required,
        readOnly: !!c.readOnly,
        desc:     c.desc || c.remark || '',
      }));
    });
    /** cfDescKeyField — [설명] 탭에서 사용할 키 필드명 (파일 우선, 없으면 도메인 메타). */
    const cfDescKeyField = computed(() => cfKeyField.value || domainMeta.value?.keyField || '');

    /* fnRecalcSummary — 요약 재계산 */
    const fnRecalcSummary = () => {
      summary.total = rows.value.length;
      summary.insert = rows.value.filter(r => !r._err && !r._exists).length;
      summary.update = rows.value.filter(r => !r._err && r._exists).length;
      summary.errors = rows.value.filter(r => r._err).length;
    };

    /* fnLoadCodes — codeGrp 가 지정된 컬럼들의 코드 목록 로드.
     *   빈 배열은 캐시하지 않음 (codeStore 가 아직 준비 안 된 경우 다음 호출 시 재시도).
     *   파일 인식 컬럼(cfCols) + 도메인 메타 컬럼(domainMeta.columns) 양쪽 모두 대상. */
    const fnLoadCodes = async () => {
      const store = window.sfGetBoCodeStore?.();
      if (!store) return;
      const sources = [];
      cfCols.value.forEach(c => sources.push({ codeGrp: c.codeGrp }));
      (domainMeta.value?.columns || []).forEach(c => sources.push({ codeGrp: c.codeGrp }));
      /* 코드는 화면 단위 지연 로딩이라 '읽기' 전에 '요청' 이 필요하다.
         여기서 쓰는 코드그룹은 업로드 파일·도메인 메타에서 런타임에 결정되므로
         정적 목록을 못 쓴다 → 발견한 그룹을 그때 모아 배치로 받는다. */
      await store.saLoadCodes(sources.map(c => c.codeGrp).filter(Boolean));
      const seen = new Set();
      sources.forEach(c => {
        if (!c.codeGrp || seen.has(c.codeGrp)) return;
        seen.add(c.codeGrp);
        if (codesMap[c.codeGrp] && codesMap[c.codeGrp].length) return; // 정상 로드된 경우만 캐시 유지
        const list = store.sgGetGrpCodes?.(c.codeGrp) || [];
        if (!list.length) return;                                      // 빈 결과는 캐시 안 함 → 재시도 가능
        codesMap[c.codeGrp] = list.map(x => ({ value: x.codeValue ?? x.codeVal, label: x.codeLabel ?? x.codeNm }));
      });
    };

    /* fnLoadSearchCodes — 검색조건 select 용 코드 로드 (USE_YN) */
    const fnLoadSearchCodes = async () => {
      const store = window.sfGetBoCodeStore?.();
      if (!store || useYnOptions.value.length) return;
      /* 읽기 전에 요청 — 지연 로딩에서는 캐시에 없으면 빈 배열이 된다 */
      await store.saLoadCodes(['USE_YN']);
      const list = store.sgGetGrpCodes?.('USE_YN') || [];
      useYnOptions.value = list.map(x => ({ value: x.codeValue ?? x.codeVal, label: x.codeLabel ?? x.codeNm }));
    };
    fnLoadSearchCodes();

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼/액션 dispatch (cmd: '{영역}-{기능}'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = async (cmd, param = {}) => {
      console.log(' ■■ BoExcelUploadModal : handleBtnAction -> ', cmd, param);
      // 탭 전환 (업로드 / 설명) — 설명 탭 진입 시 도메인 메타/코드 미리 로드
      if (cmd === 'tab-change') {
        tab.value = param;
        if (param === 'desc') {
          if (!domainMeta.value) await fnLoadDomainMeta();
          await fnLoadCodes();
        }
        return;
      // 샘플 csv 다운로드
      } else if (cmd === 'download-sample') {
        return onDownloadSample();
      // 전체 데이터 다운로드 (백엔드 chunk streaming xlsx)
      } else if (cmd === 'download-all') {
        return onDownloadAll();
      // 파일 선택 다이얼로그 열기
      } else if (cmd === 'choose-file') {
        document.getElementById('__bo_excel_upload_file__')?.click();
        return;
      // 미리보기 초기화
      } else if (cmd === 'clear-rows') {
        rows.value = []; fileName.value = '';
        fnRecalcSummary(); fnResetInspect();
        return;
      // 미리보기 한 행 제거
      } else if (cmd === 'remove-row') {
        rows.value.splice(param, 1); fnRecalcSummary();
        return;
      // 검증 정보 지우기 — 점검 결과 패널 닫기 + 행별 _err 도 함께 초기화
      } else if (cmd === 'clear-inspect') {
        fnResetInspect();
        rows.value.forEach(r => { r._err = ''; });
        fnRecalcSummary();
        return;
      // UI 점검 — 클라이언트 데이터만으로 키중복/필수/코드값 검증 (서버 미호출)
      } else if (cmd === 'ui-inspect') {
        return fnInspectClient();
      // 업로드 점검 — 도메인 메타 호환성 + DB 존재체크 (서버 호출)
      } else if (cmd === 'inspect') {
        return fnInspect();
      // 그리드 다운로드 — 현재 미리보기 그리드의 행을 xlsx 로 저장 (SheetJS)
      } else if (cmd === 'grid-download') {
        return onGridDownload();
      // 엑셀업로드 — 원본 파일을 multipart 로 백엔드에 전송 (백엔드가 직접 파싱+upsert)
      } else if (cmd === 'excel-upload') {
        return onExcelUpload();
      // 그리드업로드 — 미리보기 그리드의 행(JSON)을 upsert (기존 save 동작)
      } else if (cmd === 'grid-upload' || cmd === 'save') {
        return onSave();
      // 닫기
      } else if (cmd === 'close') {
        emit('close'); return;
        if (props.onCallback) props.onCallback(props.modalName, null, null);
      } else {
        console.warn('[BoExcelUploadModal:handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — select/드롭다운/그리드 선택 dispatch */
    const handleSelectAction = async (cmd, param = {}) => {
      console.log(' ■■ BoExcelUploadModal : handleSelectAction -> ', cmd, param);
      // 대상 도메인 변경 (상단 select)
      if (cmd === 'domain-change') {
        selectedDomainKey.value = param;
        /* 도메인이 바뀌면 해당 도메인의 메타/코드를 다시 로드 — 설명 탭이 즉시 갱신됨 */
        domainMeta.value = null;
        await fnLoadDomainMeta();
        await fnLoadCodes();
        return;
      } else {
        console.warn('[BoExcelUploadModal:handleSelectAction] unknown cmd:', cmd);
      }
    };

    /** 점검 결과 초기화 — 파일 변경/초기화 시 */
    const fnResetInspect = () => {
      inspect.ran = false; inspect.ok = true; inspect.items = []; inspect.ranAt = '';
    };

    /**
     * fnInspect — [업로드점검]: 백엔드 testRun 호출로 실제 upsert 흐름을 수행하되 DB 미반영.
     *   - POST {baseUrl}/upsert-list  body: { rows, testRun: true }
     *   - 응답 { inserted, updated, errors: [{rowIndex, message}], testRun: true }
     *   - 응답의 errors 를 행별 _err 에 매핑 → 그리드 [오류] 뱃지/_row_status=E 즉시 반영
     *   - 클라이언트 사전 검증은 모두 제거 (서버가 모두 검증).
     */
    const fnInspect = async () => {
      fnResetInspect();
      const items = [];
      const push = (level, label, detail) => items.push({ level, label, detail });

      if (!cfHasRows.value) {
        push('error', '데이터 없음', '미리보기 그리드에 행이 없습니다.');
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        return;
      }
      if (!cfUploadUrl.value) {
        push('error', '대상 도메인 미선택', '상단 [대상] select 에서 도메인을 선택하세요.');
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        return;
      }

      /* 행별 _err 초기화 — 서버 응답으로 다시 채움 */
      rows.value.forEach(r => { r._err = ''; });

      push('info', '점검 모드', '서버 testRun (DB 미반영, 행마다 검증)');
      push('info', '대상 도메인', `${cfDomain.value?.label || ''} (${cfBaseUrl.value})`);

      loading.value = true;
      let res;
      try {
        /* upsert-list 에 보낼 body 는 onSave 와 동일 형태 + testRun:true */
        const body = {
          testRun: true,
          rows: rows.value.map(r => {
            const o = {};
            cfCols.value.forEach(c => { const k = c.field || c.fieldName; o[k] = r[k]; });
            o._row_status = r._rowStatus || 'I';
            return o;
          }),
        };
        res = await window.boApi.post(cfUploadUrl.value, body,
          window.coUtil.cofApiHdr(cfUiNm.value, '업로드점검'));
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '서버 점검 호출 실패';
        push('error', '서버 호출 실패', msg);
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        loading.value = false;
        return;
      }
      loading.value = false;

      const data = res.data?.data || {};
      const errors = Array.isArray(data.errors) ? data.errors : [];
      const inserted = data.inserted ?? 0;
      const updated  = data.updated  ?? 0;
      const total    = rows.value.length;

      /* 행별 _err 매핑 — rowIndex 는 1-base (서버 규약) */
      errors.forEach(e => {
        const idx = (e.rowIndex || 0) - 1;
        if (idx >= 0 && idx < rows.value.length) {
          const prev = rows.value[idx]._err;
          rows.value[idx]._err = (prev ? prev + ' / ' : '') + (e.message || '오류');
        }
      });
      fnRecalcSummary();

      /* 점검 결과 패널 — 요약 */
      push('ok', '행수', `${total.toLocaleString()}건 / 상한 ${window.coUtil.EXCEL_UPLOAD_MAX_ROWS.toLocaleString()}건`);
      if (errors.length === 0) {
        push('ok', '검증 통과', `정상 ${total}건 (예상 — 신규 ${inserted} / 수정 ${updated})`);
      } else {
        push('error', '오류 행', `${errors.length}건 — 그리드의 오류 행에서 메시지를 확인하세요.`);
        const sample = errors.slice(0, 3).map(e => `${e.rowIndex}행: ${e.message}`).join(' / ');
        push('info', '오류 샘플', sample + (errors.length > 3 ? ' …' : ''));
        push('ok', '정상 행', `${total - errors.length}건 (예상 — 신규 ${inserted} / 수정 ${updated})`);
      }
      push('info', 'DB 반영 여부', '미반영 (testRun) — 검증만 수행');

      const hasError = items.some(i => i.level === 'error');
      Object.assign(inspect, {
        ran: true,
        ok: !hasError,
        items,
        ranAt: new Date().toLocaleTimeString(),
      });
    };

    /**
     * fnInspectClient — UI 점검 (클라이언트 단독). 서버 호출 없이 그리드 행만 검증.
     *   1. 행수 상한
     *   2. 키 컬럼 필수 / 중복
     *   3. codeGrp 컬럼의 코드값 유효성
     *   각 행의 _err 도 갱신 → 미리보기 그리드의 [오류] 뱃지가 즉시 반영됨.
     */
    const fnInspectClient = () => {
      fnResetInspect();
      const items = [];
      const push = (level, label, detail) => items.push({ level, label, detail });

      if (!cfHasRows.value) {
        push('error', '데이터 없음', '미리보기 그리드에 행이 없습니다.');
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        return;
      }
      const cols = cfCols.value;
      const kf = cfKeyField.value;
      push('info', '점검 모드', 'UI 점검 (클라이언트 단독 검증)');
      push('ok', '컬럼 인식', `${cols.length}개 컬럼`);

      /* 1. 행수 상한 */
      const total = rows.value.length;
      const limit = window.coUtil.EXCEL_UPLOAD_MAX_ROWS;
      if (total > limit) {
        push('error', '행수 상한 초과', `${total.toLocaleString()}건 > 상한 ${limit.toLocaleString()}건`);
      } else {
        push('ok', '행수', `${total.toLocaleString()}건 / 상한 ${limit.toLocaleString()}건`);
      }

      /* 행별 _err 초기화 */
      rows.value.forEach(r => { r._err = ''; });

      /* 2. 키 중복 (파일 내) */
      if (kf) {
        const seen = new Map();
        const dupes = [];
        rows.value.forEach((r, idx) => {
          const v = r[kf];
          if (v == null || v === '') return;
          if (seen.has(v)) {
            dupes.push({ key: v, first: seen.get(v) + 1, second: idx + 1 });
            r._err = (r._err ? r._err + ' / ' : '') + `키중복(${v})`;
          } else seen.set(v, idx);
        });
        if (dupes.length) {
          const sample = dupes.slice(0, 3).map(d => `${d.key}(${d.first}↔${d.second})`).join(', ');
          push('error', '키 중복', `${dupes.length}건 — ${sample}${dupes.length > 3 ? ' ...' : ''}`);
        } else {
          push('ok', '키 중복 없음', `${kf} 값 모두 유일`);
        }
      } else {
        push('warn', '키 필드 미인식', '키 컬럼이 없어 중복 검사 생략');
      }

      /* 3. codeGrp 코드값 유효성 */
      const codeCols = cols.filter(c => c.codeGrp);
      if (codeCols.length) {
        let totalBad = 0;
        const samples = [];
        for (const c of codeCols) {
          const opts = codesMap[c.codeGrp] || [];
          if (opts.length === 0) { samples.push(`${c.label}: 코드그룹(${c.codeGrp}) 로드 실패`); continue; }
          const validSet = new Set(opts.map(o => String(o.value)));
          let bad = 0;
          rows.value.forEach((r, idx) => {
            const v = r[c.field];
            if (v == null || v === '') return;
            if (!validSet.has(String(v))) {
              bad++; totalBad++;
              r._err = (r._err ? r._err + ' / ' : '') + `${c.label}:${v}`;
            }
          });
          if (bad) samples.push(`${c.label}(${c.codeGrp}): ${bad}건`);
        }
        if (totalBad) push('error', '코드값 오류', samples.join(' / '));
        else push('ok', '코드값 검증', `${codeCols.length}개 코드 컬럼 모두 유효`);
      }

      fnRecalcSummary();
      const hasError = items.some(i => i.level === 'error');
      Object.assign(inspect, { ran: true, ok: !hasError, items, ranAt: new Date().toLocaleTimeString() });
    };

    /* ##### [03] 내장 사용 함수 (다운로드 / 업로드 / 점검 핸들러) ##################### */

    /* onDownloadSample — 빈 헤더 템플릿 csv 생성 (클라이언트 사이드, 파일에서 메타 추출 후 사용 가능) */
    const onDownloadSample = () => {
      if (!cfCols.value.length) {
        fnShowToast('먼저 [조건데이타 다운로드] 받은 파일을 한 번 선택하면 컬럼 정보가 인식됩니다.', 'info');
        return;
      }
      const kf = cfKeyField.value;
      const headers = cfCols.value.map(c => c.label + ((c.field || c.fieldName) === kf ? '[키]' : ''));
      const rows1 = [headers];
      window.coUtil.cofExportCsv(rows1, headers.map((h, i) => ({ label: h, key: i })), cfAreaNm.value + '_샘플.csv');
    };

    /* onDownloadAll — 검색조건(등록기간/사용여부) 적용해서 다운로드.
     *   - 빈 값은 제외하여 백엔드 ModelAttribute 가 받지 않는 필드의 false-match 방지.
     *   - useYn 은 도메인에 따라 status/useYn 두 가지 매핑이 있으므로 동시에 전달. */
    const onDownloadAll = async () => {
      if (!cfAllDataUrl.value) { fnShowToast('대상 도메인을 먼저 선택하세요.', 'error'); return; }
      const params = {};
      if (searchParam.dateRangeType)  params.dateRangeType  = searchParam.dateRangeType;
      if (searchParam.dateRangeStart) params.dateRangeStart = searchParam.dateRangeStart;
      if (searchParam.dateRangeEnd)   params.dateRangeEnd   = searchParam.dateRangeEnd;
      if (searchParam.useYn)     { params.useYn = searchParam.useYn; params.status = searchParam.useYn; }
      loading.value = true;
      try {
        await window.coUtil.cofDownloadExcel(cfAllDataUrl.value, params, cfAreaNm.value + '_전체', cfUiNm.value, '전체다운로드');
      } catch (err) {
        fnShowToast(err.response?.data?.message || err.message || '전체 다운로드 실패', 'error', 0);
      } finally { loading.value = false; }
    };

    /**
     * onGridDownload — 현재 미리보기 그리드의 행을 xlsx 로 저장 (SheetJS).
     *   - Row 1: 테이블 라벨
     *   - Row 2: 한글 라벨 (key 표시 포함)
     *   - Row 3: 필드명 ((key), (gcd:XXX) 마커 포함) ← 재업로드 시 메타 자동 인식
     *   - Row 4~: 데이터
     */
    const onGridDownload = () => {
      if (!cfHasRows.value) { fnShowToast('다운로드할 데이타가 없습니다.', 'error'); return; }
      if (typeof window.XLSX === 'undefined') { fnShowToast('xlsx 라이브러리(SheetJS)가 로드되지 않았습니다.', 'error', 0); return; }
      const cols = cfCols.value;
      const kf = cfKeyField.value;
      const aoa = [];
      /* Row 1 — 테이블 라벨 (남는 열은 빈칸) */
      aoa.push([detectedTableLabel.value || cfLabel.value, ...Array(Math.max(cols.length - 1, 0)).fill('')]);
      /* Row 2 — 한글 라벨 */
      aoa.push(cols.map(c => c.label + (c.field === kf ? '(key)' : '') + (c.codeGrp ? `(코드:${c.codeGrp})` : '')));
      /* Row 3 — 필드명 + 마커 */
      aoa.push(cols.map(c => c.field + (c.field === kf ? '(key)' : '') + (c.codeGrp ? `(gcd:${c.codeGrp})` : '')));
      /* Row 4+ — 데이터 */
      rows.value.forEach(r => {
        aoa.push(cols.map(c => r[c.field] != null ? r[c.field] : ''));
      });
      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, cfAreaNm.value.substring(0, 31) || 'Sheet1');
      const fname = window.coUtil.cofBuildExportFilename(cfAreaNm.value + '_그리드.xlsx');
      window.XLSX.writeFile(wb, fname);
    };

    /**
     * onExcelUpload — 원본 파일을 multipart 로 백엔드에 그대로 전송.
     *   백엔드가 직접 파싱 + upsert (대용량/서버측 처리). 엔드포인트: {baseUrl}/upsert-file
     *   엔드포인트 미구현이면 자동으로 그리드업로드(onSave)로 fallback.
     */
    const onExcelUpload = async () => {
      if (!selectedFile.value) { fnShowToast('업로드할 파일이 없습니다. [파일 선택] 하세요.', 'error'); return; }
      if (!cfBaseUrl.value) { fnShowToast('대상 도메인을 먼저 선택하세요.', 'error'); return; }
      const ok = await fnShowConfirm('엑셀업로드',
        `원본 파일 [${selectedFile.value.name}]을 그대로 서버에 업로드합니다.\n` +
        `(서버에서 직접 파싱 후 upsert. 그리드 수정사항은 반영되지 않습니다.)`);
      if (!ok) return;
      const url = cfBaseUrl.value + '/upsert-file';
      const fd = new FormData();
      fd.append('file', selectedFile.value);
      loading.value = true;
      try {
        const res = await window.boApi.post(url, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          ...window.coUtil.cofApiHdr(cfUiNm.value, '엑셀업로드'),
        });
        const data = res.data?.data || {};
        fnShowToast(`엑셀업로드 완료 - 신규 ${data.inserted ?? '?'} / 수정 ${data.updated ?? '?'}`, 'success');
        emit('saved', data); emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404 || status === 405) {
          fnShowToast('서버에 [엑셀업로드] 엔드포인트가 없어 그리드업로드로 진행합니다.', 'info');
          loading.value = false;
          return onSave();
        }
        fnShowToast(err.response?.data?.message || err.message || '엑셀업로드 실패', 'error', 0);
      } finally { loading.value = false; }
    };

    /* onFileChange — 파일 선택 → 파싱 → 존재체크 → 미리보기 */
    const onFileChange = async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      selectedFile.value = file;
      fileName.value = file.name;
      ev.target.value = '';
      fnResetInspect();
      loading.value = true;
      try {
        const parsed = await fnParseExcelOrCsv(file);
        if (parsed.length === 0) {
          fnShowToast('파일에 데이타가 없습니다.', 'error');
          rows.value = []; fnRecalcSummary(); return;
        }
        if (parsed.length > window.coUtil.EXCEL_UPLOAD_MAX_ROWS) {
          fnShowToast(`업로드 행수가 상한(${window.coUtil.EXCEL_UPLOAD_MAX_ROWS.toLocaleString()})을 초과합니다. 현재 ${parsed.length.toLocaleString()}건.`, 'error', 0);
          return;
        }
        /* 컬럼 매핑 + 검증 */
        const mapped = parsed.map(p => fnMapAndValidate(p));
        rows.value = mapped;
        fnRecalcSummary();
        /* 키 존재체크 (배치 API 1회) */
        if (cfExistsCheckUrl.value) await fnCheckExists();
        fnRecalcSummary();
      } catch (err) {
        console.error('[BoExcelUploadModal:onFileChange]', err);
        fnShowToast(err.message || '파일 파싱 실패', 'error', 0);
      } finally { loading.value = false; }
    };

    /* fnParseExcelOrCsv — File 객체에서 행 배열 추출.
     *
     *  메타 인식 파일(3행 헤더) 자동 감지:
     *    Row 1: tableLabel + comment (병합)
     *    Row 2: 한글 라벨 (key 면 "이름(key)")
     *    Row 3: 필드명 (key 면 "fieldName(key)")  ← 이 행을 진짜 헤더로 사용
     *    Row 4~: 데이터
     *
     *  레거시 1행 헤더 (한글명만) 도 fallback 으로 지원.
     */
    const fnParseExcelOrCsv = async (file) => {
      const name = (file.name || '').toLowerCase();
      if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await file.text();
        return fnParseCsvWithMetaDetect(text);
      }
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        if (typeof window.XLSX === 'undefined') {
          throw new Error('xlsx 파서(SheetJS)가 로드되지 않았습니다. 페이지를 새로고침 후 다시 시도해 주세요.');
        }
        const buf = await file.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) throw new Error('엑셀 파일에 시트가 없습니다.');
        const csvText = window.XLSX.utils.sheet_to_csv(wb.Sheets[sheetName], { blankrows: false });
        return fnParseCsvWithMetaDetect(csvText);
      }
      throw new Error('지원하지 않는 파일 형식입니다. (.csv / .xlsx / .xls 만 지원)');
    };

    /** 3행 헤더 메타 자동인식 csv 파서.
     *  - 첫 행의 첫 셀이 "ID(key)" 패턴이거나, 모든 셀이 camelCase 필드명이면 메타 파일로 인식
     *  - 메타 파일: Row 3 의 필드명을 헤더로 사용 + Row 1/2 를 detectedTableLabel/detectedColumns 로 저장
     *  - 일반 csv: Row 1 을 헤더로 사용 (기존 동작) */
    const fnParseCsvWithMetaDetect = (text) => {
      /* coUtil 의 raw 토큰 파서 호출 — 행/셀 2차원 배열 */
      const allRows = fnParseCsvRaw(text);
      if (allRows.length === 0) return [];

      /* 메타 파일 감지 — Row 2 또는 Row 3 의 셀에 (key) 마커가 있고
       * Row 3 의 셀들이 camelCase 필드명처럼 보이면 메타 파일로 판정 */
      const looksLikeMeta = allRows.length >= 4 && fnIsMetaHeader(allRows);

      if (looksLikeMeta) {
        const row1 = allRows[0];                  // 테이블 라벨 + 코멘트 (첫 셀에)
        const row2 = allRows[1];                  // 한글 라벨
        const row3 = allRows[2];                  // 필드명 — 진짜 헤더
        detectedTableLabel.value = (row1[0] || '').trim();

        /* 컬럼 자동 구성 — (key), 공통코드 그룹 마커 인식.
         *   Row 3 예시: "userId(key)", "userStatusCd(gcd:USER_STATUS)", "roleId(key)(gcd:ROLE_TYPE)"
         *   Row 2 에도 legacy 표기 "(코드: XXX)" 가 있을 수 있어 함께 파싱. */
        const KEY_RE      = /\(\s*key\s*\)/i;
        /* 한글 "코드" / 영문 "code" / 축약 "gcd" 모두 허용. 콜론 뒤 공백/추가설명도 허용 */
        const CODE_GRP_RE = /\(\s*(?:코드|code|gcd)\s*[:：]\s*([A-Za-z][A-Za-z0-9_]*)\b[^)]*\)/i;
        const cols = [];
        let keyFieldFound = '';
        row3.forEach((cell, idx) => {
          const fieldRaw = (cell || '').trim();
          if (!fieldRaw) return;
          const isKey = KEY_RE.test(fieldRaw);
          /* codeGrp 는 Row 3 우선 → Row 2 (legacy "(코드: XXX)") 까지 fallback */
          const row2Cell = (row2[idx] || '').trim();
          const grpMatch = fieldRaw.match(CODE_GRP_RE) || row2Cell.match(CODE_GRP_RE);
          const codeGrp = grpMatch ? grpMatch[1].toUpperCase() : '';
          /* 마커 모두 제거하여 순수 필드명 추출 */
          const field = fieldRaw.replace(KEY_RE, '').replace(CODE_GRP_RE, '').trim();
          /* Row 2 라벨에서도 (key)/(gcd:)/(코드:) 마커 제거 → 사람용 한글만 */
          const labelRaw = row2Cell || field;
          const label = labelRaw.replace(KEY_RE, '').replace(CODE_GRP_RE, '').replace(/\s+/g, ' ').trim();
          cols.push({ field, label, isKey, codeGrp });
          if (isKey) keyFieldFound = field;
        });
        detectedColumns.value = cols;
        detectedKeyField.value = keyFieldFound;
        /* 감지된 codeGrp 들의 코드 목록 자동 로드 → 미리보기 select 자동 렌더 */
        fnLoadCodes();

        /* Row 4 ~ 를 데이터로 변환 (필드명 키 기반) */
        const headers = cols.map(c => c.field);
        const dataRows = [];
        for (let i = 3; i < allRows.length; i++) {
          const row = allRows[i];
          if (row.every(v => v === '' || v == null)) continue;
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] != null ? row[idx] : ''; });
          dataRows.push(obj);
        }
        return dataRows;
      }

      /* 일반 1행 헤더 csv (legacy) — coUtil.cofParseCsv 와 동일 동작 */
      const headers = allRows[0].map(h => (h || '').trim());
      const out = [];
      for (let r = 1; r < allRows.length; r++) {
        const row = allRows[r];
        if (row.every(v => v === '' || v == null)) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = row[idx] != null ? row[idx] : ''; });
        out.push(obj);
      }
      return out;
    };

    /** csv 텍스트 → 2차원 raw 배열 (헤더 인식 없이 순수 토큰) */
    const fnParseCsvRaw = (text) => {
      if (!text) return [];
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const rows = [];
      let cur = []; let field = ''; let inQuote = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuote) {
          if (c === '"') {
            if (text[i + 1] === '"') { field += '"'; i++; }
            else inQuote = false;
          } else field += c;
        } else {
          if (c === '"') inQuote = true;
          else if (c === ',') { cur.push(field); field = ''; }
          else if (c === '\r') {}
          else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
          else field += c;
        }
      }
      if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
      return rows;
    };

    /** 3행 메타 헤더 패턴 감지 — Row 2/3 에 (key) 또는 코드그룹 마커가 있거나
     *  Row 3 셀들이 모두 camelCase 식별자 형태이면 true */
    const fnIsMetaHeader = (allRows) => {
      if (allRows.length < 4) return false;
      const row2 = allRows[1] || [];
      const row3 = allRows[2] || [];
      const MARKER_RE = /\(\s*(?:key|코드|code|gcd)\b/i;
      const hasMarker = row2.some(c => MARKER_RE.test(c || ''))
                     || row3.some(c => MARKER_RE.test(c || ''));
      if (hasMarker) return true;
      /* 마커 없는 경우 Row 3 셀이 모두 식별자 형태인지 검사 */
      const allLookLikeFields = row3.length > 0 && row3.every(c => {
        const t = (c || '').replace(/\(\s*key\s*\)/i, '').replace(/\(\s*(?:코드|code|gcd)\s*[:：][^)]*\)/i, '').trim();
        return t === '' || /^[a-z][a-zA-Z0-9_]*$/.test(t);
      });
      return allLookLikeFields;
    };

    /* fnMapAndValidate — 한 행 검증 + 정규화. _err 에 오류 메시지 누적 */
    /* 파일 첨부 시점에는 값 정규화(trim) 만 수행 — _err 는 비워둠.
     * _rowStatus 기본 'I' (INSERT) · DB 존재체크 후 U 로 자동 전환 가능. 사용자가 직접 변경 가능. */
    const fnMapAndValidate = (raw) => {
      const out = { _err: '', _exists: false, _rowStatus: 'I' };
      cfCols.value.forEach(c => {
        const fieldKey = c.field || c.fieldName;     // 자동인식/명시정의 둘 다 지원
        let v = raw[fieldKey] ?? raw[c.label] ?? '';
        if (typeof v === 'string') v = v.trim();
        out[fieldKey] = v;
      });
      return out;
    };

    /* fnCheckExists — 키 값 배치로 보내서 존재 여부 매핑 */
    const fnCheckExists = async () => {
      const kf = cfKeyField.value;
      if (!kf || !cfExistsCheckUrl.value) return;
      const keys = rows.value.map(r => r[kf]).filter(v => v != null && v !== '');
      if (!keys.length) return;
      try {
        const res = await window.boApi.post(cfExistsCheckUrl.value, { keys }, window.coUtil.cofApiHdr(cfUiNm.value, '키존재체크'));
        const existsMap = res.data?.data?.existsMap || res.data?.existsMap || {};
        /* 사용자가 직접 D/M 등으로 바꿔놓은 행은 유지. I→U 자동 전환만 수행 (반대 방향도). */
        rows.value.forEach(r => {
          r._exists = !!existsMap[r[kf]];
          if (r._rowStatus === 'I' && r._exists) r._rowStatus = 'U';
          else if (r._rowStatus === 'U' && !r._exists) r._rowStatus = 'I';
        });
      } catch (err) {
        console.warn('[BoExcelUploadModal:fnCheckExists]', err);
      }
    };

    /* onSave — 유효 행만 upload */
    const onSave = async () => {
      if (!cfHasRows.value) { fnShowToast('업로드할 데이타가 없습니다.', 'error'); return; }
      if (!cfUploadUrl.value) { fnShowToast('대상 도메인을 먼저 선택하세요.', 'error'); return; }
      if (summary.errors > 0) {
        const ok = await fnShowConfirm('업로드', `오류 ${summary.errors}건은 제외하고 ${summary.total - summary.errors}건만 저장합니다. 계속할까요?`);
        if (!ok) return;
      } else {
        const ok = await fnShowConfirm('업로드', `${summary.total}건 (신규 ${summary.insert} / 수정 ${summary.update})을 저장합니다.`);
        if (!ok) return;
      }
      loading.value = true;
      try {
        const body = { rows: cfValidRows.value.map(r => {
          const o = {};
          cfCols.value.forEach(c => { const k = c.field || c.fieldName; o[k] = r[k]; });
          /* _row_status — 사용자가 그리드에서 선택한 값 그대로 전송.
           *   I=INSERT · U=UPDATE · D=DELETE · M=MERGE(키 존재 시 UPDATE, 없으면 INSERT) */
          o._row_status = r._rowStatus || 'I';
          return o;
        }) };
        const res = await window.boApi.post(cfUploadUrl.value, body, window.coUtil.cofApiHdr(cfUiNm.value, '엑셀업로드'));
        const data = res.data?.data || {};
        fnShowToast(`저장 완료 - 신규 ${data.inserted ?? summary.insert} / 수정 ${data.updated ?? summary.update}`, 'success');
        emit('saved', data);
        if (props.onCallback) props.onCallback(props.modalName, null, data);
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '업로드 실패';
        fnShowToast(msg, 'error', 0);
      } finally { loading.value = false; }
    };

    /* ##### [04] 라이프사이클 ##################################################### */

    Vue.onMounted(() => {
      fnLoadCodes();
      fnLoadDomainMeta(); // 마운트 시 기본 도메인 메타 로드
    });

    /* 도메인 변경 시 파일/rows 자동 초기화 + 새 도메인 메타 로드 */
    Vue.watch(selectedDomainKey, () => {
      rows.value = [];
      fileName.value = '';
      detectedColumns.value = [];
      detectedKeyField.value = '';
      detectedTableLabel.value = '';
      fnRecalcSummary();
      fnResetInspect();
      fnLoadCodes();
      fnLoadDomainMeta();
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    const inspectItemsColumns = [
      { key: '_lvl', label: '', style: 'width:24px;', align: 'center',
        fmt: (v, row) => row.level === 'ok' ? '●' : row.level === 'warn' ? '▲' : row.level === 'error' ? '✖' : '·',
        cellStyle: (v, row) => row.level === 'ok' ? 'color:#16a34a;' : row.level === 'warn' ? 'color:#f59e0b;' : row.level === 'error' ? 'color:#dc2626;' : 'color:#64748b;' },
      { key: 'label',  label: '항목', style: 'width:130px;', cellStyle: 'font-weight:600;color:#334155;' },
      { key: 'detail', label: '내용', cellStyle: 'color:#475569;' },
    ];
    const codesGridColumns = [
      { key: 'value', label: '코드값', style: 'width:120px;', cellStyle: 'font-family:monospace;' },
      { key: 'label', label: '코드명' },
    ];
    const descColsColumns = [
      { key: '_no',       label: '#',       style: 'width:36px;', align: 'center',
        fmt: (v, row, i) => i + 1, cellStyle: 'color:#999;' },
      { key: 'field',     label: '필드명',  style: 'width:160px;',
        cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: 'label',     label: '한글명' },
      { key: '_req',      label: '필수',    style: 'width:60px;', align: 'center',
        fmt: (v, row) => row.required ? '●' : '',
        cellStyle: (v, row) => row.required ? 'color:#dc2626;font-weight:700;' : '' },
      { key: '_key',      label: '키컬럼',  style: 'width:80px;', align: 'center',
        badge: row => row.field === cfDescKeyField.value
          ? { text: '키', style: 'background:#fef3c7;color:#92400e;border-radius:3px;padding:1px 6px;font-size:11px;' }
          : null },
      { key: 'codeGrp',   label: '코드그룹', style: 'width:140px;',
        fmt: v => v || '', cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: '_codeVals', label: '코드정보', style: 'width:220px;',
        fmt: (v, row) => {
          if (!row.codeGrp) return '';
          const list = codesMap[row.codeGrp];
          if (!list || !list.length) return '(로드 안 됨)';
          return list.slice(0, 5).map(o => o.label + '(' + o.value + ')').join(' / ') + (list.length > 5 ? ' …' : '');
        },
        cellStyle: 'font-size:11px;color:#555;' },
      { key: 'desc',      label: '비고', cellStyle: 'font-size:12px;' },
    ];

    return {
      tab, rows, fileName, loading, codesMap, summary, inspect,            // 상태 / 데이터
      cfCols, cfKeyField, cfHasRows, cfValidRows, cfTitle, cfLabel,        // computed
      cfDescCols, cfDescKeyField, domainMetaLoading,                       // 설명 탭 전용
      cfDomains, cfDomain, selectedDomainKey,                              // 도메인 select
      searchParam, useYnOptions,                                           // 다운로드 검색조건
      selectedFile,                                                        // 원본 파일 보관 (엑셀업로드 버튼 활성 판단)
      handleBtnAction, handleSelectAction, onFileChange,                   // dispatch + 파일 입력 핸들러
      inspectItemsColumns, codesGridColumns, descColsColumns,              // 그리드 컬럼
    };
  },
  template: `
<bo-modal :title="cfTitle" width="1100px" height="auto" max-height="95vh" body-pad="0" @close="$emit('close')">
if (props.onCallback) props.onCallback(props.modalName, null, null);
  <!-- bodyPad=0 → BoModal body 의 padding 제거 → wrapper 가 body 영역을 정확히 100% 채움.
        wrapper 내부 padding 은 직접 관리. 모달 body 자체 스크롤은 절대 활성화되지 않도록
        모든 자식이 wrapper 안에서 flex 로 줄어들도록 구성. -->
  <div style="display:flex;flex-direction:column;height:100%;min-height:0;padding:20px;box-sizing:border-box;">

  <!-- ═══ 상단 영역 (자연 높이, flex:0 0 auto) ═══ -->
  <div style="flex:0 0 auto;">

  <!-- 도메인 select (lib/config/excelDomains.js 기반) -->
  <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;">
    <label style="font-size:12px;color:#475569;font-weight:600;min-width:48px;">대상</label>
    <select :value="selectedDomainKey" @change="e => handleSelectAction('domain-change', e.target.value)"
            class="form-control" style="flex:1;max-width:280px;font-size:13px;" :disabled="cfDomains.length === 0">
      <option v-for="d in cfDomains" :key="d.key" :value="d.key">{{ d.group ? '[' + d.group + '] ' : '' }}{{ d.label }}</option>
    </select>
    <span v-if="cfDomain" style="font-size:11px;color:#94a3b8;font-family:monospace;">
      {{ cfDomain.baseUrl }}
    </span>
  </div>

  <!-- 다운로드 검색조건 (등록기간 + 사용여부). [조건데이타 다운로드] 시 백엔드로 함께 전달 -->
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:#fffaf3;border:1px solid #fde6c4;border-radius:8px;">
    <label style="font-size:12px;color:#92400e;font-weight:600;min-width:48px;">조건</label>
    <select v-model="searchParam.dateRangeType" class="form-control" style="font-size:12px;width:110px;">
      <option value="reg_date">등록일</option>
      <option value="upd_date">수정일</option>
    </select>
    <input type="date" v-model="searchParam.dateRangeStart" class="form-control" style="font-size:12px;width:140px;" />
    <span style="color:#94a3b8;">~</span>
    <input type="date" v-model="searchParam.dateRangeEnd" class="form-control" style="font-size:12px;width:140px;" />
    <label style="font-size:12px;color:#92400e;font-weight:600;margin-left:8px;">사용여부</label>
    <select v-model="searchParam.useYn" class="form-control" style="font-size:12px;width:120px;">
      <option value="">전체</option>
      <option v-for="o in useYnOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <span style="font-size:11px;color:#94a3b8;margin-left:auto;">※ [조건데이타 다운로드]에만 적용</span>
  </div>

  <!-- 탭 헤더 -->
  <div class="tab-nav" style="margin-bottom:12px;">
    <button class="tab-btn" :class="{active: tab==='upload'}" @click="handleBtnAction('tab-change','upload')">업로드</button>
    <button class="tab-btn" :class="{active: tab==='desc'}"   @click="handleBtnAction('tab-change','desc')">설명</button>
  </div>

  <!-- 업로드 탭의 액션 바 (상단 고정 영역에 포함) -->
  <div v-show="tab==='upload'" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
    <button class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('download-sample')">📄 샘플 다운로드</button>
    <button class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('download-all')">📥 조건데이타 다운로드</button>
    <span style="flex:1;"></span>
    <input type="file" id="__bo_excel_upload_file__" accept=".csv,.txt,.xlsx,.xls" style="display:none;" @change="onFileChange" />
    <button class="btn btn-blue btn-sm" :disabled="loading" @click="handleBtnAction('choose-file')">📁 파일 선택</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('ui-inspect')">🔍 UI점검</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('inspect')">📋 업로드점검</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('grid-download')">📤 그리드다운로드</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" @click="handleBtnAction('clear-rows')">초기화</button>
  </div>

  </div>
  <!-- ═══ /상단 영역 ═══ -->

  <!-- ───── 탭1: 업로드 컨텐츠 (남는 영역 flex:1) ───── -->
  <div v-show="tab==='upload'" style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;">

    <!-- 점검 결과 패널 -->
    <div v-if="inspect.ran"
         :style="(inspect.ok ? 'border:1px solid #86efac;background:#f0fdf4;' : 'border:1px solid #fca5a5;background:#fef2f2;') + 'border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;'">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-weight:700;" :style="inspect.ok ? 'color:#15803d;' : 'color:#b91c1c;'">
          {{ inspect.ok ? '✔ 업로드 가능' : '✖ 업로드 불가 — 오류 항목 확인' }}
        </span>
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#94a3b8;">점검 {{ inspect.ranAt }}</span>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('clear-inspect')" title="검증 정보 지우기">✕ 지우기</button>
      </div>
      <bo-grid bare :columns="inspectItemsColumns" :rows="inspect.items" style="font-size:11px;" />
    </div>

    <!-- 파일 안내 -->
    <div v-if="fileName" style="font-size:12px;color:#666;margin-bottom:8px;">
      선택: <strong>{{ fileName }}</strong>
      <span style="margin-left:12px;">전체 {{ summary.total }}건</span>
      <span style="margin-left:8px;color:#2563eb;">신규 {{ summary.insert }}</span>
      <span style="margin-left:8px;color:#16a34a;">수정 {{ summary.update }}</span>
      <span v-if="summary.errors" style="margin-left:8px;color:#dc2626;">오류 {{ summary.errors }}</span>
    </div>

    <!-- 미리보기 그리드 — 화면 안에서 가로 스크롤바까지 함께 보이도록 높이 제한.
         max-height: 95vh - 모달 상단/하단/패딩 합산(약 320px) → 화면 안에 가로 스크롤바도 함께 노출. -->
    <div v-if="cfHasRows" style="height:calc(95vh - 320px);min-height:280px;max-height:680px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;">
      <table class="admin-table" style="font-size:12px;margin:0;">
        <thead style="position:sticky;top:0;background:#f9fafb;z-index:1;">
          <tr>
            <th rowspan="2" style="width:36px;text-align:center;vertical-align:middle;">#</th>
            <th rowspan="2" style="width:60px;text-align:center;vertical-align:middle;">상태</th>
            <th rowspan="2" style="width:74px;text-align:center;vertical-align:middle;background:#fff7ed;color:#9a3412;font-family:Consolas,Menlo,monospace;font-size:11px;">
              _row_status
            </th>
            <th v-for="c in cfCols" :key="'lbl-'+c.field"
                :style="(c.field===cfKeyField ? 'background:#fff3d6;color:#92400e;' : '') + (c.width ? 'width:' + c.width + ';' : '') + 'min-width:130px;text-align:center;'">
              {{ c.label }}
              <span v-if="c.required" style="color:#dc2626;"> *</span>
            </th>
            <th rowspan="2" style="width:40px;"></th>
          </tr>
          <tr>
            <th v-for="c in cfCols" :key="'fld-'+c.field"
                :style="(c.field===cfKeyField ? 'background:#fff3d6;color:#92400e;' : 'background:#f3f4f6;color:#6b7280;') + 'min-width:130px;font-weight:400;font-size:11px;text-align:center;font-family:Consolas,Menlo,monospace;'">
              {{ c.field }}<span v-if="c.field===cfKeyField" style="color:#92400e;">(key)</span><span v-if="c.codeGrp" style="color:#7c3aed;">(gcd:{{ c.codeGrp }})</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, idx) in rows" :key="idx" :style="r._err ? 'background:#fef2f2;' : ''">
            <td style="text-align:center;color:#999;">{{ idx + 1 }}</td>
            <td style="text-align:center;">
              <span v-if="r._err" class="badge" style="background:#fee2e2;color:#dc2626;" :title="r._err">오류</span>
              <span v-else-if="r._exists" class="badge" style="background:#dcfce7;color:#16a34a;">수정</span>
              <span v-else class="badge" style="background:#dbeafe;color:#2563eb;">신규</span>
            </td>
            <td style="padding:2px 4px;"
                :style="r._err ? 'background:#fef2f2;' : (r._rowStatus==='D' ? 'background:#fef2f2;' : (r._rowStatus==='M' ? 'background:#fefce8;' : (r._exists ? 'background:#f0fdf4;' : 'background:#eff6ff;')))">
              <select v-model="r._rowStatus" class="form-control"
                      style="font-size:11px;padding:2px 4px;width:100%;font-family:Consolas,Menlo,monospace;font-weight:600;text-align:center;"
                      :title="'I=INSERT(신규) · U=UPDATE(수정) · D=DELETE(삭제) · M=MERGE(키 있으면 수정, 없으면 신규)'">
                <option value="I">I</option>
                <option value="U">U</option>
                <option value="D">D</option>
                <option value="M">M</option>
              </select>
            </td>
            <td v-for="c in cfCols" :key="c.field"
                :style="(c.field===cfKeyField ? 'background:#fffbeb;font-weight:600;' : '') + 'min-width:130px;'">
              <select v-if="c.codeGrp" v-model="r[c.field]" class="form-control" style="font-size:11px;padding:2px 4px;width:100%;">
                <option value="">선택</option>
                <option v-for="o in (codesMap[c.codeGrp] || [])" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
              <input v-else-if="!c.readOnly" type="text" v-model="r[c.field]" class="form-control" style="font-size:11px;padding:2px 4px;width:100%;" />
              <span v-else>{{ r[c.field] }}</span>
            </td>
            <td style="text-align:center;">
              <button class="btn btn-secondary btn-xs" @click="handleBtnAction('remove-row', idx)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 안내 (파일 미선택 시) -->
    <div v-else style="padding:40px;text-align:center;color:#999;border:2px dashed #e5e7eb;border-radius:8px;">
      <div style="font-size:14px;margin-bottom:6px;">파일을 선택하면 미리보기가 표시됩니다.</div>
      <div style="font-size:11px;">키 컬럼(노란색)에 값이 있으면 <strong>수정</strong>, 없으면 <strong>신규</strong>로 처리됩니다.</div>
    </div>
  </div>
  <!-- ───── /탭1: 업로드 컨텐츠 ───── -->

  <!-- ───── 탭2: 설명 컨텐츠 (남는 영역 flex:1, 내부 스크롤) ───── -->
  <div v-show="tab==='desc'" style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;">
    <div style="flex:0 0 auto;display:flex;align-items:center;gap:8px;font-size:12px;color:#666;margin-bottom:8px;">
      <span style="font-weight:600;color:#334155;">{{ cfLabel || '대상 미선택' }}</span>
      <span style="color:#94a3b8;">컬럼 정의 및 코드 설명</span>
      <span v-if="cfDescCols.length" style="margin-left:auto;font-size:11px;color:#94a3b8;">{{ cfDescCols.length }}개 컬럼</span>
    </div>

    <div v-if="!cfDescCols.length" style="flex:0 0 auto;padding:24px;text-align:center;color:#999;border:2px dashed #e5e7eb;border-radius:8px;">
      <div v-if="domainMetaLoading" style="font-size:13px;">메타 정보를 불러오는 중입니다...</div>
      <div v-else style="font-size:13px;">대상 도메인의 컬럼 정보가 없습니다. 상단에서 도메인을 선택해 주세요.</div>
    </div>

    <!-- 컬럼 정의 + 코드 그룹별 값 — 내부에서만 스크롤 -->
    <div v-if="cfDescCols.length" style="flex:1 1 auto;min-height:0;overflow:auto;">
      <bo-grid bare :columns="descColsColumns" :rows="cfDescCols" row-key="field"
        :row-style="row => row.field === cfDescKeyField ? 'background:#fffbeb;' : ''"
        empty-text="컬럼 정보 없음" style="font-size:12px;" />

    <!-- 코드 그룹별 값 목록 -->
    <div v-for="c in cfDescCols.filter(x => x.codeGrp)" :key="'code-' + c.codeGrp" style="margin-top:16px;">
      <div style="font-size:12px;font-weight:600;margin-bottom:6px;">
        📋 {{ c.label }} 코드값 (<code>{{ c.codeGrp }}</code>)
      </div>
      <bo-grid bare :columns="codesGridColumns" :rows="codesMap[c.codeGrp] || []"
        row-key="value" :empty-text="'코드 그룹(' + c.codeGrp + ') 로드 안 됨'"
        style="font-size:11px;" />
    </div>

    </div>
    <!-- /설명 내부 스크롤 영역 -->

  </div>
  <!-- ───── /탭2: 설명 컨텐츠 ───── -->

  </div>
  <!-- /flex column wrapper -->

  <!-- ═══ 하단 고정 영역 — BoModal #footer 슬롯 사용 (모달 박스 하단에 고정, body 스크롤과 분리) ═══ -->
  <template #footer>
    <!-- 업로드 탭: [취소] [엑셀업로드] [그리드업로드] -->
    <template v-if="tab==='upload'">
      <button class="btn btn-secondary" :disabled="loading" @click="handleBtnAction('close')">취소</button>
      <button class="btn btn_excel_upload" :disabled="loading || !selectedFile"
              @click="handleBtnAction('excel-upload')"
              title="원본 파일을 서버에 그대로 전송 — 그리드 수정사항은 반영되지 않음">
        📤 엑셀업로드
      </button>
      <button class="btn"
              :class="(inspect.ran ? !inspect.ok : false) ? 'btn-danger' : 'btn-primary'"
              :disabled="loading || !cfHasRows" @click="handleBtnAction('grid-upload')"
              :title="(inspect.ran ? !inspect.ok : false) ? '점검 결과 오류가 있습니다. 강행 시 일부 행만 저장될 수 있어요.' : '그리드에 표시된 행(편집 후 상태)을 upsert'">
        {{ (inspect.ran ? !inspect.ok : false) ? '⚠ 강행 그리드업로드' : '📋 그리드업로드' }}
      </button>
    </template>

    <!-- 설명 탭: [닫기] -->
    <template v-else-if="tab==='desc'">
      <button class="btn btn-secondary" @click="handleBtnAction('close')">닫기</button>
    </template>
  </template>
  <!-- ═══ /하단 고정 영역 ═══ -->
</bo-modal>
`,
};

/* ═══════════════════════════════════════════════════════════════════
 * BoProdCatePickModal — 좌측 카테고리 트리 + 우측 상품 목록 (페이지) 픽 모달
 *   사용처: PdProdDtl (연관상품/코디상품 추가 등)
 *   props: excludeIds(이미 선택된 prodId 제외), modalName, onCallback
 *   emit / callback: 행 클릭 시 선택된 상품 객체 전달
 * ═══════════════════════════════════════════════════════════════════ */
window.PdReviewStatusModal = {
  name: 'PdReviewStatusModal',
  inheritAttrs: false,
  props: {
    show:          { type: Boolean,   default: false },
    reviewTitle:   { type: String,    default: '' },
    currentStatus: { type: String,    default: '' },
    newStatus:     { type: String,    default: '' },
    statusLabel:   { type: Object,    default: () => ({}) },
    badgeFn:       { type: Function,  default: () => '' },
    modalName:     { type: String,    default: 'review-status' },
    onCallback:    { type: Function,  default: null },
  },
  emits: ['confirm', 'close'],
  setup(props, { emit }) {
    const { reactive, watch } = Vue;
    const local = reactive({ reason: '' });

    // 모달 열릴 때 사유 초기화
    watch(() => props.show, (v) => { if (v) local.reason = ''; });

    const onConfirm = () => {
      if (props.onCallback) props.onCallback(props.modalName, null, { reason: local.reason });
      else emit('confirm', { reason: local.reason });
    };
    const onClose = () => {
      if (props.onCallback) props.onCallback(props.modalName, null, null);
      else emit('close');
    };

    return { local, onConfirm, onClose };
  },
  template: `
<bo-modal :show="show" title="리뷰 상태 변경" width="480px" box-pad="0" @close="onClose">
  <div style="padding:18px 20px;">
    <div style="margin-bottom:14px;font-size:13px;color:#444;line-height:1.7;">
      <div><b>리뷰</b>: {{ reviewTitle }}</div>
      <div style="margin-top:4px;">
        <b>상태 변경</b>:
        <span :class="['badge', badgeFn(currentStatus)]" style="margin-left:6px;">
          {{ statusLabel[currentStatus] || currentStatus }}
        </span>
        <span style="margin:0 6px;color:#888;">→</span>
        <span :class="['badge', badgeFn(newStatus)]">
          {{ statusLabel[newStatus] || newStatus }}
        </span>
      </div>
    </div>
    <label class="form-label" style="font-size:12px;font-weight:600;color:#555;display:block;">
      변경 사유 <span style="color:#e57373;">*</span>
    </label>
    <textarea class="form-control" v-model="local.reason" rows="4"
      placeholder="상태 변경 사유를 입력해주세요. (필수)"
      style="margin:6px 0 0;width:100%;font-size:13px;box-sizing:border-box;"></textarea>
  </div>
  <template #footer>
    <button class="btn btn_cancel" @click="onClose">취소</button>
    <button class="btn btn_save" @click="onConfirm">저장</button>
  </template>
</bo-modal>
`,
};

window.BoAddrSearchModal = {
  name: 'BoAddrSearchModal',
  inheritAttrs: false,
  props: {
    modalName:  { type: String,   default: 'addr-search' },
    onCallback: { type: Function, default: null },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, onMounted } = Vue;
    const layerRef = ref(null);

    const onPicked = (data) => {
      if (props.onCallback) props.onCallback(props.modalName, null, { zonecode: data.zonecode, address: data.roadAddress || data.jibunAddress });
      else emit('select', { zonecode: data.zonecode, address: data.roadAddress || data.jibunAddress });
    };
    const onClose = () => {
      if (props.onCallback) props.onCallback(props.modalName, null, null);
      else emit('close');
    };

    /* fnEmbed — 레이어 엘리먼트에 카카오 검색 UI 임베드 (팝업 대체) */
    const fnEmbed = () => {
      if (!layerRef.value) return;
      new window.daum.Postcode({ oncomplete: onPicked }).embed(layerRef.value);
    };
    onMounted(() => {
      if (window.daum && window.daum.Postcode) { fnEmbed(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = fnEmbed;
      document.head.appendChild(s);
    });

    return { layerRef, onClose };
  },
  template: `
<bo-modal :show="true" title="주소 검색" width="520px" height="540px" body-pad="0" @close="onClose">
  <template #header-extra>
    <span style="font-size:11px;color:#bbb;">https://postcode.map.kakao.com/search</span>
  </template>
  <div ref="layerRef" style="width:100%;height:100%;overflow:hidden;"></div>
</bo-modal>
`,
};
