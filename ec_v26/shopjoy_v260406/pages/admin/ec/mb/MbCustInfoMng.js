/* ShopJoy Admin - 고객종합정보 (고객센터 상담용 통합 조회) */
(function () {
  const { ref, reactive, computed, watch } = Vue;

  const SEARCH_MODES = [
    { id: 'member', label: '고객 검색' },
    { id: 'order',  label: '주문번호' },
    { id: 'claim',  label: '클레임번호' },
  ];

  const PERIOD_OPTS = [
    { id: '1m',   label: '1개월' },
    { id: '3m',   label: '3개월' },
    { id: '6m',   label: '6개월' },
    { id: '1y',   label: '1년',  default: true },
    { id: 'all',  label: '전체' },
    { id: 'custom', label: '직접입력' },
  ];

  const badgeCls = (status) => {
    const map = {
      '활성': 'badge-green', '판매중': 'badge-green', '진행중': 'badge-blue', '처리중': 'badge-blue',
      '완료': 'badge-gray', '종료': 'badge-gray', '배송완료': 'badge-gray', '교환완료': 'badge-gray', '환불완료': 'badge-gray', '취소완료': 'badge-gray', '답변완료': 'badge-gray',
      '취소됨': 'badge-red', '정지': 'badge-red', '품절': 'badge-red', '만료': 'badge-red', '실패': 'badge-red',
      '배송중': 'badge-orange', '배송준비중': 'badge-orange', '결제완료': 'badge-orange', '취소처리중': 'badge-orange', '수거예정': 'badge-orange', '수거완료': 'badge-orange', '환불처리중': 'badge-orange',
      '주문완료': 'badge-blue', '취소요청': 'badge-orange', '반품요청': 'badge-orange', '교환요청': 'badge-orange',
      '요청': 'badge-orange', '예정': 'badge-purple', '발송완료': 'badge-green', '성공': 'badge-green',
    };
    return map[status] || 'badge-gray';
  };

  const channelCls = ch => ({ 'SMS': 'badge-orange', '이메일': 'badge-blue', '카카오': 'badge-purple' }[ch] || 'badge-gray');

  const fmtPrice = v => v != null ? Number(v).toLocaleString() + '원' : '-';

  /* 날짜 문자열(YYYY-MM-DD...) → 날짜만 YYYY-MM-DD 추출 */
  const dateStr = v => v ? String(v).slice(0, 10) : '';

  /* today YYYY-MM-DD */
  const today = () => new Date().toISOString().slice(0, 10);

  /* 기간 옵션 → from 날짜 문자열 */
  const calcFrom = (period, customFrom) => {
    if (period === 'all') return '';
    if (period === 'custom') return customFrom;
    const d = new Date();
    if (period === '1m') d.setMonth(d.getMonth() - 1);
    else if (period === '3m') d.setMonth(d.getMonth() - 3);
    else if (period === '6m') d.setMonth(d.getMonth() - 6);
    else if (period === '1y') d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  };

  /* dateFrom~dateTo 필터 */
  const inRange = (dateVal, from, to) => {
    const d = dateStr(dateVal);
    if (!d) return false;
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  };

  window._mbCustInfoState = window._mbCustInfoState || { tab: 'orders', viewMode: '3col' };
  window.MbCustInfoMng = {
    name: 'MbCustInfoMng',
    props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
    setup(props) {
      /* ── 검색 상태 ── */
      const searchMode   = ref('member');
      const searchInput  = ref('');
      const memberModal  = reactive({ show: false, keyword: '', list: [] });

      /* ── 기간 필터 ── */
      const period     = ref('1y');
      const customFrom = ref('');
      const customTo   = ref(today());

      const dateFrom = computed(() => calcFrom(period.value, customFrom.value));
      const dateTo   = computed(() => period.value === 'custom' ? customTo.value : today());

      /* period 변경 시 custom 초기값 세팅 */
      watch(period, v => {
        if (v === 'custom') {
          const d = new Date(); d.setFullYear(d.getFullYear() - 1);
          customFrom.value = d.toISOString().slice(0, 10);
          customTo.value   = today();
        }
      });

      /* ── 현재 고객 ── */
      const customer = ref(null);

      /* 날짜 필터 헬퍼 */
      const filtered = (list, dateField) =>
        list.filter(r => inRange(r[dateField], dateFrom.value, dateTo.value));

      /* ── 파생 데이터 (computed) ── */
      const custOrders = computed(() =>
        !customer.value ? [] : filtered(
          props.adminData.orders.filter(o => o.userId === customer.value.userId), 'orderDate')
      );
      const custClaims = computed(() =>
        !customer.value ? [] : filtered(
          props.adminData.claims.filter(c => c.userId === customer.value.userId), 'requestDate')
      );
      const custDeliveries = computed(() =>
        !customer.value ? [] : filtered(
          props.adminData.deliveries.filter(d => d.userId === customer.value.userId), 'regDate')
      );
      const custCache = computed(() =>
        !customer.value ? [] : filtered(
          props.adminData.cacheList.filter(c => c.userId === customer.value.userId), 'date')
      );
      const custContacts = computed(() =>
        !customer.value ? [] : filtered(
          props.adminData.contacts.filter(c => c.userId === customer.value.userId), 'date')
      );
      const custChats = computed(() =>
        !customer.value ? [] : filtered(
          props.adminData.chats.filter(c => c.userId === customer.value.userId), 'date')
      );
      const custLoginHist = computed(() =>
        !customer.value ? [] : filtered(
          (props.adminData.loginHistory || []).filter(l => l.userId === customer.value.userId), 'loginDate')
      );
      const custCouponUsage = computed(() =>
        !customer.value ? [] : filtered(
          (props.adminData.couponUsage || []).filter(u => u.userId === customer.value.userId), 'usedDate')
      );
      const custSendHist = computed(() =>
        !customer.value ? [] : filtered(
          (props.adminData.sendHistory || []).filter(s => s.userId === customer.value.userId), 'sendDate')
      );

      /* 캐쉬 잔액 = 전체(필터 미적용) 마지막 레코드 */
      const custCacheBalance = computed(() => {
        if (!customer.value) return 0;
        const all = props.adminData.cacheList.filter(c => c.userId === customer.value.userId);
        if (!all.length) return 0;
        return all.slice().sort((a, b) => a.cacheId - b.cacheId).at(-1)?.balance ?? 0;
      });

      /* ── 고객선택 모달 ── */
      const openMemberModal = () => {
        memberModal.keyword = '';
        memberModal.list = [...props.adminData.members];
        memberModal.show = true;
      };
      const searchMemberModal = () => {
        const kw = memberModal.keyword.trim().toLowerCase();
        memberModal.list = kw
          ? props.adminData.members.filter(m =>
              m.memberNm.includes(kw) || m.email.toLowerCase().includes(kw) || (m.phone || '').includes(kw))
          : [...props.adminData.members];
      };
      const selectMember = (m) => {
        customer.value = m;
        memberModal.show = false;
        searchInput.value = '';
      };

      /* ── 검색 실행 ── */
      const doSearch = () => {
        if (searchMode.value === 'member') { openMemberModal(); return; }
        const kw = searchInput.value.trim();
        if (!kw) { props.showToast('검색어를 입력하세요.', 'error'); return; }
        if (searchMode.value === 'order') {
          const order = props.adminData.orders.find(o => o.orderId === kw);
          if (!order) { props.showToast('해당 주문을 찾을 수 없습니다.', 'error'); return; }
          const mem = props.adminData.members.find(m => m.userId === order.userId);
          if (!mem) { props.showToast('주문의 회원 정보를 찾을 수 없습니다.', 'error'); return; }
          customer.value = mem; searchInput.value = '';
        } else if (searchMode.value === 'claim') {
          const claim = props.adminData.claims.find(c => c.claimId === kw);
          if (!claim) { props.showToast('해당 클레임을 찾을 수 없습니다.', 'error'); return; }
          const mem = props.adminData.members.find(m => m.userId === claim.userId);
          if (!mem) { props.showToast('클레임의 회원 정보를 찾을 수 없습니다.', 'error'); return; }
          customer.value = mem; searchInput.value = '';
        }
      };

      const clearCustomer = () => { customer.value = null; searchInput.value = ''; };

      /* ── 탭 + 뷰모드 ── */
      const histTab = ref(window._mbCustInfoState.tab || 'orders');
      watch(histTab, v => { window._mbCustInfoState.tab = v; });
      const viewMode2 = ref(window._mbCustInfoState.viewMode || 'tab');
      watch(viewMode2, v => { window._mbCustInfoState.viewMode = v; });
      const showTab = (id) => viewMode2.value !== 'tab' || histTab.value === id;

      return {
        searchMode, searchInput, SEARCH_MODES, memberModal,
        period, customFrom, customTo, PERIOD_OPTS, dateFrom, dateTo,
        customer,
        custOrders, custClaims, custDeliveries, custCache, custCacheBalance,
        custContacts, custChats, custLoginHist, custCouponUsage, custSendHist,
        openMemberModal, searchMemberModal, selectMember,
        doSearch, clearCustomer,
        badgeCls, channelCls, fmtPrice,
        histTab, viewMode2, showTab,
      };
    },

    template: /* html */`
<div>
  <div class="page-header">
    <h2 class="page-title">고객종합정보</h2>
  </div>

  <!-- ── 검색 바 ── -->
  <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;padding:14px 20px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.05);display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <!-- 모드 세그먼트 -->
    <div style="display:flex;background:#f0f2f5;border-radius:8px;padding:3px;gap:2px;flex-shrink:0;">
      <button v-for="m in SEARCH_MODES" :key="m.id"
        @click="searchMode=m.id;searchInput=''"
        :style="searchMode===m.id
          ? 'background:#1976d2;color:#fff;border:none;border-radius:6px;padding:6px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;'
          : 'background:transparent;color:#666;border:none;border-radius:6px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all .15s;'">
        {{ m.label }}
      </button>
    </div>

    <!-- 고객 선택 -->
    <template v-if="searchMode==='member'">
      <button @click="openMemberModal"
        style="display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid #1976d2;color:#1976d2;border-radius:8px;padding:7px 18px;font-size:13px;font-weight:600;cursor:pointer;">
        🔍 고객 선택
      </button>
      <span style="font-size:12px;color:#aaa;">이름 · 이메일 · 전화번호로 검색</span>
    </template>

    <!-- 번호 입력 -->
    <template v-else>
      <div style="display:flex;align-items:center;gap:0;background:#f8f9fa;border:1.5px solid #ddd;border-radius:8px;overflow:hidden;flex:1;max-width:360px;">
        <input type="text" v-model="searchInput"
          :placeholder="searchMode==='order'?'주문번호  ex) ORD-2026-025':'클레임번호  ex) CLM-2026-013'"
          style="border:none;background:transparent;padding:8px 14px;font-size:13px;outline:none;flex:1;min-width:0;"
          @keyup.enter="doSearch" />
        <button @click="doSearch"
          style="background:#1976d2;color:#fff;border:none;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">
          조회
        </button>
      </div>
    </template>

    <span style="flex:1;"></span>
    <button v-if="customer" @click="clearCustomer"
      style="background:#f5f5f5;border:1px solid #ddd;color:#666;border-radius:8px;padding:7px 16px;font-size:12px;cursor:pointer;">
      ✕ 초기화
    </button>
  </div>

  <!-- ── 기간 필터 바 ── -->
  <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;padding:10px 20px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
    <span style="font-size:12px;color:#888;font-weight:500;white-space:nowrap;">조회기간</span>
    <div style="display:flex;background:#f0f2f5;border-radius:8px;padding:3px;gap:2px;">
      <button v-for="p in PERIOD_OPTS" :key="p.id"
        @click="period=p.id"
        :style="period===p.id
          ? 'background:#1976d2;color:#fff;border:none;border-radius:6px;padding:4px 13px;font-size:12px;font-weight:600;cursor:pointer;'
          : 'background:transparent;color:#666;border:none;border-radius:6px;padding:4px 13px;font-size:12px;cursor:pointer;'">
        {{ p.label }}
      </button>
    </div>
    <template v-if="period==='custom'">
      <input type="date" v-model="customFrom"
        style="border:1px solid #ddd;border-radius:6px;padding:4px 10px;font-size:12px;outline:none;" />
      <span style="font-size:12px;color:#aaa;">~</span>
      <input type="date" v-model="customTo"
        style="border:1px solid #ddd;border-radius:6px;padding:4px 10px;font-size:12px;outline:none;" />
    </template>
    <span v-else style="font-size:12px;color:#aaa;">
      {{ dateFrom ? dateFrom + ' ~ ' + dateTo : '전체 기간' }}
    </span>
  </div>

  <!-- ── 고객 없음 안내 ── -->
  <div v-if="!customer"
    style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 0;color:#ccc;gap:12px;">
    <div style="font-size:48px;line-height:1;">👤</div>
    <div style="font-size:15px;color:#bbb;">고객을 검색하여 선택하면 종합 정보가 표시됩니다.</div>
    <div style="font-size:12px;color:#d0d0d0;">고객 선택 · 주문번호 · 클레임번호 세 가지 방법으로 조회할 수 있습니다.</div>
  </div>

  <template v-else>

    <!-- ── 1. 고객 프로필 카드 ── -->
    <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);overflow:hidden;">
      <!-- 상단 컬러 배너 -->
      <div :style="'height:6px;background:'+(customer.grade==='VIP'?'linear-gradient(90deg,#9c27b0,#e040fb)':customer.grade==='우수'?'linear-gradient(90deg,#1976d2,#42a5f5)':'linear-gradient(90deg,#78909c,#b0bec5)')"></div>
      <div style="display:flex;align-items:flex-start;gap:20px;padding:20px 24px;">
        <!-- 아바타 -->
        <div :style="'width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;'+(customer.grade==='VIP'?'background:linear-gradient(135deg,#9c27b0,#e040fb);':customer.grade==='우수'?'background:linear-gradient(135deg,#1976d2,#42a5f5);':'background:linear-gradient(135deg,#78909c,#b0bec5);')">
          {{ customer.memberNm[0] }}
        </div>
        <!-- 이름/등급/상태 -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:20px;font-weight:700;color:#212121;">{{ customer.memberNm }}</span>
            <span :class="'badge '+(customer.grade==='VIP'?'badge-purple':customer.grade==='우수'?'badge-blue':'badge-gray')" style="font-size:12px;">{{ customer.grade }}</span>
            <span :class="'badge '+(customer.status==='활성'?'badge-green':'badge-red')" style="font-size:12px;">{{ customer.status }}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px 24px;font-size:13px;color:#555;">
            <span>✉ {{ customer.email }}</span>
            <span>📞 {{ customer.phone || '-' }}</span>
            <span style="color:#999;">가입 {{ customer.joinDate }}</span>
            <span style="color:#999;">최근로그인 {{ customer.lastLogin }}</span>
          </div>
        </div>
        <!-- 핵심 지표 -->
        <div style="display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;">
          <div style="background:#f0f7ff;border:1px solid #bbdefb;border-radius:8px;padding:10px 18px;text-align:center;min-width:88px;">
            <div style="font-size:11px;color:#1976d2;font-weight:600;margin-bottom:2px;">총 주문</div>
            <div style="font-size:20px;font-weight:700;color:#1976d2;">{{ customer.orderCount }}</div>
            <div style="font-size:10px;color:#90a4ae;">건</div>
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 18px;text-align:center;min-width:110px;">
            <div style="font-size:11px;color:#f57f17;font-weight:600;margin-bottom:2px;">총 구매액</div>
            <div style="font-size:17px;font-weight:700;color:#f57f17;">{{ (customer.totalPurchase||0).toLocaleString() }}</div>
            <div style="font-size:10px;color:#90a4ae;">원</div>
          </div>
          <div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;padding:10px 18px;text-align:center;min-width:100px;">
            <div style="font-size:11px;color:#7b1fa2;font-weight:600;margin-bottom:2px;">캐쉬 잔액</div>
            <div style="font-size:17px;font-weight:700;color:#7b1fa2;">{{ custCacheBalance.toLocaleString() }}</div>
            <div style="font-size:10px;color:#90a4ae;">원</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 이력 탭바 + 뷰모드 ── -->
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:histTab==='orders'}"   :disabled="viewMode2!=='tab'" @click="histTab='orders'">🛒 주문이력 <span class="tab-count">{{ custOrders.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='claims'}"   :disabled="viewMode2!=='tab'" @click="histTab='claims'">↩ 클레임이력 <span class="tab-count">{{ custClaims.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='dliv'}"     :disabled="viewMode2!=='tab'" @click="histTab='dliv'">🚚 배송이력 <span class="tab-count">{{ custDeliveries.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='cache'}"    :disabled="viewMode2!=='tab'" @click="histTab='cache'">💰 캐쉬내역 <span class="tab-count">{{ custCache.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='contacts'}" :disabled="viewMode2!=='tab'" @click="histTab='contacts'">📋 문의이력 <span class="tab-count">{{ custContacts.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='chats'}"    :disabled="viewMode2!=='tab'" @click="histTab='chats'">💬 채팅이력 <span class="tab-count">{{ custChats.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='login'}"    :disabled="viewMode2!=='tab'" @click="histTab='login'">🔐 로그인 <span class="tab-count">{{ custLoginHist.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='coupon'}"   :disabled="viewMode2!=='tab'" @click="histTab='coupon'">🎟 쿠폰 <span class="tab-count">{{ custCouponUsage.length }}</span></button>
        <button class="tab-btn" :class="{active:histTab==='send'}"     :disabled="viewMode2!=='tab'" @click="histTab='send'">📨 발송 <span class="tab-count">{{ custSendHist.length }}</span></button>
      </div>
      <div class="tab-view-modes">
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭으로 보기">📑</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열로 보기">1▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열로 보기">2▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열로 보기">3▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열로 보기">4▭</button>
      </div>
    </div>

    <!-- ── 이력 패널 ── -->
    <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

      <!-- ── 주문이력 ── -->
      <div v-show="showTab('orders')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#1976d2;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">주문이력</span>
          <span style="margin-left:2px;background:#e3f2fd;color:#1565c0;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custOrders.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>주문번호</th><th>일시</th><th>상품명</th><th style="text-align:right;">금액</th><th>상태</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custOrders.length">
                <td colspan="5" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">주문 내역이 없습니다.</td>
              </tr>
              <tr v-for="o in custOrders" :key="o.orderId">
                <td><a href="#" @click.prevent="showRefModal('order',o.orderId)" style="color:#1976d2;text-decoration:none;font-weight:500;">{{ o.orderId }}</a></td>
                <td style="color:#888;white-space:nowrap;">{{ o.orderDate }}</td>
                <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="o.prodNm">{{ o.prodNm }}</td>
                <td style="text-align:right;font-weight:600;">{{ fmtPrice(o.totalPrice) }}</td>
                <td><span :class="'badge '+badgeCls(o.status)">{{ o.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 클레임이력 ── -->
      <div v-show="showTab('claims')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#ef5350;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">클레임이력</span>
          <span style="margin-left:2px;background:#ffebee;color:#c62828;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custClaims.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>클레임번호</th><th>유형</th><th>상품명</th><th>상태</th><th>신청일</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custClaims.length">
                <td colspan="5" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">클레임 내역이 없습니다.</td>
              </tr>
              <tr v-for="c in custClaims" :key="c.claimId">
                <td><a href="#" @click.prevent="showRefModal('claim',c.claimId)" style="color:#1976d2;text-decoration:none;font-weight:500;">{{ c.claimId }}</a></td>
                <td>{{ c.type }}</td>
                <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="c.prodNm">{{ c.prodNm }}</td>
                <td><span :class="'badge '+badgeCls(c.status)">{{ c.status }}</span></td>
                <td style="color:#888;white-space:nowrap;">{{ c.requestDate ? c.requestDate.slice(0,10) : '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 배송이력 ── -->
      <div v-show="showTab('dliv')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#00897b;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">배송이력</span>
          <span style="margin-left:2px;background:#e0f2f1;color:#00695c;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custDeliveries.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>배송번호</th><th>주문번호</th><th>택배사</th><th>운송장번호</th><th>상태</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custDeliveries.length">
                <td colspan="5" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">배송 내역이 없습니다.</td>
              </tr>
              <tr v-for="d in custDeliveries" :key="d.dlivId">
                <td style="font-weight:500;">{{ d.dlivId }}</td>
                <td>{{ d.orderId }}</td>
                <td>{{ d.courier || '-' }}</td>
                <td style="color:#888;">{{ d.trackingNo || '-' }}</td>
                <td><span :class="'badge '+badgeCls(d.status)">{{ d.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 캐쉬내역 ── -->
      <div v-show="showTab('cache')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#f57c00;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">캐쉬내역</span>
          <span style="margin-left:2px;background:#fff3e0;color:#e65100;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custCache.length }}건</span>
          <span style="margin-left:auto;font-size:12px;color:#7b1fa2;font-weight:600;">잔액 {{ fmtPrice(custCacheBalance) }}</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>일시</th><th>구분</th><th style="text-align:right;">금액</th><th style="text-align:right;">잔액</th><th>사유</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custCache.length">
                <td colspan="5" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">캐쉬 내역이 없습니다.</td>
              </tr>
              <tr v-for="c in custCache" :key="c.cacheId">
                <td style="color:#888;white-space:nowrap;">{{ c.date }}</td>
                <td><span :class="'badge '+(c.type==='충전'?'badge-blue':'badge-orange')">{{ c.type }}</span></td>
                <td style="text-align:right;font-weight:600;" :style="c.amount>0?'color:#1565c0;':'color:#c62828;'">{{ c.amount > 0 ? '+' : '' }}{{ c.amount.toLocaleString() }}원</td>
                <td style="text-align:right;color:#555;">{{ fmtPrice(c.balance) }}</td>
                <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#666;" :title="c.desc">{{ c.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 문의이력 ── -->
      <div v-show="showTab('contacts')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#5c6bc0;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">문의이력</span>
          <span style="margin-left:2px;background:#e8eaf6;color:#283593;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custContacts.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>접수일</th><th>분류</th><th>제목</th><th>상태</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custContacts.length">
                <td colspan="4" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">문의 내역이 없습니다.</td>
              </tr>
              <tr v-for="c in custContacts" :key="c.inquiryId">
                <td style="color:#888;white-space:nowrap;">{{ c.date ? c.date.slice(0,10) : '' }}</td>
                <td style="white-space:nowrap;">{{ c.category }}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="c.title">{{ c.title }}</td>
                <td><span :class="'badge '+badgeCls(c.status)">{{ c.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 채팅이력 ── -->
      <div v-show="showTab('chats')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#26a69a;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">채팅이력</span>
          <span style="margin-left:2px;background:#e0f2f1;color:#004d40;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custChats.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>일시</th><th>제목</th><th>마지막 메시지</th><th>상태</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custChats.length">
                <td colspan="4" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">채팅 내역이 없습니다.</td>
              </tr>
              <tr v-for="c in custChats" :key="c.chatId">
                <td style="color:#888;white-space:nowrap;">{{ c.date ? c.date.slice(0,10) : '' }}</td>
                <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="c.subject">{{ c.subject }}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#666;" :title="c.lastMsg">{{ c.lastMsg }}</td>
                <td><span :class="'badge '+badgeCls(c.status)">{{ c.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 로그인이력 ── -->
      <div v-show="showTab('login')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#546e7a;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">로그인이력</span>
          <span style="margin-left:2px;background:#eceff1;color:#37474f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custLoginHist.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>일시</th><th>IP</th><th>기기/브라우저</th><th>결과</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custLoginHist.length">
                <td colspan="4" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">로그인 내역이 없습니다.</td>
              </tr>
              <tr v-for="l in custLoginHist" :key="l.loginId">
                <td style="color:#888;white-space:nowrap;">{{ l.loginDate }}</td>
                <td style="color:#666;font-family:monospace;">{{ l.ip }}</td>
                <td style="color:#555;">{{ l.device }}</td>
                <td><span :class="'badge '+badgeCls(l.result)">{{ l.result }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 쿠폰사용이력 ── -->
      <div v-show="showTab('coupon')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#e91e63;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">쿠폰사용이력</span>
          <span style="margin-left:2px;background:#fce4ec;color:#880e4f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custCouponUsage.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>사용일</th><th>쿠폰명</th><th>코드</th><th>주문번호</th><th style="text-align:right;">할인금액</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custCouponUsage.length">
                <td colspan="5" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">쿠폰 사용 내역이 없습니다.</td>
              </tr>
              <tr v-for="u in custCouponUsage" :key="u.usageId">
                <td style="color:#888;white-space:nowrap;">{{ u.usedDate }}</td>
                <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="u.couponNm">{{ u.couponNm }}</td>
                <td style="font-family:monospace;color:#666;font-size:11px;">{{ u.couponCode }}</td>
                <td><a href="#" @click.prevent="showRefModal('order',u.orderId)" style="color:#1976d2;text-decoration:none;font-weight:500;">{{ u.orderId }}</a></td>
                <td style="text-align:right;font-weight:600;color:#e91e63;">-{{ (u.discountAmt||0).toLocaleString() }}원</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 발송이력 ── -->
      <div v-show="showTab('send')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#ff7043;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">발송이력</span>
          <span style="margin-left:2px;background:#fbe9e7;color:#bf360c;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">{{ custSendHist.length }}건</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <table class="admin-table" style="font-size:12px;">
            <thead><tr>
              <th>발송일시</th><th>채널</th><th>제목/내용</th><th>결과</th>
            </tr></thead>
            <tbody>
              <tr v-if="!custSendHist.length">
                <td colspan="4" style="text-align:center;color:#ccc;padding:24px;font-size:13px;">발송 내역이 없습니다.</td>
              </tr>
              <tr v-for="s in custSendHist" :key="s.sendId">
                <td style="color:#888;white-space:nowrap;">{{ s.sendDate }}</td>
                <td><span :class="'badge '+channelCls(s.channelCd)">{{ s.channelCd }}</span></td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;" :title="s.title">{{ s.title }}</td>
                <td><span :class="'badge '+badgeCls(s.statusCd)">{{ s.statusCd }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div><!-- /grid -->
  </template>

  <!-- ── 고객 선택 모달 ── -->
  <div v-if="memberModal && memberModal.show" class="modal-overlay" @click.self="memberModal.show=false">
    <div class="modal-box" style="max-width:760px;width:96%;max-height:85vh;display:flex;flex-direction:column;">
      <div class="modal-header">
        <span class="modal-title">고객 검색</span>
        <span class="modal-close" @click="memberModal.show=false">✕</span>
      </div>
      <div style="flex:1;overflow:auto;padding:0 4px;">
        <div style="display:flex;gap:6px;margin-bottom:14px;">
          <input type="text" class="form-control" v-model="memberModal.keyword"
            placeholder="이름 · 이메일 · 전화번호로 검색" @keyup.enter="searchMemberModal"
            style="flex:1;font-size:13px;" />
          <button class="btn btn-primary btn-sm" @click="searchMemberModal" style="white-space:nowrap;">🔍 검색</button>
        </div>
        <table class="admin-table" style="font-size:12.5px;">
          <thead><tr>
            <th style="width:50px;text-align:center;">ID</th>
            <th style="width:90px;">이름</th>
            <th>이메일</th>
            <th style="width:130px;">전화</th>
            <th style="width:60px;text-align:center;">등급</th>
            <th style="width:60px;text-align:center;">상태</th>
            <th style="width:70px;text-align:right;">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="!memberModal.list.length">
              <td colspan="7" style="text-align:center;color:#bbb;padding:28px;font-size:13px;">검색 결과가 없습니다.</td>
            </tr>
            <tr v-for="m in memberModal.list" :key="m.userId" style="cursor:pointer;" @click="selectMember(m)">
              <td style="text-align:center;color:#aaa;">{{ m.userId }}</td>
              <td style="font-weight:600;color:#1a1a2e;">{{ m.memberNm }}</td>
              <td style="color:#555;">{{ m.email }}</td>
              <td style="color:#666;font-family:monospace;">{{ m.phone || '-' }}</td>
              <td style="text-align:center;"><span :class="'badge '+(m.grade==='VIP'?'badge-purple':m.grade==='우수'?'badge-blue':'badge-gray')">{{ m.grade }}</span></td>
              <td style="text-align:center;"><span :class="'badge '+(m.status==='활성'?'badge-green':'badge-red')">{{ m.status }}</span></td>
              <td style="text-align:right;">
                <button class="btn btn-primary btn-sm" @click.stop="selectMember(m)">선택</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

</div>
`,
  };
})();
