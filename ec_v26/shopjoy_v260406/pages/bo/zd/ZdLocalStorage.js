/**
 * localStorage 정보 관리 (개발도구)
 */
window.ZdLocalStorage = {
  name: 'ZdLocalStorage',
  props: ['navigate', 'adminData', 'showToast'],
  setup(props) {
    const { ref, computed } = Vue;

    const storageData = ref([]);
    const filterKey = ref('');
    const editKey = ref('');
    const editValue = ref('');

    const loadStorageData = () => {
      const data = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        data.push({ key, value });
      }
      storageData.value = data.sort((a, b) => a.key.localeCompare(b.key));
    };

    const filteredData = computed(() => {
      if (!filterKey.value) return storageData.value;
      return storageData.value.filter(item => item.key.toLowerCase().includes(filterKey.value.toLowerCase()));
    });

    const copyValue = (value) => {
      try {
        navigator.clipboard.writeText(value);
        props.showToast('클립보드에 복사되었습니다.', 'success');
      } catch (e) {
        props.showToast('복사 실패: ' + e.message, 'error');
      }
    };

    const editItem = (key, value) => {
      editKey.value = key;
      editValue.value = value;
    };

    const saveEdit = () => {
      if (!editKey.value) return;
      try {
        localStorage.setItem(editKey.value, editValue.value);
        props.showToast('저장되었습니다.', 'success');
        editKey.value = '';
        editValue.value = '';
        loadStorageData();
      } catch (e) {
        props.showToast('저장 실패: ' + e.message, 'error');
      }
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

    loadStorageData();

    return {
      storageData, filterKey, filteredData, editKey, editValue,
      loadStorageData, copyValue, editItem, saveEdit, deleteItem, clearAllStorage, parseValue
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
          v-model="filterKey"
          type="text"
          placeholder="키로 검색..."
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      </div>
      <div style="flex: 0 0 auto; display: flex; gap: 8px; align-items: flex-end;">
        <button @click="loadStorageData" class="btn btn-blue" style="padding: 8px 16px;">새로고침</button>
        <button @click="clearAllStorage" class="btn btn-danger" style="padding: 8px 16px;">전체 삭제</button>
      </div>
    </div>

    <div v-if="editKey" style="margin-bottom: 16px; padding: 16px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0;">수정: {{ editKey }}</h3>
      <textarea 
        v-model="editValue"
        style="width: 100%; height: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px; margin-bottom: 12px;">
      </textarea>
      <div style="display: flex; gap: 8px;">
        <button @click="saveEdit" class="btn btn-blue">저장</button>
        <button @click="editKey = ''" class="btn btn-secondary">취소</button>
      </div>
    </div>

    <div style="overflow-x: auto;">
      <table class="admin-table" style="width: 100%;">
        <thead>
          <tr>
            <th style="width: 30%; text-align: left;">Key</th>
            <th style="width: 60%; text-align: left;">Value</th>
            <th style="width: 10%; text-align: center;">작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredData" :key="item.key" style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; word-break: break-all;">{{ item.key }}</td>
            <td style="padding: 12px; max-height: 100px; overflow-y: auto; background: #f9f9f9; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all;">{{ parseValue(item.value) }}</td>
            <td style="padding: 12px; text-align: center;">
              <button @click="copyValue(item.value)" class="btn btn-blue" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">복사</button>
              <button @click="editItem(item.key, item.value)" class="btn btn-blue" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">수정</button>
              <button @click="deleteItem(item.key)" class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;">삭제</button>
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
