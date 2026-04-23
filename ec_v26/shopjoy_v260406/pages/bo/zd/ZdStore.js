/**
 * Pinia Store 정보 관리 (개발도구)
 */
window.ZdStore = {
  name: 'ZdStore',
  props: ['navigate', 'adminData', 'showToast'],
  setup(props) {
    const { ref, computed, reactive, onMounted } = Vue;

    const storeInfo = ref('');
    const selectedStore = ref(null);
    const openStores = reactive([]);
    const viewMode = ref('col5');
    const editedStoreInfo = reactive({});

    const storeList = computed(() => {
      const stores = [];
      if (window.useBoAppInitStore) stores.push({ name: 'useBoAppInitStore', label: 'boAppInitStore.js', api: null, hasLocalStorage: false });
      if (window.useBoAppStore) stores.push({ name: 'useBoAppStore', label: 'boAppStore.js', api: null, hasLocalStorage: false });
      if (window.useAuthStore) stores.push({ name: 'useAuthStore', label: 'boAuthStore.js 💾', api: 'getAuth', hasLocalStorage: true });
      if (window.useBoCodeStore) stores.push({ name: 'useBoCodeStore', label: 'boCodeStore.js', api: 'getCodes', hasLocalStorage: false });
      if (window.useConfigStore) stores.push({ name: 'useConfigStore', label: 'boConfigStore.js', api: null, hasLocalStorage: false });
      if (window.useBoMenuStore) stores.push({ name: 'useBoMenuStore', label: 'boMenuStore.js', api: 'getMenus', hasLocalStorage: false });
      if (window.useBoPropStore) stores.push({ name: 'useBoPropStore', label: 'boPropStore.js', api: 'getProps', hasLocalStorage: false });
      if (window.useBoRoleStore) stores.push({ name: 'useBoRoleStore', label: 'boRoleStore.js', api: 'getRoles', hasLocalStorage: false });
      if (window.useFoAppInitStore) stores.push({ name: 'useFoAppInitStore', label: 'foAppInitStore.js', api: null, hasLocalStorage: false });
      if (window.useFoAuthStore) stores.push({ name: 'useFoAuthStore', label: 'foAuthStore.js 💾', api: 'getAuth', hasLocalStorage: true });
      if (window.useFoRoleStore) stores.push({ name: 'useFoRoleStore', label: 'foRoleStore.js', api: 'getRoles', hasLocalStorage: false });
      if (window.useFoMenuStore) stores.push({ name: 'useFoMenuStore', label: 'foMenuStore.js', api: 'getMenus', hasLocalStorage: false });
      if (window.useFoCodeStore) stores.push({ name: 'useFoCodeStore', label: 'foCodeStore.js', api: 'getCodes', hasLocalStorage: false });
      if (window.useFoPropStore) stores.push({ name: 'useFoPropStore', label: 'foPropStore.js', api: 'getProps', hasLocalStorage: false });
      if (window.useFoDispStore) stores.push({ name: 'useFoDispStore', label: 'foDispStore.js', api: 'getDisp', hasLocalStorage: false });
      if (window.useFoAppStore) stores.push({ name: 'useFoAppStore', label: 'foAppStore.js', api: null, hasLocalStorage: false });
      return stores;
    });

    const selectStore = (storeName) => {
      selectedStore.value = storeName;
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
          storeInfo.value = jsonStr;
          editedStoreInfo[storeName] = jsonStr;
        }
      } catch (e) {
        storeInfo.value = `Error: ${e.message}`;
      }
    };

    const closeTab = (storeName) => {
      const idx = openStores.indexOf(storeName);
      if (idx !== -1) openStores.splice(idx, 1);
      if (selectedStore.value === storeName) {
        selectedStore.value = openStores[Math.max(0, idx - 1)] || null;
        if (selectedStore.value) loadStoreData(selectedStore.value);
      }
    };

    const copyToClipboard = () => {
      try {
        navigator.clipboard.writeText(storeInfo.value);
        props.showToast('클립보드에 복사되었습니다.', 'success');
      } catch (e) {
        props.showToast('복사 실패: ' + e.message, 'error');
      }
    };

    const clearStore = () => {
      if (!selectedStore.value) return;
      try {
        const storeFunc = window[selectedStore.value];
        if (storeFunc && storeFunc().clear) {
          storeFunc().clear();
          props.showToast('스토어가 초기화되었습니다.', 'success');
          selectStore(selectedStore.value);
        }
      } catch (e) {
        props.showToast('초기화 실패: ' + e.message, 'error');
      }
    };

    const saveStore = () => {
      if (!selectedStore.value) return;
      try {
        const jsonStr = editedStoreInfo[selectedStore.value];
        const newState = JSON.parse(jsonStr);
        const storeFunc = window[selectedStore.value];
        if (storeFunc) {
          const store = storeFunc();
          Object.assign(store.$state, newState);
          props.showToast('스토어가 저장되었습니다.', 'success');
          loadStoreData(selectedStore.value);
        }
      } catch (e) {
        props.showToast('저장 실패: ' + e.message, 'error');
      }
    };

    const refreshStoreData = async (storeName) => {
      if (!storeName) return;
      const store = storeList.value.find(s => s.name === storeName);
      if (!store || !store.api) {
        props.showToast('조회 불가능한 스토어입니다.', 'info');
        return;
      }
      try {
        const apiName = storeName.startsWith('useFo') ? 'window.foApi' : 'window.boApi';
        const api = storeName.startsWith('useFo') ? window.foApi : window.boApi;
        if (!api) {
          props.showToast('API 클라이언트를 찾을 수 없습니다.', 'error');
          return;
        }
        const res = await api.post(`/co/cm/${storeName.startsWith('useFo') ? 'fo' : 'bo'}-app-store/${store.api}`, '');
        if (res?.data?.data) {
          const storeFunc = window[storeName];
          if (storeFunc) {
            const storeInst = storeFunc();
            const responseData = res.data.data;
            if (responseData) {
              Object.assign(storeInst.$state, Object.values(responseData)[0]);
              const jsonStr = JSON.stringify(storeInst.$state, null, 2);
              editedStoreInfo[storeName] = jsonStr;
              selectedStore.value = storeName;
              storeInfo.value = jsonStr;
              props.showToast('조회되었습니다.', 'success');
            }
          }
        }
      } catch (e) {
        props.showToast('조회 실패: ' + e.message, 'error');
      }
    };

    onMounted(() => {
      loadAllStoreData();
      if (storeList.value.length > 0 && !selectedStore.value) {
        selectStore(storeList.value[0].name);
      }
    });

    return {
      storeList, selectedStore, storeInfo, selectStore, copyToClipboard, clearStore, openStores, viewMode, closeTab, editedStoreInfo, saveStore, loadAllStoreData, refreshStoreData
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
        :class="['tab-btn', {active: selectedStore === store.name}]"
        @click="selectStore(store.name)"
        style="padding: 12px 16px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-size: 13px; font-weight: 500; white-space: nowrap; transition: all 0.15s;">
        {{ store.label }}
      </div>
    </div>

    <!-- 뷰모드 버튼 (탭바 우측) -->
    <div class="tab-view-modes" style="display: flex; gap: 2px; padding-left: 16px;">
      <button
        :class="{active: viewMode === 'tab'}"
        @click="viewMode = 'tab'"
        title="탭 뷰"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">📑</button>
      <button
        :class="{active: viewMode === 'col1'}"
        @click="viewMode = 'col1'"
        title="1열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">1</button>
      <button
        :class="{active: viewMode === 'col2'}"
        @click="viewMode = 'col2'"
        title="2열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">2</button>
      <button
        :class="{active: viewMode === 'col3'}"
        @click="viewMode = 'col3'"
        title="3열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">3</button>
      <button
        :class="{active: viewMode === 'col4'}"
        @click="viewMode = 'col4'"
        title="4열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">4</button>
      <button
        :class="{active: viewMode === 'col5'}"
        @click="viewMode = 'col5'"
        title="5열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px; transition: all 0.15s;">5</button>
    </div>
  </div>

  <!-- 탭 콘텐츠 영역 (뷰모드별 그리드 레이아웃) -->
  <div :class="['dtl-tab-grid', 'cols-' + (viewMode === 'col1' ? '1' : viewMode === 'col2' ? '2' : viewMode === 'col3' ? '3' : viewMode === 'col4' ? '4' : viewMode === 'col5' ? '5' : 'tab')]"
    style="display: grid; gap: 8px; padding: 2px 1px; auto-flow: row;">

    <div v-for="store in storeList" :key="store.name"
      v-show="viewMode === 'tab' ? selectedStore === store.name : true"
      class="card" style="display: flex; flex-direction: column; height: 100%;">

      <div v-if="viewMode !== 'tab'" class="dtl-tab-card-title" style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 13px;">{{ store.label }}</div>

      <div style="flex: 1; margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 12px;">Store State (JSON)</label>
        <textarea
          :value="editedStoreInfo[store.name] || ''"
          @input="editedStoreInfo[store.name] = $event.target.value"
          style="width: 100%; height: 300px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 11px; background: #f5f5f5; resize: vertical;">
        </textarea>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <button v-if="store.api" @click="refreshStoreData(store.name)" class="btn btn-blue" style="padding: 6px 12px; font-size: 12px;">조회</button>
        <button @click="selectedStore = store.name; saveStore()" class="btn btn-primary" style="padding: 6px 16px; font-size: 12px; background: linear-gradient(135deg, #ff6b9d, #c44569); border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600;">저장</button>
      </div>
    </div>
  </div>
</div>
  `
};
