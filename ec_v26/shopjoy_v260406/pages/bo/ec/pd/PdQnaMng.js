/* ShopJoy Admin - 상품Q&A관리 */
window.PdQnaMng = {
  name: 'PdQnaMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);
    const members = reactive([]);
    const qnas = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      qna_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.qna_statuses = codeStore.snGetGrpCodes('QNA_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const [qnasRes, prodsRes, membersRes] = await Promise.all([
          window.boApi.get('/bo/ec/pd/qna/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/pd/prod/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/mb/member/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        qnas.splice(0, qnas.length, ...(qnasRes.data?.data?.list || []));
        products.splice(0, products.length, ...(prodsRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PdQna 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const pager      = reactive({ page: 1, size: 20 });
