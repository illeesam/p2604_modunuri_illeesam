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
    const { ref, computed, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const uiState = reactive({ storeInfo: '', isPageCodeLoad: false, selectedStore: null, tabMode: 'col5' });
    const tab = Vue.toRef(uiState, 'tab');

            const openStores = reactive([]);
        const editedStoreInfo = reactive({});

    const storeList = computed(() => {
      const stores = [];
      if (window.useBoAppInitStore) stores.push({ name: 'useBoAppInitStore', label: 'boAppInitStore.js', api: 'getInitData', hasLocalStorage: false });
      if (window.useBoAppStore) stores.push({ name: 'useBoAppStore', label: 'boAppStore.js', api: 'getApp', hasLocalStorage: false });
      if (window.useBoAuthStore) stores.push({ name: 'useBoAuthStore', label: 'boAuthStore.js 💾', api: 'getAuth', hasLocalStorage: true });
      if (window.useBoCodeStore) stores.push({ name: 'useBoCodeStore', label: 'boCodeStore.js', api: 'getCodes', hasLocalStorage: false });
      if (window.useBoConfigStore) stores.push({ name: 'useBoConfigStore', label: 'boConfigStore.js', api: 'getProps', hasLocalStorage: false });
      if (window.useBoMenuStore) stores.push({ name: 'useBoMenuStore', label: 'boMenuStore.js', api: 'getMenus', hasLocalStorage: false });
      if (window.useBoPropStore) stores.push({ name: 'useBoPropStore', label: 'boPropStore.js', api: 'getProps', hasLocalStorage: false });
      if (window.useBoRoleStore) stores.push({ name: 'useBoRoleStore', label: 'boRoleStore.js', api: 'getRoles', hasLocalStorage: false });
      if (window.useFoAppInitStore) stores.push({ name: 'useFoAppInitStore', label: 'foAppInitStore.js', api: 'getInitData', hasLocalStorage: false });
      if (window.useFoAuthStore) stores.push({ name: 'useFoAuthStore', label: 'foAuthStore.js 💾', api: 'getAuth', hasLocalStorage: true });
      if (window.useFoRoleStore) stores.push({ name: 'useFoRoleStore', label: 'foRoleStore.js', api: 'getRoles', hasLocalStorage: false });
      if (window.useFoMenuStore) stores.push({ name: 'useFoMenuStore', label: 'foMenuStore.js', api: 'getMenus', hasLocalStorage: false });
      if (window.useFoCodeStore) stores.push({ name: 'useFoCodeStore', label: 'foCodeStore.js', api: 'getCodes', hasLocalStorage: false });
      if (window.useFoPropStore) stores.push({ name: 'useFoPropStore', label: 'foPropStore.js', api: 'getProps', hasLocalStorage: false });
      if (window.useFoDispStore) stores.push({ name: 'useFoDispStore', label: 'foDispStore.js', api: 'getDisp', hasLocalStorage: false });
      if (window.useFoAppStore) stores.push({ name: 'useFoAppStore', label: 'foAppStore.js', api: 'getApp', hasLocalStorage: false });
      if (window.useFoMyStore) stores.push({ name: 'useFoMyStore', label: 'foMyStore.js', api: null, hasLocalStorage: false });
      return stores;
    });

    const selectStore = (storeName) => {
      uiState.selectedStore = storeName;
      if (!openStores.find(s => s === storeName)) {
        openStores.push(storeName);
      }
      loadStoreData(storeName);
    };

    const loadAllStoreData = () => {
      storeList.value.forEach(store => {
        loadStoreData(store.name);
      });
    };

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

    const closeTab = (storeName) => {
      const idx = openStores.indexOf(storeName);
      if (idx !== -1) openStores.splice(idx, 1);
      if (uiState.selectedStore === storeName) {
        uiState.selectedStore = openStores[Math.max(0, idx - 1)] || null;
        if (uiState.selectedStore) loadStoreData(uiState.selectedStore);
      }
    };

    const copyToClipboard = () => {
      try {
        navigator.clipboard.writeText(uiState.storeInfo);
        showToast('클립보드에 복사되었습니다.', 'success');
      } catch (e) {
        showToast('복사 실패: ' + e.message, 'error');
      }
    };

    const clearStore = () => {
      if (!uiState.selectedStore) return;
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

    const saveStore = () => {
      if (!uiState.selectedStore) return;
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

    const refreshStoreData = async (storeName) => {
      if (!storeName) return;
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

    return {
      uiState, storeList, selectStore, copyToClipboard, clearStore, openStores, closeTab, editedStoreInfo, saveStore, loadAllStoreData, refreshStoreData
    };
  },
  template: `
<div>
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
    <div class="page-title" style="margin: 0;">Store 정보 관리</div>
    <button @click="loadAllStoreData()" style="padding: 8px 16px; font-size: 13px; font-weight: 600; border: none; background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; cursor: pointer; border-radius: 4px; transition: all 0.2s; white-space: nowrap;">🔄 재로드</button>
  </div>

  <!-- Store 선택 탭 + 뷰모드 버튼 -->
  <div style="background: white; border-bottom: 2px solid #e5e7eb; padding: 0 16px; display: flex; align-items: center; justify-content: space-between;">
    <div class="tab-nav" style="display: flex; gap: 4px; overflow-x: auto; flex: 1; border-bottom: 1px solid #e5e7eb;">
      <div v-for="store in storeList" :key="store.name"
        :class="['tab-btn', {active: uiState.selectedStore === store.name}]"
        @click="selectStore(store.name)"
        style="padding: 12px 16px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-size: 13px; font-weight: 500; white-space: nowrap; transition: all 0.15s;">
        {{ store.label }}
      </div>
    </div>

    <!-- 뷰모드 버튼 (탭바 우측) -->
    <div class="tab-modes" style="display: flex; gap: 2px; padding-left: 16px;">
      <button
        :class="{active: uiState.tabMode === 'tab'}"
        @click="uiState.tabMode = 'tab'"
        title="탭 뷰"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">📑</button>
      <button
        :class="{active: uiState.tabMode === 'col1'}"
        @click="uiState.tabMode = 'col1'"
        title="1열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">1</button>
      <button
        :class="{active: uiState.tabMode === 'col2'}"
        @click="uiState.tabMode = 'col2'"
        title="2열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">2</button>
      <button
        :class="{active: uiState.tabMode === 'col3'}"
        @click="uiState.tabMode = 'col3'"
        title="3열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">3</button>
      <button
        :class="{active: uiState.tabMode === 'col4'}"
        @click="uiState.tabMode = 'col4'"
        title="4열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">4</button>
      <button
        :class="{active: uiState.tabMode === 'col5'}"
        @click="uiState.tabMode = 'col5'"
        title="5열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">5</button>
    </div>
  </div>

  <!-- 탭 콘텐츠 영역 (뷰모드별 그리드 레이아웃) -->
  <div :class="['dtl-tab-grid', 'cols-' + (uiState.tabMode === 'col1' ? '1' : uiState.tabMode === 'col2' ? '2' : uiState.tabMode === 'col3' ? '3' : uiState.tabMode === 'col4' ? '4' : uiState.tabMode === 'col5' ? '5' : 'tab')]"
    style="display: grid; gap: 4px; padding: 0; auto-flow: row;">

    <div v-for="store in storeList" :key="store.name"
      v-show="uiState.tabMode === 'tab' ? uiState.selectedStore === store.name : true"
      class="card" style="display: flex; flex-direction: column; height: 100%; padding: 8px;">

      <div v-if="uiState.tabMode !== 'tab'" class="dtl-tab-card-title" style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 12px;">{{ store.label }}</div>

      <div style="flex: 1; margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 11px;">Store State (JSON)</label>
        <textarea
          :value="editedStoreInfo[store.name] || ''"
          @input="editedStoreInfo[store.name] = $event.target.value"
          style="width: 100%; height: 300px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 10px; background: #f5f5f5; resize: vertical;">
        </textarea>
      </div>

      <div style="display: flex; gap: 4px; justify-content: flex-end; padding-top: 6px; border-top: 1px solid #e5e7eb;">
        <button @click="uiState.selectedStore = store.name; clearStore()" style="padding: 6px 12px; font-size: 11px; background: #ef4444; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">지우기</button>
        <button v-if="store.api" @click="refreshStoreData(store.name)" style="padding: 6px 12px; font-size: 11px; background: #3b82f6; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">조회</button>
        <button @click="uiState.selectedStore = store.name; saveStore()" style="padding: 6px 12px; font-size: 11px; background: linear-gradient(135deg, #ff6b9d, #c44569); border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">저장</button>
      </div>
    </div>
  </div>
</div>
  `
};
