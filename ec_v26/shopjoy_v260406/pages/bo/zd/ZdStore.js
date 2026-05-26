/**
 * Pinia Store 정보 관리 (개발도구)
 */
window.ZdStore = {
  name: 'ZdStore',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    adminData: { type: Object, default: () => ({}) }, // 목업 데이터
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, computed, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const uiState = reactive({ storeInfo: '', isPageCodeLoad: false, selectedStore: null, tabMode: '5col' });

    const openStores = reactive([]);
    const editedStoreInfo = reactive({});

    const storeList = computed(() => {
      const stores = [];
      if (window.useBoAppInitStore) { stores.push({ name: 'useBoAppInitStore', label: 'boAppInitStore.js', api: 'getInitData', hasLocalStorage: false }); }
      if (window.useBoAppStore) { stores.push({ name: 'useBoAppStore', label: 'boAppStore.js', api: 'getApp', hasLocalStorage: false }); }
      if (window.useBoAuthStore) { stores.push({ name: 'useBoAuthStore', label: 'boAuthStore.js 💾', api: 'getAuth', hasLocalStorage: true }); }
      if (window.useBoCodeStore) { stores.push({ name: 'useBoCodeStore', label: 'boCodeStore.js', api: 'getCodes', hasLocalStorage: false }); }
      if (window.useBoConfigStore) { stores.push({ name: 'useBoConfigStore', label: 'boConfigStore.js', api: 'getProps', hasLocalStorage: false }); }
      if (window.useBoMenuStore) { stores.push({ name: 'useBoMenuStore', label: 'boMenuStore.js', api: 'getMenus', hasLocalStorage: false }); }
      if (window.useBoPropStore) { stores.push({ name: 'useBoPropStore', label: 'boPropStore.js', api: 'getProps', hasLocalStorage: false }); }
      if (window.useBoRoleStore) { stores.push({ name: 'useBoRoleStore', label: 'boRoleStore.js', api: 'getRoles', hasLocalStorage: false }); }
      if (window.useFoAppInitStore) { stores.push({ name: 'useFoAppInitStore', label: 'foAppInitStore.js', api: 'getInitData', hasLocalStorage: false }); }
      if (window.useFoAuthStore) { stores.push({ name: 'useFoAuthStore', label: 'foAuthStore.js 💾', api: 'getAuth', hasLocalStorage: true }); }
      if (window.useFoRoleStore) { stores.push({ name: 'useFoRoleStore', label: 'foRoleStore.js', api: 'getRoles', hasLocalStorage: false }); }
      if (window.useFoMenuStore) { stores.push({ name: 'useFoMenuStore', label: 'foMenuStore.js', api: 'getMenus', hasLocalStorage: false }); }
      if (window.useFoCodeStore) { stores.push({ name: 'useFoCodeStore', label: 'foCodeStore.js', api: 'getCodes', hasLocalStorage: false }); }
      if (window.useFoPropStore) { stores.push({ name: 'useFoPropStore', label: 'foPropStore.js', api: 'getProps', hasLocalStorage: false }); }
      if (window.useFoDispStore) { stores.push({ name: 'useFoDispStore', label: 'foDispStore.js', api: 'getDisp', hasLocalStorage: false }); }
      if (window.useFoAppStore) { stores.push({ name: 'useFoAppStore', label: 'foAppStore.js', api: 'getApp', hasLocalStorage: false }); }
      if (window.useFoMyStore) { stores.push({ name: 'useFoMyStore', label: 'foMyStore.js', api: null, hasLocalStorage: false }); }
      return stores;
    });

    /* storeTabs — BoTabBar 데이터 (storeList 를 {id, label} 로 변환). storeList 가 computed 라
     *             자체도 computed 로 유지 (여러 reactive 값 조합 케이스 — 정책 허용) */
    const storeTabs = computed(() => storeList.value.map(s => ({ id: s.name, label: s.label })));

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ ZdStore.js : handleBtnAction -> ', cmd, param);
      // 전체 스토어 데이터 재로드
      if (cmd === 'stores-reloadAll') {
        return loadAllStoreData();
      // 현재 선택 스토어 클립보드 복사
      } else if (cmd === 'selectedStore-copy') {
        return copyToClipboard();
      // 스토어 비우기 (param: storeName, 미지정 시 현재 선택)
      } else if (cmd === 'selectedStore-clear') {
        if (param) { uiState.selectedStore = param; }
        return clearStore();
      // 스토어 저장 (param: storeName, 미지정 시 현재 선택)
      } else if (cmd === 'selectedStore-save') {
        if (param) { uiState.selectedStore = param; }
        return saveStore();
      // 스토어 API 재조회 (param: storeName)
      } else if (cmd === 'selectedStore-refresh') {
        return refreshStoreData(param);
      // 스토어 탭 닫기 (param: storeName)
      } else if (cmd === 'stores-closeTab') {
        return closeTab(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ ZdStore.js : handleSelectAction -> ', cmd, param);
      // 좌측 스토어 탭 선택 (param: storeName)
      if (cmd === 'stores-select') {
        return selectStore(param);
      // 뷰모드 변경 (param: 'tab' | '1col'~'5col')
      } else if (cmd === 'tabMode-set') {
        uiState.tabMode = param;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* selectStore — 선택 */
    const selectStore = (storeName) => {
      uiState.selectedStore = storeName;
      if (!openStores.find(s => s === storeName)) {
        openStores.push(storeName);
      }
      loadStoreData(storeName);
    };

    /* loadAllStoreData — 전체 스토어 로드 */
    const loadAllStoreData = () => {
      storeList.value.forEach(store => {
        loadStoreData(store.name);
      });
    };

    /* loadStoreData — 스토어 데이터 로드 */
    const loadStoreData = (storeName) => {
      try {
        const storeFunc = window[storeName];
        if (storeFunc) {
          const store = storeFunc();
          const jsonStr = JSON.stringify(store.$state, null, 2);
          uiState.storeInfo = jsonStr;
          editedStoreInfo[storeName] = jsonStr;
        }
      } catch (e) {
        uiState.storeInfo = `Error: ${e.message}`;
      }
    };

    /* closeTab — 닫기 */
    const closeTab = (storeName) => {
      const idx = openStores.indexOf(storeName);
      if (idx !== -1) { openStores.splice(idx, 1); }
      if (uiState.selectedStore === storeName) {
        uiState.selectedStore = openStores[Math.max(0, idx - 1)] || null;
        if (uiState.selectedStore) { loadStoreData(uiState.selectedStore); }
      }
    };

    /* copyToClipboard — 복사 */
    const copyToClipboard = () => {
      try {
        navigator.clipboard.writeText(uiState.storeInfo);
        showToast('클립보드에 복사되었습니다.', 'success');
      } catch (e) {
        showToast('복사 실패: ' + e.message, 'error');
      }
    };

    /* clearStore — 비우기 */
    const clearStore = () => {
      if (!uiState.selectedStore) { return; }
      try {
        const storeFunc = window[uiState.selectedStore];
        if (storeFunc && storeFunc().clear) {
          storeFunc().clear();
          showToast('스토어가 초기화되었습니다.', 'success');
          selectStore(uiState.selectedStore);
        }
      } catch (e) {
        showToast('초기화 실패: ' + e.message, 'error');
      }
    };

    /* saveStore — 저장 */
    const saveStore = () => {
      if (!uiState.selectedStore) { return; }
      try {
        const jsonStr = editedStoreInfo[uiState.selectedStore];
        const newState = JSON.parse(jsonStr);
        const storeFunc = window[uiState.selectedStore];
        if (storeFunc) {
          const store = storeFunc();
          Object.assign(store.$state, newState);
          showToast('스토어가 저장되었습니다.', 'success');
          loadStoreData(uiState.selectedStore);
        }
      } catch (e) {
        showToast('저장 실패: ' + e.message, 'error');
      }
    };

    /* refreshStoreData — 새로고침 */
    const refreshStoreData = async (storeName) => {
      if (!storeName) { return; }
      const store = storeList.value.find(s => s.name === storeName);
      if (!store || !store.api) {
        showToast('조회 불가능한 스토어입니다.', 'info');
        return;
      }
      try {
        const api = storeName.startsWith('useFo') ? foApi : boApi;
        if (!api || (storeName.startsWith('useFo') && typeof foApi === 'undefined') || (!storeName.startsWith('useFo') && typeof boApi === 'undefined')) {
          showToast('API 클라이언트를 찾을 수 없습니다.', 'error');
          return;
        }
        const endpoint = `/co/cm/${storeName.startsWith('useFo') ? 'fo' : 'bo'}-app-store/${store.api}`;
        const url = store.api === 'getInitData' ? `${endpoint}?names=ALL` : endpoint;
        const res = await api.get(url);
        if (res?.data?.data) {
          const responseData = res.data.data;
          if (responseData) {
            // 항상 응답 데이터 그대로 textarea에 표시
            const jsonStr = JSON.stringify(responseData, null, 2);
            editedStoreInfo[storeName] = jsonStr;
            uiState.selectedStore = storeName;
            uiState.storeInfo = jsonStr;

            // 스토어도 동시에 업데이트
            const storeFunc = window[storeName];
            if (storeFunc) {
              const storeInst = storeFunc();
              if (store.api === 'getInitData') {
                Object.assign(storeInst.$state, responseData);
              } else {
                Object.assign(storeInst.$state, Object.values(responseData)[0]);
              }
            }

            showToast('조회되었습니다.', 'success');
          }
        }
      } catch (e) {
        showToast('조회 실패: ' + e.message, 'error');
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
    };

    onMounted(() => {
      // storeList 는 computed 이므로 .value 필요. 잘못된 .length 검사가 무한 호출 유발 가능 → 안전 가드.
      const list = storeList.value || [];
      if (list.length > 0 && !uiState.selectedStore) {
        selectStore(list[0].name);
      }
      loadAllStoreData();
    });

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, openStores, editedStoreInfo,                                // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                  // dispatch (모든 이벤트 / 액션 라우팅)
      storeList, storeTabs,                                                  // computed
    };
  },
  template: `
<div>
  <!-- ===== ■. 메인 영역 =================================================== -->
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
    <!-- ===== ■.■. 페이지 타이틀 =============================================== -->
    <div class="page-title" style="margin: 0;">
      Store 정보 관리
    </div>
    <button @click="handleBtnAction('stores-reloadAll')" style="padding: 8px 16px; font-size: 13px; font-weight: 600; border: none; background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; cursor: pointer; border-radius: 4px; transition: all 0.2s; white-space: nowrap;">
      🔄 재로드
    </button>
  </div>
  <!-- ===== □.□. 페이지 타이틀 =============================================== -->
  <!-- ===== □. 메인 영역 =================================================== -->
  <!-- ===== ■. Store 선택 탭 + 뷰모드 버튼 ===================================== -->
  <bo-tab-bar :tabs="storeTabs" :tab="uiState.selectedStore" :tab-mode="uiState.tabMode" :max-cols="5"
    @tab-select="name => handleSelectAction('stores-select', name)"
    @mode-select="m => handleSelectAction('tabMode-set', m)" />
  <!-- ===== □. Store 선택 탭 + 뷰모드 버튼 ===================================== -->
  <!-- ===== ■. 탭 콘텐츠 영역 (뷰모드별 그리드 레이아웃) ================================ -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="['dtl-tab-grid', 'cols-' + (uiState.tabMode === 'tab' ? 'tab' : uiState.tabMode.charAt(0))]"
    style="display: grid; gap: 4px; padding: 0; auto-flow: row;">
    <div v-for="store in storeList" :key="store.name"
      v-show="uiState.tabMode === 'tab' ? uiState.selectedStore === store.name : true"
      class="card" style="display: flex; flex-direction: column; height: 100%; padding: 8px;">
      <div v-if="uiState.tabMode !== 'tab'" class="dtl-tab-card-title" style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 12px;">
        {{ store.label }}
      </div>
      <div style="flex: 1; margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 11px;">
          Store State (JSON)
        </label>
        <textarea
          :value="editedStoreInfo[store.name] || ''"
          @input="editedStoreInfo[store.name] = $event.target.value"
          style="width: 100%; height: 300px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 10px; background: #f5f5f5; resize: vertical;">
        </textarea>
        </div>
        <div style="display: flex; gap: 4px; justify-content: flex-end; padding-top: 6px; border-top: 1px solid #e5e7eb;">
          <button @click="handleBtnAction('selectedStore-clear', store.name)" style="padding: 6px 12px; font-size: 11px; background: #ef4444; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
            지우기
          </button>
          <button v-if="store.api" @click="handleBtnAction('selectedStore-refresh', store.name)" style="padding: 6px 12px; font-size: 11px; background: #3b82f6; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
            조회
          </button>
          <button @click="handleBtnAction('selectedStore-save', store.name)" style="padding: 6px 12px; font-size: 11px; background: linear-gradient(135deg, #ff6b9d, #c44569); border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
`
};
