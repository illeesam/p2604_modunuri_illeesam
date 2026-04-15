/* ShopJoy - My 문의 페이지 (#page=myContact) */
window.MyContact = {
  name: 'MyContact',
  props: ['navigate', 'cartCount', 'showToast', 'showConfirm'],
  setup(props) {
    const { reactive, onMounted } = Vue;
    const myStore = window.useFrontMyStore();
    const { inquiries, expandedInquiry } = Pinia.storeToRefs(myStore);

    const inquiryPager = reactive({ page: 1, size: 50 });
    const paginate = myStore.paginate;

    const { inRange, onDateSearch } = window.myDateFilterHelper();
    const { computed: _c } = Vue;
    const dateFilteredInquiries = _c(() => inquiries.value.filter(q => inRange(q.date)));

    const cancelInquiry = async id => {
      const ok = await props.showConfirm('문의 취소', '이 문의를 취소하시겠습니까?', 'warning');
      if (!ok) return;
      const item = inquiries.value.find(x => x.inquiryId === id);
      if (item) item.status = '취소됨';
      props.showToast('문의가 취소되었습니다.', 'success');
    };

    onMounted(() => myStore.loadInquiries());

    return {
      myStore, inquiries, expandedInquiry,
      inquiryPager, paginate, cancelInquiry, dateFilteredInquiries, onDateSearch,
    };
  },
  template: /* html */ `
<FrontMyLayout :navigate="navigate" :cart-count="cartCount" active-page="myContact">

  <MyDateFilter @search="onDateSearch" />
  <PagerHeader :total="dateFilteredInquiries.length" :pager="inquiryPager" />
  <div v-if="!dateFilteredInquiries.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">문의 내역이 없습니다.</div>

  <div v-for="q in paginate(dateFilteredInquiries, inquiryPager)" :key="q.inquiryId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div style="flex:1;cursor:pointer;" @click="expandedInquiry = expandedInquiry===q.inquiryId ? null : q.inquiryId">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:0.75rem;font-weight:700;padding:3px 8px;border-radius:20px;color:#fff;"
            :style="'background:'+myStore.inquiryStatusColor(q.status)">{{ q.status }}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">{{ q.category }}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">{{ q.date }}</span>
        </div>
        <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">{{ q.title }}</div>
      </div>
      <button v-if="q.status==='요청'" @click="cancelInquiry(q.inquiryId)"
        style="padding:6px 14px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.8rem;font-weight:600;white-space:nowrap;">취소</button>
    </div>
    <div v-if="expandedInquiry===q.inquiryId" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
      <div style="background:var(--bg-base);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px;">{{ q.content }}</div>
      <div v-if="q.answer" style="background:var(--blue-dim);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-primary);">
        <span style="font-size:0.78rem;font-weight:700;color:var(--blue);display:block;margin-bottom:4px;">📩 답변</span>
        {{ q.answer }}
      </div>
    </div>
  </div>

  <Pagination :total="inquiries.length" :pager="inquiryPager" />

</FrontMyLayout>
  `,
  components: {
    FrontMyLayout:    window.frontMyLayout,
    PagerHeader: window.PagerHeader,
    Pagination:  window.Pagination,
  }
};
