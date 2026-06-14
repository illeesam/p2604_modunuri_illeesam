/* ShopJoy - Contact */
window.Contact = {
  name: 'Contact',
  props: {
    navigate:  { type: Function, required: true },        // 페이지 이동
    config:    { type: Object, default: () => ({}) },     // 사이트 설정 (tel/email/faqs)
  },
  emits: [],
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { reactive, ref, computed, watch, onMounted } = Vue;
    const showToast            = window.foApp.showToast;  // 토스트 알림
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});
    /* config: props 우선, 없으면 window.SITE_CONFIG fallback (템플릿 config.tel/email/faqs 안전 접근) */
    const config = computed(() => (props.config && Object.keys(props.config).length ? props.config : (window.SITE_CONFIG || {})));


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Contact.js : handleBtnAction -> ', cmd, param);
      // 홈으로 이동
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      // 문의 접수
      } else if (cmd === 'form-submit') {
        return handleSubmit();
      // 주문 선택 모달 열기
      } else if (cmd === 'orderModal-open') {
        return openOrderModal();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Contact.js : handleSelectAction -> ', cmd, param);
      // 주문번호 직접 지우기
      if (cmd === 'orderNo-clear') {
        form.orderNo = '';
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 파라미터, result=응답(null=닫기/취소, 값=선택) */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ Contact.js : fnCallbackModal -> ', cmd, param, result);
      // 주문 선택 모달 (result==null: 닫기, result=주문객체: 선택)
      if (cmd === 'orderModal') {
        orderModal.show = false;
        if (result) form.orderNo = result.orderId;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    /* 문의 처리 절차 3단계 (우측 안내 카드) */
    const contactSteps = [
      { icon: '📨', title: '접수', desc: '문의 양식을 제출하면 즉시 접수됩니다.', color: '#3b82f6' },
      { icon: '🔍', title: '확인 / 처리중', desc: '담당자가 내용을 확인하고 처리합니다.', color: '#f59e0b' },
      { icon: '✅', title: '답변 완료', desc: '마이페이지 > 문의에서 답변을 확인하세요.', color: '#22c55e' },
    ];

    /* ── 주문 선택 모달 (상세 로직은 OrderPickModal 컴포넌트로 분리) ── */
    const orderModal = reactive({ show: false });

    /* openOrderModal — 모달 열기 (로그인 회원 전용) */
    const openOrderModal = () => {
      const u = window.foAuth?.state?.user;
      if (!u || !u.authId) { showToast('로그인 후 이용해주세요.', 'error'); return; }
      orderModal.show = true;
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });
    const cfInquiryCodes = computed(() =>
      coUtil.cofCodesByGroup(window.SITE_CONFIG || {}, 'shopjoy_contact_inquiry')
    );

    const form = reactive({ name: '', email: '', tel: '', orderNo: '', inquiryType: '', desc: '', contentAttachGrpId: null });
    const errors = reactive({});

    /* fnPrefillUser — 로그인 사용자 정보로 이름/이메일/연락처 자동 초기값 (비어있을 때만).
       svAuthUser 는 getUser(StoreMember) 로 덮어써지므로 그 필드명(memberEmail/memberHpNo)도 fallback. */
    const fnPrefillUser = () => {
      try {
        const u = window.foAuth?.state?.user;
        if (!u) return;
        if (!form.name)  form.name  = u.memberNm || u.authNm || u.name || '';
        if (!form.email) form.email = u.memberEmail || u.email || u.loginId || '';
        if (!form.tel)   form.tel   = u.memberHpNo || u.phone || u.memberPhone || '';
      } catch (e) { console.error('[fnPrefillUser]', e); }
    };
    onMounted(() => fnPrefillUser());

    /* validate — 검증 */
    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      let ok = true;
      if (!form.name.trim() || form.name.trim().length < 2) { errors.name = '이름을 2자 이상 입력해주세요.'; ok = false; }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = '유효한 이메일을 입력해주세요.'; ok = false; }
      /* desc 는 HTML(에디터) — 태그 제거 후 순수 텍스트 길이로 검증 */
      const descText = String(form.desc || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (descText.length < 10) { errors.desc = '문의 내용을 최소 10자 이상 입력해주세요.'; ok = false; }
      return ok;
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSubmit — 문의 접수 (백엔드 CmContactSubmitDto.Request 필드명에 정확히 매핑) */
    const handleSubmit = async () => {
      if (!validate()) {
        const firstErr = errors.name || errors.email || errors.desc || '입력 내용을 확인해주세요.';
        showToast(firstErr, 'error');
        return;
      }
      uiState.loading = true;
      try {
        await foApiSvc.myInquiry.create({
          inquiryType:        form.inquiryType,
          name:               form.name,
          email:              form.email,
          tel:                form.tel,
          orderNo:            form.orderNo,
          message:            form.desc,                // 백엔드 DTO 필드명은 message (프론트 desc)
          blogAuthor:         form.name,                // 작성자명 = 문의자 이름
          contentAttachGrpId: form.contentAttachGrpId,  // 첨부파일 그룹 연결
          // siteId 는 foApiAxios 가 X-Site-Id 헤더로 전달 → 백엔드 fallback 처리
        }, '문의', '저장');
        showToast('문의가 접수되었습니다. 빠르게 답변드리겠습니다!', 'success');
        Object.assign(form, { name: '', email: '', tel: '', orderNo: '', inquiryType: '', desc: '', contentAttachGrpId: null });
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '문의 접수 중 오류가 발생했습니다.';
        showToast(msg, 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* FoFormArea columns 정의 */
    // --- [컬럼 정의] ---
    const columns = {};
    columns.baseForm = [
      { key: 'name',        label: '이름',     type: 'text',  required: true, placeholder: '홍길동' },
      { key: 'email',       label: '이메일',   type: 'email', required: true, placeholder: 'hello@example.com' },
      { key: 'tel',         label: '연락처',   type: 'tel',   placeholder: '010-1234-5678' },
      { key: 'orderNo',     label: '주문번호', type: 'slot', name: 'orderNoPick' },
      { type: 'rowBreak' },
      { key: 'inquiryType', label: '문의 유형', type: 'select', colSpan: 2,
        options: () => cfInquiryCodes.value, nullLabel: '선택해주세요 (선택사항)' },
      { type: 'rowBreak' },
      { key: 'desc',        label: '문의 내용', type: 'slot', name: 'descEditor', required: true, colSpan: 2 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns, config, contactSteps, orderModal, // 컬럼정의 / 사이트설정 / 처리절차 / 주문모달
      uiState, showToast,       // 상태
      handleBtnAction, handleSelectAction, fnCallbackModal, // dispatch
      form, errors, // 폼
      handleSubmit,                                    // 이벤트 (호환)
    };
  },
  template: /* html */ `
<fo-page title="고객센터" eyebrow="Support"
  banner-img="assets/cdn/prod/img/page-title/page-title-2.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'home' }, { label:'고객센터' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(0,7fr) minmax(0,3fr);gap:clamp(14px,2.5vw,28px);align-items:start;" class="contact-grid">
    <!-- ===== ■.■. 문의 폼 ================================================== -->
    <fo-container title="✉️ 문의 양식" card-style="padding:clamp(16px,4vw,32px);">
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <fo-form-area :columns="columns.baseForm" :form="form" :errors="errors" :cols="2">
        <template #orderNoPick>
          <label class="form-label">주문번호</label>
          <div style="display:flex;gap:6px;align-items:center;">
            <input class="form-input" v-model="form.orderNo"
              placeholder="직접 입력 또는 주문 선택" style="flex:1;" />
            <button type="button" title="내 주문에서 선택"
              @click="handleBtnAction('orderModal-open')"
              style="flex-shrink:0;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;font-size:1.1rem;">
              📋
            </button>
          </div>
        </template>
        <template #descEditor>
          <label class="form-label">
            문의 내용 <span class="form-required">*</span>
          </label>
          <base-html-editor v-model="form.desc" height="220px" />
          <div v-if="errors.desc" class="field-error" style="color:#ef4444;font-size:0.78rem;margin-top:4px;">
            {{ errors.desc }}
          </div>
        </template>
      </fo-form-area>
      <div style="margin-bottom:22px;">
        <label class="form-label">
          첨부파일
        </label>
        <base-attach-grp :model-value="form.contentAttachGrpId"
          @update:model-value="form.contentAttachGrpId = $event"
          :show-toast="showToast"
          grp-code="CONTACT_CONTENT_ATTACH"
          grp-nm="문의 첨부파일"
          :max-count="5"
          :max-size-mb="10"
          allow-ext="jpg,jpeg,png,gif,pdf,xlsx,docx,zip" />
      </div>
      <button class="btn-blue" @click="handleBtnAction('form-submit')" :disabled="uiState.loading" style="width:100%;padding:13px;">
        {{ uiState.loading ? '접수 중...' : '문의 접수하기' }}
      </button>
    </fo-container>
    <!-- ===== □.□. 문의 폼 ================================================== -->
    <!-- ===== ■.■. 연락처 + 처리절차 안내 ========================================== -->
    <div style="display:flex;flex-direction:column;gap:18px;">
      <fo-container title="📋 연락처" card-style="padding:24px;">
        <div class="info-row">
          <span class="info-icon">
            📞
          </span>
          <div>
            <div class="info-label">
              전화
            </div>
            <div class="info-val">
              {{ config.tel }}
            </div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-icon">
            📧
          </span>
          <div>
            <div class="info-label">
              이메일
            </div>
            <div class="info-val">
              {{ config.email }}
            </div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-icon">
            🕘
          </span>
          <div>
            <div class="info-label">
              운영 시간
            </div>
            <div class="info-val">
              평일 09:00 – 18:00
            </div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-icon">
            🚚
          </span>
          <div>
            <div class="info-label">
              배송 안내
            </div>
            <div class="info-val">
              결제 확인 후 1~2 영업일 출고
            </div>
          </div>
        </div>
      </fo-container>
      <fo-container title="🧭 문의 처리 절차" card-style="padding:24px;">
        <!-- 3단계 타임라인 -->
        <div style="display:flex;flex-direction:column;gap:0;">
          <div v-for="(step, i) in contactSteps" :key="i"
            style="display:flex;gap:14px;align-items:flex-start;">
            <!-- 좌: 번호 원 + 연결선 -->
            <div style="display:flex;flex-direction:column;align-items:center;align-self:stretch;">
              <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:800;color:#fff;flex-shrink:0;"
                :style="'background:' + step.color">
                {{ i + 1 }}
              </div>
              <div v-if="i < contactSteps.length - 1" style="width:2px;flex:1;min-height:24px;background:var(--border);margin:2px 0;"></div>
            </div>
            <!-- 우: 제목 + 설명 -->
            <div style="padding-bottom:16px;">
              <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);">
                {{ step.icon }} {{ step.title }}
              </div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:3px;line-height:1.5;">
                {{ step.desc }}
              </div>
            </div>
          </div>
        </div>
        <!-- 응답 안내 박스 -->
        <div style="margin-top:6px;padding:12px 14px;background:var(--bg-base);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:1.1rem;">⏱</span>
          <span style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">
            평균 응답 <b style="color:var(--text-primary);">영업일 기준 1일 이내</b> ·
            답변은 <b style="color:var(--text-primary);">마이페이지 &gt; 문의</b>에서 확인하실 수 있습니다.
          </span>
        </div>
      </fo-container>
    </div>
  </div>
  <!-- ===== ■. 주문 선택 모달 (컴포넌트 분리) ============================ -->
  <order-pick-modal :show="orderModal.show" modal-name="orderModal" :on-callback="fnCallbackModal" />
  <!-- ===== □. 주문 선택 모달 ============================================== -->
</fo-page>
<!-- ===== □.□. 연락처 + 처리절차 안내 ========================================== -->
<!-- ===== □. 본문 영역 =================================================== -->
`
};
