/**
 * Pinia Store 정보 관리 (개발도구)
 */
window.XsStore = {
  name: 'XsStore',
  props: ['navigate', 'showToast'],
  setup(props) {
    const { ref, computed, reactive, onMounted } = Vue;

    const storeInfo = ref('');
    const selectedStore = ref(null);
    const openStores = reactive([]);
    const viewMode = ref('col5');
    const editedStoreInfo = reactive({});

    const storeList = computed(() => {
      const stores = [];
      if (window.useFoAppInitStore) stores.push({ name: 'useFoAppInitStore', label: 'foAppInitStore.js', api: null, hasLocalStorage: false });
      if (window.useFoAppStore) stores.push({ name: 'useFoAppStore', label: 'foAppStore.js', api: null, hasLocalStorage: false });
      if (window.useFoAuthStore) stores.push({ name: 'useFoAuthStore', label: 'foAuthStore.js 💾', api: 'getAuth', hasLocalStorage: true });
      if (window.useFoCodeStore) stores.push({ name: 'useFoCodeStore', label: 'foCodeStore.js', api: 'getCodes', hasLocalStorage: false });
      if (window.useFoDispStore) stores.push({ name: 'useFoDispStore', label: 'foDispStore.js', api: 'getDisp', hasLocalStorage: false });
      if (window.useFoMenuStore) stores.push({ name: 'useFoMenuStore', label: 'foMenuStore.js', api: 'getMenus', hasLocalStorage: false });
      if (window.useFoMyStore) stores.push({ name: 'useFoMyStore', label: 'foMyStore.js', api: null, hasLocalStorage: false });
      if (window.useFoPropStore) stores.push({ name: 'useFoPropStore', label: 'foPropStore.js', api: 'getProps', hasLocalStorage: false });
      if (window.useFoRoleStore) stores.push({ name: 'useFoRoleStore', label: 'foRoleStore.js', api: 'getRoles', hasLocalStorage: false });
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
        const api = window.foApi;
        if (!api) {
          props.showToast('API 클라이언트를 찾을 수 없습니다.', 'error');
          return;
        }
        const res = await api.post(`/co/cm/fo-app-store/${store.api}`, {});
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
<div style="padding: 20px;">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
    <div>
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">Store 정보 관리</h1>
      <p style="margin: 0; font-size: 13px; color: #666;">Pinia 스토어 상태 조회 및 편집</p>
    </div>
    <button @click="loadAllStoreData()" style="padding: 8px 16px; font-size: 13px; font-weight: 600; border: none; background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; cursor: pointer; border-radius: 4px; transition: all 0.2s; white-space: nowrap;">🔄 재로드</button>
  </div>

  <!-- Store 선택 탭 + 뷰모드 버튼 -->
  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
      <div style="display: flex; gap: 4px; overflow-x: auto; flex: 1; min-width: 0;">
        <button v-for="store in storeList" :key="store.name"
          @click="selectStore(store.name)"
          :style="{
            padding: '8px 14px',
            background: selectedStore === store.name ? '#fff0f4' : 'transparent',
            border: 'none',
            borderBottom: selectedStore === store.name ? '3px solid #ff6b9d' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: selectedStore === store.name ? '600' : '500',
            color: selectedStore === store.name ? '#ff6b9d' : '#666',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }">
          {{ store.label }}
        </button>
      </div>

      <!-- 뷰모드 버튼 (탭바 우측) -->
      <div style="display: flex; gap: 4px; padding-left: 16px; flex-shrink: 0;">
        <button
          @click="viewMode = 'tab'"
          :style="{
            padding: '6px 10px',
            fontSize: '13px',
            border: viewMode === 'tab' ? '1.5px solid #ff6b9d' : '1px solid #ddd',
            background: viewMode === 'tab' ? '#fff0f4' : 'white',
            color: viewMode === 'tab' ? '#ff6b9d' : '#666',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: viewMode === 'tab' ? '600' : '500',
            transition: 'all 0.2s'
          }"
          title="탭 뷰">📑</button>
        <button
          @click="viewMode = 'col1'"
          :style="{
            padding: '6px 10px',
            fontSize: '13px',
            border: viewMode === 'col1' ? '1.5px solid #ff6b9d' : '1px solid #ddd',
            background: viewMode === 'col1' ? '#fff0f4' : 'white',
            color: viewMode === 'col1' ? '#ff6b9d' : '#666',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: viewMode === 'col1' ? '600' : '500',
            transition: 'all 0.2s'
          }"
          title="1열 보기">1</button>
        <button
          @click="viewMode = 'col2'"
          :style="{
            padding: '6px 10px',
            fontSize: '13px',
            border: viewMode === 'col2' ? '1.5px solid #ff6b9d' : '1px solid #ddd',
            background: viewMode === 'col2' ? '#fff0f4' : 'white',
            color: viewMode === 'col2' ? '#ff6b9d' : '#666',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: viewMode === 'col2' ? '600' : '500',
            transition: 'all 0.2s'
          }"
          title="2열 보기">2</button>
        <button
          @click="viewMode = 'col3'"
          :style="{
            padding: '6px 10px',
            fontSize: '13px',
            border: viewMode === 'col3' ? '1.5px solid #ff6b9d' : '1px solid #ddd',
            background: viewMode === 'col3' ? '#fff0f4' : 'white',
            color: viewMode === 'col3' ? '#ff6b9d' : '#666',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: viewMode === 'col3' ? '600' : '500',
            transition: 'all 0.2s'
          }"
          title="3열 보기">3</button>
        <button
          @click="viewMode = 'col4'"
          :style="{
            padding: '6px 10px',
            fontSize: '13px',
            border: viewMode === 'col4' ? '1.5px solid #ff6b9d' : '1px solid #ddd',
            background: viewMode === 'col4' ? '#fff0f4' : 'white',
            color: viewMode === 'col4' ? '#ff6b9d' : '#666',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: viewMode === 'col4' ? '600' : '500',
            transition: 'all 0.2s'
          }"
          title="4열 보기">4</button>
        <button
          @click="viewMode = 'col5'"
          :style="{
            padding: '6px 10px',
            fontSize: '13px',
            border: viewMode === 'col5' ? '1.5px solid #ff6b9d' : '1px solid #ddd',
            background: viewMode === 'col5' ? '#fff0f4' : 'white',
            color: viewMode === 'col5' ? '#ff6b9d' : '#666',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: viewMode === 'col5' ? '600' : '500',
            transition: 'all 0.2s'
          }"
          title="5열 보기">5</button>
      </div>
    </div>
  </div>

  <!-- 탭 콘텐츠 영역 (뷰모드별 그리드 레이아웃) -->
  <div :style="{
    display: 'grid',
    gridTemplateColumns: viewMode === 'col1' ? '1fr' : viewMode === 'col2' ? 'repeat(2, 1fr)' : viewMode === 'col3' ? 'repeat(3, 1fr)' : viewMode === 'col4' ? 'repeat(4, 1fr)' : viewMode === 'col5' ? 'repeat(5, 1fr)' : '1fr',
    gap: '4px',
    padding: '0',
    marginTop: '0'
  }">

    <div v-for="store in storeList" :key="store.name"
      v-show="viewMode === 'tab' ? selectedStore === store.name : true"
      style="display: flex; flex-direction: column; height: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

      <div v-if="viewMode !== 'tab'" style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #fafafa; font-weight: 600; font-size: 12px; color: #333;">{{ store.label }}</div>

      <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 320px;">
        <label style="display: block; padding: 8px 12px 4px; font-weight: 600; font-size: 11px; color: #666;">Store State (JSON)</label>
        <textarea
          :value="editedStoreInfo[store.name] || ''"
          @input="editedStoreInfo[store.name] = $event.target.value"
          style="flex: 1; margin: 0 8px 8px; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; font-size: 10px; background: #f9f9f9; resize: none; color: #333; line-height: 1.6;">
        </textarea>
      </div>

      <div style="display: flex; gap: 4px; padding: 8px 12px; border-top: 1px solid #e5e7eb; background: #fafafa;">
        <button v-if="store.api" @click="refreshStoreData(store.name)" style="flex: 1; padding: 6px 10px; font-size: 11px; border: 1px solid #d0e8f2; background: #f0f8fc; color: #0369a1; cursor: pointer; border-radius: 4px; font-weight: 500; transition: all 0.2s;">조회</button>
        <button @click="selectedStore = store.name; saveStore()" style="flex: 1; padding: 6px 10px; font-size: 11px; border: none; background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; cursor: pointer; border-radius: 4px; font-weight: 600; transition: all 0.2s;">저장</button>
      </div>
    </div>
  </div>
</div>
  `
};
