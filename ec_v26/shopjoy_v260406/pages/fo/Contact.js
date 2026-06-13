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
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Contact.js : handleSelectAction -> ', cmd, param);
      // 주문 선택 모달 열기
      if (cmd === 'orderModal-open') {
        return openOrderModal();
      // 주문 선택 모달 닫기
      } else if (cmd === 'orderModal-close') {
        orderModal.show = false;
        return;
      // 주문 선택 (param: order)
      } else if (cmd === 'orderModal-pick') {
        form.orderNo = param.orderId;
        orderModal.show = false;
        return;
      // 주문 상품정보 펼치기 토글 (param: orderId)
      } else if (cmd === 'orderModal-toggle') {
        orderModal.expandedId = (orderModal.expandedId === param ? null : param);
        return;
      // 주문 모달 검색(조회)
      } else if (cmd === 'orderModal-search') {
        return loadOrderModal();
      // 주문 모달 페이지 이동 (param: pageNo)
      } else if (cmd === 'orderModal-page') {
        if (param >= 1 && param <= orderModal.pager.pageTotalPage) { orderModal.pager.pageNo = param; orderModal.expandedId = null; }
        return;
      // 주문 모달 페이지 크기 변경
      } else if (cmd === 'orderModal-size') {
        orderModal.pager.pageNo = 1; orderModal.expandedId = null;
        return;
      // 주문번호 직접 지우기
      } else if (cmd === 'orderNo-clear') {
        form.orderNo = '';
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* 문의 처리 절차 3단계 (우측 안내 카드) */
    const contactSteps = [
      { icon: '📨', title: '접수', desc: '문의 양식을 제출하면 즉시 접수됩니다.', color: '#3b82f6' },
      { icon: '🔍', title: '확인 / 처리중', desc: '담당자가 내용을 확인하고 처리합니다.', color: '#f59e0b' },
      { icon: '✅', title: '답변 완료', desc: '마이페이지 > 문의에서 답변을 확인하세요.', color: '#22c55e' },
    ];

    /* ── 주문 선택 모달 ── */
    /* _ymd — 오늘/N개월전 yyyy-MM-dd */
    const _ymd = (d) => { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
    const _today = new Date();
    const _yearAgo = new Date(); _yearAgo.setFullYear(_yearAgo.getFullYear() - 1);

    const orderModal = reactive({
      show: false, loading: false, list: [], expandedId: null,
      // 검색조건 (등록기간 기본 1년 + 검색어)
      dateStart: _ymd(_yearAgo), dateEnd: _ymd(_today), searchValue: '',
      // 페이징 (클라이언트)
      pager: { pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 50] },
    });

    /* openOrderModal — 내 주문 목록 모달 열기 (로그인 회원 전용) */
    const openOrderModal = async () => {
      const u = window.foAuth?.state?.user;
      if (!u || !u.authId) { showToast('로그인 후 이용해주세요.', 'error'); return; }
      orderModal.show = true;
      await loadOrderModal();
    };

    /* loadOrderModal — 검색조건으로 주문 조회 (기간/검색어는 서버 필터) */
    const loadOrderModal = async () => {
      orderModal.loading = true;
      orderModal.expandedId = null;
      try {
        const params = {
          dateType: 'order_date', dateStart: orderModal.dateStart, dateEnd: orderModal.dateEnd,
        };
        if (orderModal.searchValue) { params.searchValue = orderModal.searchValue; params.searchType = 'orderId'; }
        const res = await foApiSvc.myOrder.getList(params, '주문선택', '목록조회');
        const list = res.data?.data || [];
        orderModal.list = list.map(o => ({
          orderId:   o.orderId,
          orderDate: String(o.orderDate || '').slice(0, 10),
          amount:    (o.payAmt != null ? o.payAmt : (o.totalAmt || 0)),
          status:    o.orderStatusCdNm || o.orderStatusCd || '',
          items:     Array.isArray(o.orderItems) ? o.orderItems.map(it => ({
            prodId: it.prodId || '',
            prodNm: it.prodNm,
            opt:    [it.optItemNm1, it.optItemNm2].filter(Boolean).join(' / '),
            qty:    it.orderQty != null ? it.orderQty : 0,
            price:  it.unitPrice != null ? it.unitPrice : 0,
          })) : [],
        }));
        orderModal.pager.pageNo = 1;
      } catch (err) {
        console.error('[loadOrderModal]', err);
        showToast('주문 내역을 불러오지 못했습니다.', 'error');
      } finally {
        orderModal.loading = false;
      }
    };

    /* cfOrderPaged — 현재 페이지 주문 슬라이스 + pager 메타 갱신 */
    const cfOrderPaged = computed(() => {
      const list = orderModal.list;
      const size = orderModal.pager.pageSize || 5;
      const total = list.length;
      const totalPage = Math.max(1, Math.ceil(total / size));
      const cur = Math.min(Math.max(1, orderModal.pager.pageNo), totalPage);
      orderModal.pager.pageTotalCount = total;
      orderModal.pager.pageTotalPage = totalPage;
      if (orderModal.pager.pageNo !== cur) orderModal.pager.pageNo = cur;
      const start = (cur - 1) * size;
      return list.slice(start, start + size);
    });

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
      columns, config, contactSteps, orderModal, cfOrderPaged, // 컬럼정의 / 사이트설정 / 처리절차 / 주문모달
      uiState, showToast,       // 상태
      handleBtnAction, handleSelectAction, // dispatch
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
              @click="handleSelectAction('orderModal-open')"
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
  <!-- ===== ■. 주문 선택 모달 ============================================== -->
  <fo-modal :show="orderModal.show" title="📦 주문 선택" width="600px" @close="handleSelectAction('orderModal-close')">
    <!-- 헤더 안내 배너 -->
    <div style="margin:-2px -2px 14px;padding:12px 16px;border-radius:10px;background:linear-gradient(135deg,#eef2ff 0%,#f5f3ff 55%,#fdf2f8 100%);border:1px solid var(--border);display:flex;align-items:center;gap:10px;">
      <span style="font-size:1.3rem;">🧾</span>
      <div>
        <div style="font-size:0.86rem;font-weight:800;color:var(--text-primary);">
          문의할 주문을 선택하세요
        </div>
        <div style="font-size:0.74rem;color:var(--text-secondary);margin-top:1px;">
          ▶ 를 눌러 주문 상품을 확인한 뒤 [선택] 하세요.
        </div>
      </div>
    </div>
    <!-- 검색바 (등록기간 + 검색어) -->
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;padding:10px 12px;background:var(--bg-base);border:1px solid var(--border);border-radius:10px;">
      <span style="font-size:0.78rem;color:var(--text-muted);font-weight:600;white-space:nowrap;">등록기간</span>
      <input type="date" class="form-input" v-model="orderModal.dateStart" style="width:140px;padding:6px 8px;font-size:0.8rem;" />
      <span style="color:var(--text-muted);">~</span>
      <input type="date" class="form-input" v-model="orderModal.dateEnd" style="width:140px;padding:6px 8px;font-size:0.8rem;" />
      <input type="text" class="form-input" v-model="orderModal.searchValue" placeholder="주문번호 검색"
        style="flex:1;min-width:120px;padding:6px 10px;font-size:0.8rem;"
        @keyup.enter="handleSelectAction('orderModal-search')" />
      <button type="button" class="btn-blue btn-sm" style="white-space:nowrap;" @click="handleSelectAction('orderModal-search')">
        🔍 조회
      </button>
    </div>
    <div v-if="orderModal.loading" style="text-align:center;padding:48px 0;color:var(--text-muted);">
      불러오는 중...
    </div>
    <div v-else-if="!orderModal.list.length" style="text-align:center;padding:48px 0;color:var(--text-muted);font-size:0.9rem;">
      🗂 조회된 주문이 없습니다.
    </div>
    <div v-else style="max-height:48vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:2px;">
      <div v-for="o in cfOrderPaged" :key="o.orderId"
        style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--bg-card);transition:box-shadow .15s;position:relative;"
        :style="orderModal.expandedId===o.orderId ? 'box-shadow:0 4px 14px rgba(0,0,0,0.10);border-color:var(--accent);z-index:1;' : ''">
        <!-- 주문 헤더 행 -->
        <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
          <!-- 펼치기 토글 -->
          <button type="button" @click="handleSelectAction('orderModal-toggle', o.orderId)"
            :title="orderModal.expandedId===o.orderId ? '접기' : '상품보기'"
            style="flex-shrink:0;width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg-base);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:var(--text-secondary);transition:transform .15s;"
            :style="orderModal.expandedId===o.orderId ? 'transform:rotate(90deg);' : ''">
            ▶
          </button>
          <!-- 주문 정보 -->
          <div style="flex:1;min-width:0;cursor:pointer;" @click="handleSelectAction('orderModal-toggle', o.orderId)">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">
                {{ o.orderId }}
              </span>
              <span style="font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--blue-dim,#eef2ff);color:var(--blue);">
                {{ o.status }}
              </span>
            </div>
            <div style="font-size:0.76rem;color:var(--text-muted);margin-top:3px;">
              🗓 {{ o.orderDate }} · 🛍 {{ o.items.length }}개 상품 · <b style="color:var(--text-secondary);">{{ Number(o.amount).toLocaleString() }}원</b>
            </div>
          </div>
          <!-- 선택 버튼 -->
          <button type="button" @click="handleSelectAction('orderModal-pick', o)"
            class="btn-blue btn-sm" style="flex-shrink:0;white-space:nowrap;">
            선택
          </button>
        </div>
        <!-- 펼침: 주문상품 목록 (좌측 들여쓰기로 주문 헤더와 구분) -->
        <div v-show="orderModal.expandedId===o.orderId"
          style="border-top:1px dashed var(--border);background:var(--bg-base);padding:8px 16px 12px 42px;">
          <div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);letter-spacing:0.03em;padding:4px 0;">
            🛍 구성 상품
          </div>
          <div v-if="!o.items.length" style="font-size:0.78rem;color:var(--text-muted);padding:10px 0;">
            상품 정보가 없습니다.
          </div>
          <div v-for="(it, ii) in o.items" :key="ii"
            style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
            <span style="font-size:1.05rem;flex-shrink:0;">📦</span>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span style="font-size:0.84rem;font-weight:600;color:var(--text-primary);">
                  {{ it.prodNm }}
                </span>
                <span v-if="it.prodId" style="font-size:0.66rem;font-family:monospace;color:var(--text-muted);background:var(--bg-card);border:1px solid var(--border);border-radius:4px;padding:0 5px;line-height:1.6;">
                  #{{ it.prodId }}
                </span>
              </div>
              <div v-if="it.opt" style="font-size:0.74rem;color:var(--text-muted);margin-top:2px;">
                {{ it.opt }}
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary);">
                {{ Number(it.price).toLocaleString() }}원
              </div>
              <div style="font-size:0.72rem;color:var(--text-muted);">
                수량 {{ it.qty }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 페이지네이션 -->
    <fo-pager v-if="orderModal.list.length" :pager="orderModal.pager"
      :on-set-page="n => handleSelectAction('orderModal-page', n)"
      :on-size-change="() => handleSelectAction('orderModal-size')" />
  </fo-modal>
  <!-- ===== □. 주문 선택 모달 ============================================== -->
</fo-page>
<!-- ===== □.□. 연락처 + 처리절차 안내 ========================================== -->
<!-- ===== □. 본문 영역 =================================================== -->
`
};
