/* ShopJoy - My 채팅 페이지 (#page=myChatt) */
window.MyChatt = {
  name: 'MyChatt',
  props: ['navigate', 'cartCount'],
  setup(props) {
    const { reactive, onMounted } = Vue;
    const myStore = window.useFrontMyStore();
    const { chats, expandedChat } = Pinia.storeToRefs(myStore);

    const chatPager = reactive({ page: 1, size: 50 });
    const paginate = myStore.paginate;

    const { inRange, onDateSearch } = window.myDateFilterHelper();
    const { computed: _c } = Vue;
    const dateFilteredChats = _c(() => chats.value.filter(c => inRange(c.date)));

    onMounted(() => myStore.loadChats());

    return { myStore, chats, expandedChat, chatPager, paginate, dateFilteredChats, onDateSearch };
  },
  template: /* html */ `
<FrontMyLayout :navigate="navigate" :cart-count="cartCount" active-page="myChatt">

  <MyDateFilter @search="onDateSearch" />
  <PagerHeader :total="dateFilteredChats.length" :pager="chatPager" />
  <div v-if="!dateFilteredChats.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">채팅 내역이 없습니다.</div>

  <div v-for="c in paginate(dateFilteredChats, chatPager)" :key="c.chatId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;overflow:hidden;">
    <div style="padding:16px;cursor:pointer;display:flex;align-items:center;gap:12px;" @click="myStore.openChat(c)">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">💬</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">{{ c.subject }}</span>
          <span v-if="c.unread>0" style="background:var(--blue);color:#fff;font-size:0.7rem;padding:1px 7px;border-radius:20px;font-weight:700;">{{ c.unread }}</span>
          <span style="font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;"
            :style="c.status==='진행중'?'background:#dcfce7;color:#166534;':'background:var(--blue-dim);color:var(--text-muted);'">{{ c.status }}</span>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ c.lastMsg || '새 채팅' }}</div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;flex-shrink:0;">{{ c.date }}</div>
    </div>
    <div v-if="expandedChat===c.chatId" style="padding:0 16px 16px;border-top:1px solid var(--border);">
      <div v-for="(msg, mi) in c.messages" :key="mi"
        style="display:flex;margin-top:10px;"
        :style="msg.from==='user'?'justify-content:flex-end;':''">
        <div style="max-width:75%;padding:10px 14px;border-radius:16px;font-size:0.85rem;line-height:1.5;"
          :style="msg.from==='user'?'background:var(--blue);color:#fff;border-bottom-right-radius:4px;':'background:var(--bg-base);color:var(--text-primary);border-bottom-left-radius:4px;'">
          <div>{{ msg.text }}</div>
          <div style="font-size:0.72rem;margin-top:4px;text-align:right;"
            :style="msg.from==='user'?'color:rgba(255,255,255,0.7);':'color:var(--text-muted);'">{{ msg.time }}</div>
        </div>
      </div>
    </div>
  </div>

  <Pagination :total="chats.length" :pager="chatPager" />

</FrontMyLayout>
  `,
  components: {
    FrontMyLayout:    window.frontMyLayout,
    PagerHeader: window.PagerHeader,
    Pagination:  window.Pagination,
  }
};
