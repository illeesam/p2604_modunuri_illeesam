/* ShopJoy Admin - 쿠폰관리 상세/등록 (다중탭: 기본정보/발급대상/지급방법/사용방법/발급목록/사용목록) */
window._pmCouponDtlState = window._pmCouponDtlState || { tab: 'info', viewMode: 'tab' };
window.PmCouponDtl = {
  name: 'PmCouponDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onBeforeUnmount, nextTick } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._pmCouponDtlState.tab || 'info');
    Vue.watch(tab, v => { window._pmCouponDtlState.tab = v; });
    const viewMode2 = ref(window._pmCouponDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._pmCouponDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const COUPON_TYPES = ['배송비할인쿠폰', '회원가입축하쿠폰', '상품할인쿠폰', '주문할인쿠폰', '클레임관리자지급쿠폰', 'VIP쿠폰'];
    const ISSUE_TARGETS = ['상품', '판매업체', '브랜드', '카테고리'];
    const DISCOUNT_TYPES = [{ value: 'amount', label: '정액' }, { value: 'percent', label: '정률' }];

    const form = reactive({
      couponId: null, couponType: '상품할인쿠폰', couponCode: '', couponNm: '',
      discountType: 'amount', discountVal: 0, minOrderAmt: 0, maxDiscountAmt: 0,
      status: '활성', startDate: '', endDate: '', totalIssue: 0, useLimit: 'unlimited',
      issueTo: '상품', issueTargets: [],
      issueMethods: 'auto', issueCondition: 'all', issueGrades: [],
      useScope: 'all', useExclude: '', useRemark: '',
      memo: '',
    });
    const errors = reactive({});

    const memoEl = ref(null);
    let _qMemo = null;

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const schema = yup.object({
      couponNm: yup.string().required('쿠폰명을 입력해주세요.'),
      couponCode: yup.string().required('쿠폰코드를 입력해주세요.'),
      discountVal: yup.number().min(0).required('할인값을 입력해주세요.'),
      endDate: yup.string().required('만료일을 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const c = props.adminData.getCoupon(props.editId);
        if (c) Object.assign(form, { ...c });
      }
      if (!form.startDate) form.startDate = DEFAULT_START;
      if (!form.endDate) form.endDate = DEFAULT_END;
      await nextTick();
      if (memoEl.value && typeof Quill !== 'undefined') {
        _qMemo = new Quill(memoEl.value, {
          theme: 'snow',
          placeholder: '쿠폰 관련 메모를 입력하세요...',
          modules: { toolbar: [['bold','italic','underline'],[{color:[]}],[{list:'ordered'},{list:'bullet'}],['link','clean']] }
        });
        if (form.memo) _qMemo.root.innerHTML = form.memo;
        _qMemo.on('text-change', () => { form.memo = _qMemo.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => { if (_qMemo) { form.memo = _qMemo.root.innerHTML; _qMemo = null; } });

    /* 발급목록 */
    const issuedList = computed(() => {
      if (!props.adminData.coupons) return [];
      const c = props.adminData.coupons.find(x => x.couponId === props.editId);
      return c ? (c.issuedList || []) : [];
    });

    /* 사용목록 */
    const usedList = computed(() => {
      if (!props.adminData.coupons) return [];
      const c = props.adminData.coupons.find(x => x.couponId === props.editId);
      return c ? (c.usedList || []) : [];
    });

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `coupons/${form.couponId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (!props.adminData.coupons) props.adminData.coupons = [];
          if (isNew.value) {
            props.adminData.coupons.push({
              ...form,
              couponId: Date.now(),
              regDate: new Date().toISOString().slice(0, 10),
              issuedList: [],
              usedList: [],
            });
          } else {
            const idx = props.adminData.coupons.findIndex(x => x.couponId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.coupons[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'pmCouponMng',
      });
    };

    return {
      isNew, tab, form, errors, showTab, viewMode2, save, memoEl,
      COUPON_TYPES, ISSUE_TARGETS, DISCOUNT_TYPES,
      issuedList, usedList,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '쿠폰 등록' : '쿠폰 수정' }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.couponId }}</span></div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="viewMode2!=='tab'" @click="tab='info'">📋 기본정보</button>
      <button class="tab-btn" :class="{active:tab==='issue'}" :disabled="viewMode2!=='tab'" @click="tab='issue'">🎁 발급대상</button>
      <button class="tab-btn" :class="{active:tab==='issueMeth'}" :disabled="viewMode2!=='tab'" @click="tab='issueMeth'">📤 지급방법/조건</button>
      <button class="tab-btn" :class="{active:tab==='useMethod'}" :disabled="viewMode2!=='tab'" @click="tab='useMethod'">🔍 사용방법</button>
      <button class="tab-btn" :class="{active:tab==='issued'}" :disabled="viewMode2!=='tab'" @click="tab='issued'">📊 발급목록</button>
      <button class="tab-btn" :class="{active:tab==='used'}" :disabled="viewMode2!=='tab'" @click="tab='used'">✅ 사용목록</button>
    </div>
    <div class="tab-view-modes">
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭">📑</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열">1▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열">2▭</button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

    <!-- 기본정보 -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">쿠폰 타입</label>
          <select class="form-control" v-model="form.couponType">
            <option v-for="t in COUPON_TYPES" :key="t">{{ t }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">쿠폰명 <span class="req">*</span></label>
          <input class="form-control" v-model="form.couponNm" placeholder="쿠폰명 입력" :class="errors.couponNm ? 'is-invalid' : ''" />
          <span v-if="errors.couponNm" class="field-error">{{ errors.couponNm }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">쿠폰코드 <span class="req">*</span></label>
          <input class="form-control" v-model="form.couponCode" placeholder="코드 자동생성/직접입력" :class="errors.couponCode ? 'is-invalid' : ''" />
          <span v-if="errors.couponCode" class="field-error">{{ errors.couponCode }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status">
            <option>활성</option><option>비활성</option><option>중지</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">할인 유형</label>
          <select class="form-control" v-model="form.discountType">
            <option v-for="o in DISCOUNT_TYPES" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">할인값 <span class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.discountVal" :placeholder="form.discountType==='percent' ? '% 입력' : '원 입력'" :class="errors.discountVal ? 'is-invalid' : ''" />
          <span v-if="errors.discountVal" class="field-error">{{ errors.discountVal }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">최소주문금액 (원)</label>
          <input class="form-control" type="number" v-model.number="form.minOrderAmt" placeholder="0" />
        </div>
        <div class="form-group">
          <label class="form-label">최대할인금액 (원)</label>
          <input class="form-control" type="number" v-model.number="form.maxDiscountAmt" placeholder="0 = 무제한" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">시작일</label>
          <input class="form-control" type="date" v-model="form.startDate" />
        </div>
        <div class="form-group">
          <label class="form-label">만료일 <span class="req">*</span></label>
          <input class="form-control" type="date" v-model="form.endDate" :class="errors.endDate ? 'is-invalid' : ''" />
          <span v-if="errors.endDate" class="field-error">{{ errors.endDate }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">총 발급수량</label>
          <input class="form-control" type="number" v-model.number="form.totalIssue" placeholder="0 = 무제한" />
        </div>
        <div class="form-group">
          <label class="form-label">사용 제한</label>
          <select class="form-control" v-model="form.useLimit">
            <option value="unlimited">무제한</option><option value="once">1회만</option><option value="month">월 1회</option>
          </select>
        </div>
      </div>
      <div style="margin-top:16px;">
        <label class="form-label">메모</label>
        <div ref="memoEl" style="min-height:120px;"></div>
      </div>
    </div>

    <!-- 발급대상 -->
    <div class="card" v-show="showTab('issue')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🎁 발급대상</div>
      <div class="form-group">
        <label class="form-label">발급 대상 종류</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <label v-for="t in ISSUE_TARGETS" :key="t" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;background:form.issueTo===t?'#e3f2fd':'#fff';">
            <input type="radio" :value="t" v-model="form.issueTo" />
            {{ t }}
          </label>
        </div>
      </div>
      <div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e0e0e0;">
        <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px;">선택된 대상: <span style="color:#e8587a;">{{ form.issueTo }}</span></div>
        <div style="font-size:13px;color:#888;">
          <template v-if="form.issueTo==='상품'">
            선택한 상품에만 쿠폰을 발급합니다. 상품 추가 버튼으로 대상 상품을 선택하세요.
          </template>
          <template v-else-if="form.issueTo==='판매업체'">
            선택한 판매업체의 상품에만 적용되는 쿠폰입니다.
          </template>
          <template v-else-if="form.issueTo==='브랜드'">
            선택한 브랜드의 상품에만 적용되는 쿠폰입니다.
          </template>
          <template v-else-if="form.issueTo==='카테고리'">
            선택한 카테고리의 상품에만 적용되는 쿠폰입니다.
          </template>
        </div>
      </div>
    </div>

    <!-- 지급방법/조건 -->
    <div class="card" v-show="showTab('issueMeth')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📤 지급방법/조건</div>
      <div class="form-group">
        <label class="form-label">지급 방법</label>
        <select class="form-control" v-model="form.issueMethods">
          <option value="auto">자동 발급</option><option value="manual">수동 발급</option><option value="event">이벤트 발급</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">지급 조건</label>
        <select class="form-control" v-model="form.issueCondition">
          <option value="all">전체 회원</option><option value="newMember">신규 회원</option><option value="subscribe">구독자</option><option value="purchase">구매 고객</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">적용 회원 등급</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <label v-for="g in ['전체', '일반', '실버', '골드', 'VIP']" :key="g" style="display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #ddd;border-radius:14px;cursor:pointer;">
            <input type="checkbox" :value="g" v-model="form.issueGrades" />
            {{ g }}
          </label>
        </div>
        <span v-if="form.issueGrades.length===0" style="font-size:12px;color:#aaa;">선택하지 않으면 전체 등급에 적용</span>
      </div>
    </div>

    <!-- 사용방법 -->
    <div class="card" v-show="showTab('useMethod')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🔍 사용방법</div>
      <div class="form-group">
        <label class="form-label">사용 범위</label>
        <select class="form-control" v-model="form.useScope">
          <option value="all">모든 상품</option><option value="category">카테고리 제한</option><option value="product">특정 상품만</option><option value="exclude">제외 상품</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">제외 상품/카테고리</label>
        <textarea class="form-control" v-model="form.useExclude" rows="3" placeholder="쉼표로 구분하여 입력 (예: 상품ID1, 상품ID2, 카테고리ID3)" style="font-size:12px;"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">사용 제약사항</label>
        <textarea class="form-control" v-model="form.useRemark" rows="3" placeholder="예: 다른 쿠폰과 중복 사용 불가, 배송료 할인 쿠폰은 특정 배송사만 적용 등" style="font-size:12px;"></textarea>
      </div>
    </div>

    <!-- 발급목록 -->
    <div class="card" v-show="showTab('issued')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📊 발급목록 <span class="tab-count">{{ issuedList.length }}</span></div>
      <div v-if="issuedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">발급된 쿠폰이 없습니다.</div>
      <table v-else class="admin-table" style="font-size:12px;">
        <thead><tr><th>쿠폰코드</th><th>발급대상</th><th>발급일시</th><th>유효기간</th><th>상태</th></tr></thead>
        <tbody>
          <tr v-for="(item, idx) in issuedList.slice(0, 10)" :key="idx">
            <td>{{ item.code || '-' }}</td>
            <td>{{ item.target || '-' }}</td>
            <td>{{ item.issuedDate || '-' }}</td>
            <td>{{ item.expiryDate || '-' }}</td>
            <td><span class="badge" :class="item.status==='사용'?'badge-blue':'badge-green'">{{ item.status || '미사용' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 사용목록 -->
    <div class="card" v-show="showTab('used')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">✅ 사용목록 <span class="tab-count">{{ usedList.length }}</span></div>
      <div v-if="usedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">사용된 쿠폰이 없습니다.</div>
      <table v-else class="admin-table" style="font-size:12px;">
        <thead><tr><th>쿠폰코드</th><th>사용자</th><th>주문ID</th><th>주문금액</th><th>할인액</th><th>사용일시</th></tr></thead>
        <tbody>
          <tr v-for="(item, idx) in usedList.slice(0, 10)" :key="idx">
            <td>{{ item.code || '-' }}</td>
            <td>{{ item.userId || '-' }}</td>
            <td>{{ item.orderId || '-' }}</td>
            <td>{{ (item.orderAmt||0).toLocaleString() }}원</td>
            <td style="color:#e8587a;font-weight:600;">-{{ (item.discountAmt||0).toLocaleString() }}원</td>
            <td>{{ item.usedDate || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div style="margin-top:16px;text-align:center;gap:8px;display:flex;justify-content:center;">
    <button class="btn btn-primary" @click="save" style="min-width:120px;">저장</button>
    <button class="btn btn-secondary" @click="navigate('pmCouponMng')" style="min-width:120px;">취소</button>
  </div>
</div>
`
};
