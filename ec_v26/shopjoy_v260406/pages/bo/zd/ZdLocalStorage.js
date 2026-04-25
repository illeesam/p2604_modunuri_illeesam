/**
 * localStorage 정보 관리 (개발도구)
 */
window.ZdLocalStorage = {
  name: 'ZdLocalStorage',
  props: ['navigate', 'adminData', 'showToast'],
  setup(props) {
    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;

    const storageData = reactive([]);
                    const uiState = reactive({ isResizing: false, filterKey: '', editingKey: null, editingValue: '', valueColWidth: 65, startX: 0, startWidth: 0});
        
    const loadStorageData = () => {
      const data = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        data.push({ key, value });
      }
      storageData.splice(0, storageData.length, ...data.sort((a, b) => a.key.localeCompare(b.key)));
    };

    const filteredData = computed(() => {
      if (!uiState.filterKey) return storageData;
      return storageData.filter(item => item.key.toLowerCase().includes(uiState.filterKey.toLowerCase()));
    });

    const copyValue = (value) => {
      try {
        navigator.clipboard.writeText(value);
        props.showToast('클립보드에 복사되었습니다.', 'success');
      } catch (e) {
        props.showToast('복사 실패: ' + e.message, 'error');
      }
    };

    const startEdit = (key, value) => {
      uiState.editingKey = key;
      uiState.editingValue = value;
    };

    const saveEdit = (key) => {
      if (!key) return;
      try {
        localStorage.setItem(key, uiState.editingValue);
        props.showToast('저장되었습니다.', 'success');
        uiState.editingKey = null;
        uiState.editingValue = '';
        loadStorageData();
      } catch (e) {
        props.showToast('저장 실패: ' + e.message, 'error');
      }
    };

    const cancelEdit = () => {
      uiState.editingKey = null;
      uiState.editingValue = '';
    };

    const deleteItem = (key) => {
      if (!confirm(`'${key}'를 삭제하시겠습니까?`)) return;
      try {
        localStorage.removeItem(key);
        props.showToast('삭제되었습니다.', 'success');
        loadStorageData();
      } catch (e) {
        props.showToast('삭제 실패: ' + e.message, 'error');
      }
    };

    const clearAllStorage = () => {
      if (!confirm('localStorage의 모든 데이터를 삭제하시겠습니까?')) return;
      try {
        localStorage.clear();
        props.showToast('모든 데이터가 삭제되었습니다.', 'success');
        loadStorageData();
      } catch (e) {
        props.showToast('삭제 실패: ' + e.message, 'error');
      }
    };

    const parseValue = (value) => {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    };

    const startResize = (e) => {
      uiState.isResizing = true;
      uiState.startX = e.clientX;
      uiState.startWidth = uiState.valueColWidth;
    };

    const handleMouseMove = (e) => {
      if (!uiState.isResizing) return;
      const delta = e.clientX - uiState.startX;
      const newWidth = Math.max(30, uiState.startWidth + (delta / window.innerWidth * 100));
      const keyWidth = 25;
      const actionWidth = 10;
      const maxValue = 100 - keyWidth - actionWidth;
      uiState.valueColWidth = Math.min(maxValue, newWidth);
    };

    const stopResize = () => {
      uiState.isResizing = false;
    };

    onMounted(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResize);
    });

    onUnmounted(() => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    });

    loadStorageData();

    return {
      storageData, uiState, filteredData,
      loadStorageData, copyValue, startEdit, saveEdit, cancelEdit, deleteItem, clearAllStorage, parseValue, startResize
    };
  },
  template: `
<div>
  <div class="page-title">localStorage 정보 관리</div>
  <div class="card">
    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
      <div style="flex: 1;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">키 검색</label>
        <input 
          v-model="uiState.filterKey"
          type="text"
          placeholder="키로 검색..."
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      </div>
      <div style="flex: 0 0 auto; display: flex; gap: 8px; align-items: flex-end;">
        <button @click="loadStorageData" class="btn btn-blue" style="padding: 8px 16px;">새로고침</button>
        <button @click="clearAllStorage" class="btn btn-danger" style="padding: 8px 16px;">전체 삭제</button>
      </div>
    </div>

    <div style="overflow-x: auto; position: relative; user-select: none;" :style="{ cursor: isResizing ? 'col-resize' : 'auto' }">
      <table class="admin-table" style="width: 100%;">
        <thead>
          <tr>
            <th style="width: 25%; text-align: left;">Key</th>
            <th :style="{ width: uiState.valueColWidth + '%', textAlign: 'left', position: 'relative' }">
              Value
              <div
                @mousedown="startResize"
                style="position: absolute; right: -5px; top: 0; width: 10px; height: 100%; cursor: col-resize; background: transparent; display: flex; align-items: center;">
                <div style="width: 1px; height: 80%; background: #0066cc; opacity: 0; transition: opacity 0.2s;"></div>
              </div>
            </th>
            <th :style="{ width: (100 - 25 - uiState.valueColWidth) + '%', textAlign: 'center' }">작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredData" :key="item.key" style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; word-break: break-all;">{{ item.key }}</td>
            <td style="padding: 12px;">
              <template v-if="uiState.editingKey === item.key">
                <textarea
                  :value="uiState.editingValue"
                  @input="uiState.editingValue = $event.target.value"
                  style="width: 100%; height: 80px; padding: 8px; border: 1px solid #0066cc; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;">
                </textarea>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                  <button @click="saveEdit(item.key)" class="btn btn-blue" style="padding: 4px 12px; font-size: 12px;">저장</button>
                  <button @click="cancelEdit" class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;">취소</button>
                </div>
              </template>
              <template v-else>
                <div style="max-height: 60px; overflow-y: auto; background: #f9f9f9; padding: 8px; border-radius: 3px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; border: 1px solid #eee;">{{ parseValue(item.value) }}</div>
              </template>
            </td>
            <td style="padding: 12px; text-align: center; white-space: nowrap;">
              <button @click="copyValue(item.value)" class="btn btn-blue" style="padding: 4px 8px; font-size: 11px; margin-right: 2px;">복사</button>
              <button v-if="uiState.editingKey !== item.key" @click="startEdit(item.key, item.value)" class="btn btn-blue" style="padding: 4px 8px; font-size: 11px; margin-right: 2px;">수정</button>
              <button @click="deleteItem(item.key)" class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">삭제</button>
            </td>
          </tr>
          <tr v-if="filteredData.length === 0">
            <td colspan="3" style="text-align: center; padding: 20px; color: #999;">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="margin-top: 12px; font-size: 12px; color: #666;">총 {{ filteredData.length }}개 항목</div>
  </div>
</div>
  `
};
