/* ShopJoy - My 채팅 페이지 (#page=myChatt) */
window.MyChatt = {
  name: 'MyChatt',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { reactive, computed, onMounted, watch } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});


    const myStore = window.useFoMyStore();

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MyChatt.js : handleBtnAction -> ', cmd, param);
      // 날짜 필터 조회
      if (cmd === 'searchParam-dateSearch') {
        return onSearch(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MyChatt.js : handleSelectAction -> ', cmd, param);
      // 채팅 열기
      if (cmd === 'chatts-open') {
        return myStore.openChat(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
        handleSearchData();
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const { chats, expandedChat } = Pinia.storeToRefs(myStore);

    const chatPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 50, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const { dateRange, onDateSearch } = window.myDateFilterHelper();

    /* fnBuildParams — 현재 검색조건(기간) → 서버 파라미터 */
    const fnBuildParams = () => ({ dateType: 'reg_date', dateStart: dateRange.start, dateEnd: dateRange.end });

    /* handleLoadPage — 서버사이드 페이징 조회 (현재 chatPager 기준) */
    const handleLoadPage = async () => {
      await myStore.loadChatsPage(fnBuildParams(), chatPager);
    };

    /* handleSearchData — 초기/조회 진입점 */
    const handleSearchData = async () => { await handleLoadPage(); };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* onSearch — 조회 (기간 변경) → 1페이지부터 서버 재조회 */
    const onSearch = async (dateParams) => {
      if (dateParams) { onDateSearch(dateParams); }
      chatPager.pageNo = 1;
      await handleLoadPage();
    };

    /* onPageChange — 페이지 버튼 클릭 → 서버 재조회 (페이징 정책) */
    const onPageChange = async () => { await handleLoadPage(); };

    /* onSizeChange — 페이지크기 변경 → 서버 재조회 */
    const onSizeChange = async () => { await handleLoadPage(); };
    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      handleBtnAction, handleSelectAction, // dispatch
      chats, expandedChat, chatPager, onPageChange, onSizeChange,
    };
  },
  template: /* html */ `
<fo-page bare>
<fo-my-layout :navigate="navigate" :cart-count="cartCount" active-page="myChatt">
  <MyDateFilter @search="handleBtnAction('searchParam-dateSearch', $event)" />
  <!-- ===== ■. 영역 ====================================================== -->
  <PagerHeader :total="chats.length" :pager="chatPager" @size-change="onSizeChange" />
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="!chats.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">
    채팅 내역이 없습니다.
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div v-for="c in chats" :key="c.chatId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;overflow:hidden;">
    <div style="padding:16px;cursor:pointer;display:flex;align-items:center;gap:12px;" @click="handleSelectAction('chatts-open', c)">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
        💬
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">
            {{ c.subject }}
          </span>
          <span v-if="c.unread>0" style="background:var(--blue);color:#fff;font-size:0.7rem;padding:1px 7px;border-radius:20px;font-weight:700;">
            {{ c.unread }}
          </span>
          <span style="font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;"
            :style="c.status==='진행중'?'background:#dcfce7;color:#166534;':'background:var(--blue-dim);color:var(--text-muted);'">
            {{ c.status }}
          </span>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          {{ c.lastMsg || '새 채팅' }}
        </div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;flex-shrink:0;">
        {{ c.date }}
      </div>
    </div>
    <div v-if="expandedChat===c.chatId" style="padding:0 16px 16px;border-top:1px solid var(--border);">
      <div v-for="(msg, mi) in c.messages" :key="mi"
        style="display:flex;margin-top:10px;"
        :style="msg.from==='user'?'justify-content:flex-end;':''">
        <div style="max-width:75%;padding:10px 14px;border-radius:16px;font-size:0.85rem;line-height:1.5;"
          :style="msg.from==='user'?'background:var(--blue);color:#fff;border-bottom-right-radius:4px;':'background:var(--bg-base);color:var(--text-primary);border-bottom-left-radius:4px;'">
          <div>
            {{ msg.text }}
          </div>
          <div style="font-size:0.72rem;margin-top:4px;text-align:right;"
            :style="msg.from==='user'?'color:rgba(255,255,255,0.7);':'color:var(--text-muted);'">
            {{ msg.time }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <Pagination :total="chats.length" :pager="chatPager" @set-page="onPageChange" />
</fo-my-layout>
<!-- ===== □. 영역 ====================================================== -->
</fo-page>
`,
  components: {
    FoPage:      window.FoPage,
    FoMyLayout:    window.foMyLayout,
    PagerHeader: window.PagerHeader,
    Pagination:  window.Pagination,
  }
};
