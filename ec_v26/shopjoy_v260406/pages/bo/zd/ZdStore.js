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
      if (window.useBoAppInitStore) stores.push({ name: 'useBoAppInitStore', label: 'stores/bo/boAppInitStore.js', hasLocalStorage: false });
      if (window.useBoAppStore) stores.push({ name: 'useBoAppStore', label: 'stores/bo/boAppStore.js', hasLocalStorage: false });
      if (window.useAuthStore) stores.push({ name: 'useAuthStore', label: 'stores/bo/boAuthStore.js 💾', hasLocalStorage: true });
      if (window.useBoCodeStore) stores.push({ name: 'useBoCodeStore', label: 'stores/bo/boCodeStore.js', hasLocalStorage: false });
      if (window.useConfigStore) stores.push({ name: 'useConfigStore', label: 'stores/bo/boConfigStore.js', hasLocalStorage: false });
      if (window.useBoMenuStore) stores.push({ name: 'useBoMenuStore', label: 'stores/bo/boMenuStore.js', hasLocalStorage: false });
      if (window.useBoPropStore) stores.push({ name: 'useBoPropStore', label: 'stores/bo/boPropStore.js', hasLocalStorage: false });
      if (window.useBoRoleStore) stores.push({ name: 'useBoRoleStore', label: 'stores/bo/boRoleStore.js', hasLocalStorage: false });
      if (window.useBoUserStore) stores.push({ name: 'useBoUserStore', label: 'stores/bo/boUserStore.js 💾', hasLocalStorage: true });
      if (window.useFoAppInitStore) stores.push({ name: 'useFoAppInitStore', label: 'stores/fo/foAppInitStore.js', hasLocalStorage: false });
      if (window.useFoAuthStore) stores.push({ name: 'useFoAuthStore', label: 'stores/fo/foAuthStore.js 💾', hasLocalStorage: true });
      if (window.useFoMemberStore) stores.push({ name: 'useFoMemberStore', label: 'stores/fo/foMemberStore.js 💾', hasLocalStorage: true });
      if (window.useFoRoleStore) stores.push({ name: 'useFoRoleStore', label: 'stores/fo/foRoleStore.js', hasLocalStorage: false });
      if (window.useFoMenuStore) stores.push({ name: 'useFoMenuStore', label: 'stores/fo/foMenuStore.js', hasLocalStorage: false });
      if (window.useFoCodeStore) stores.push({ name: 'useFoCodeStore', label: 'stores/fo/foCodeStore.js', hasLocalStorage: false });
      if (window.useFoPropStore) stores.push({ name: 'useFoPropStore', label: 'stores/fo/foPropStore.js', hasLocalStorage: false });
      if (window.useFoDispStore) stores.push({ name: 'useFoDispStore', label: 'stores/fo/foDispStore.js', hasLocalStorage: false });
      if (window.useFoAppStore) stores.push({ name: 'useFoAppStore', label: 'stores/fo/foAppStore.js', hasLocalStorage: false });
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

    onMounted(() => {
      loadAllStoreData();
      if (storeList.value.length > 0 && !selectedStore.value) {
        selectStore(storeList.value[0].name);
      }
    });

    return {
      storeList, selectedStore, storeInfo, selectStore, copyToClipboard, clearStore, openStores, viewMode, closeTab, editedStoreInfo, saveStore, loadAllStoreData
    };
  },
  template: `
<div>
  <div class="page-title">Store 정보 관리</div>

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
    style="display: grid; gap: 16px; padding: 16px; auto-flow: row;">

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
        <button @click="selectedStore = store.name; copyToClipboard()" class="btn btn-blue" style="padding: 6px 12px; font-size: 12px;">복사</button>
        <button @click="selectedStore = store.name; clearStore()" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">초기화</button>
        <button @click="selectedStore = store.name; saveStore()" class="btn btn-primary" style="padding: 6px 16px; font-size: 12px; background: linear-gradient(135deg, #ff6b9d, #c44569); border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600;">저장</button>
      </div>
    </div>
  </div>
</div>
  `
};
