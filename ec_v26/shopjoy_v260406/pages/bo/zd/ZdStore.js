/**
 * Pinia Store 정보 관리 (개발도구)
 */
window.ZdStore = {
  name: 'ZdStore',
  props: ['navigate', 'adminData', 'showToast'],
  setup(props) {
    const { ref, computed, reactive } = Vue;

    const storeInfo = ref('');
    const selectedStore = ref(null);
    const openStores = reactive([]);
    const viewMode = ref('tab');

    const storeList = computed(() => {
      const stores = [];
      if (window.useBoAppInitStore) stores.push({ name: 'useBoAppInitStore', label: 'BO App Init Store' });
      if (window.useBoAuthStore) stores.push({ name: 'useBoAuthStore', label: 'BO Auth Store' });
      if (window.useBoUserStore) stores.push({ name: 'useBoUserStore', label: 'BO User Store' });
      if (window.useBoRoleStore) stores.push({ name: 'useBoRoleStore', label: 'BO Role Store' });
      if (window.useBoMenuStore) stores.push({ name: 'useBoMenuStore', label: 'BO Menu Store' });
      if (window.useBoCodeStore) stores.push({ name: 'useBoCodeStore', label: 'BO Code Store' });
      if (window.useBoPropStore) stores.push({ name: 'useBoPropStore', label: 'BO Prop Store' });
      if (window.useBoAppStore) stores.push({ name: 'useBoAppStore', label: 'BO App Store' });
      if (window.useFoAppInitStore) stores.push({ name: 'useFoAppInitStore', label: 'FO App Init Store' });
      if (window.useFoAuthStore) stores.push({ name: 'useFoAuthStore', label: 'FO Auth Store' });
      if (window.useFoMemberStore) stores.push({ name: 'useFoMemberStore', label: 'FO Member Store' });
      if (window.useFoRoleStore) stores.push({ name: 'useFoRoleStore', label: 'FO Role Store' });
      if (window.useFoMenuStore) stores.push({ name: 'useFoMenuStore', label: 'FO Menu Store' });
      if (window.useFoCodeStore) stores.push({ name: 'useFoCodeStore', label: 'FO Code Store' });
      if (window.useFoPropStore) stores.push({ name: 'useFoPropStore', label: 'FO Prop Store' });
      if (window.useFoDispStore) stores.push({ name: 'useFoDispStore', label: 'FO Disp Store' });
      if (window.useFoAppStore) stores.push({ name: 'useFoAppStore', label: 'FO App Store' });
      return stores;
    });

    const selectStore = (storeName) => {
      selectedStore.value = storeName;
      if (!openStores.find(s => s === storeName)) {
        openStores.push(storeName);
      }
      loadStoreData(storeName);
    };

    const loadStoreData = (storeName) => {
      try {
        const storeFunc = window[storeName];
        if (storeFunc) {
          const store = storeFunc();
          storeInfo.value = JSON.stringify(store.$state, null, 2);
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

    return {
      storeList, selectedStore, storeInfo, selectStore, copyToClipboard, clearStore, openStores, viewMode, closeTab
    };
  },
  template: `
<div>
  <div class="page-title">Store 정보 관리</div>

  <!-- 탭바 -->
  <div class="tab-bar-row" style="display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
    <div class="tab-nav" style="display: flex; gap: 4px; flex: 1; overflow-x: auto;">
      <div v-for="storeName in openStores" :key="storeName"
        :class="['tab-btn', {active: selectedStore === storeName}]"
        @click="selectStore(storeName)"
        style="position: relative; padding: 8px 12px; background: white; border: 1px solid #d1d5db; border-radius: 4px 4px 0 0; cursor: pointer; min-width: 120px; display: flex; align-items: center; justify-content: space-between; gap: 4px;">
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px;">
          {{ storeList.find(s => s.name === storeName)?.label || storeName }}
        </span>
        <span @click.stop="closeTab(storeName)" style="cursor: pointer; font-size: 10px; opacity: 0.6;">✕</span>
      </div>
    </div>

    <div class="tab-view-modes" style="display: flex; gap: 2px; padding: 8px 0;">
      <button
        :class="{active: viewMode === 'tab'}"
        @click="viewMode = 'tab'"
        title="탭 뷰"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px;">📑</button>
      <button
        :class="{active: viewMode === 'col1'}"
        @click="viewMode = 'col1'"
        title="1열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px;">▭</button>
      <button
        :class="{active: viewMode === 'col2'}"
        @click="viewMode = 'col2'"
        title="2열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px;">▭▭</button>
      <button
        :class="{active: viewMode === 'col3'}"
        @click="viewMode = 'col3'"
        title="3열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px;">▭▭▭</button>
      <button
        :class="{active: viewMode === 'col4'}"
        @click="viewMode = 'col4'"
        title="4열 보기"
        style="padding: 4px 8px; font-size: 12px; border: 1px solid #d1d5db; background: white; cursor: pointer; border-radius: 3px;">▭▭▭▭</button>
    </div>
  </div>

  <div class="card">
    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
      <div style="flex: 1;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Store 추가 선택</label>
        <select
          @change="selectStore($event.target.value); $event.target.value = ''"
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
          <option value="">-- 추가 선택 --</option>
          <option v-for="s in storeList" :key="s.name" :value="s.name" :disabled="openStores.includes(s.name)">{{ s.label }}</option>
        </select>
      </div>
      <div style="flex: 0 0 auto; display: flex; gap: 8px; align-items: flex-end;">
        <button @click="copyToClipboard" class="btn btn-blue" style="padding: 8px 16px;">복사</button>
        <button @click="clearStore" class="btn btn-danger" style="padding: 8px 16px;">초기화</button>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 600;">Store State (JSON)</label>
      <textarea
        v-model="storeInfo"
        readonly
        style="width: 100%; height: 500px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px; background: #f5f5f5;">
      </textarea>
    </div>
  </div>
</div>
  `
};
