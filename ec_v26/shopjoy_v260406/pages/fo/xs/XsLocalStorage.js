/**
 * localStorage 정보 관리 (개발도구)
 */
window.XsLocalStorage = {
  name: 'XsLocalStorage',
  props: {
    navigate:  { type: Function, required: true },        // 페이지 이동
    showToast: { type: Function, default: () => {} },      // 토스트 알림
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;
    const uiStateGlobal = reactive({ loading: false, error: null, isPageCodeLoad: false, filterKey: '', editingKey: null, editingValue: '', valueColWidth: 65, startX: 0, startWidth: 0});
    const codes = reactive({});

    const fnLoadCodes = () => {
      try {
        uiStateGlobal.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    const storageData = reactive([]);
                    const uiState = reactive({ isResizing: false });
        
    const loadStorageData = () => {
      const data = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        data.push({ key, value });
      }
      data.sort((a, b) => a.key.localeCompare(b.key));
      storageData.splice(0, storageData.length, ...data);
    };

    const cfFilteredData = computed(() => {
      const data = Array.isArray(storageData) ? storageData : [];
      if (!uiStateGlobal.filterKey) return data;
      return data.filter(item => item.key.toLowerCase().includes(uiStateGlobal.filterKey.toLowerCase()));
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
      uiStateGlobal.editingKey = key;
      uiStateGlobal.editingValue = value;
    };

    const saveEdit = (key) => {
      if (!key) return;
      try {
        localStorage.setItem(key, uiStateGlobal.editingValue);
        props.showToast('저장되었습니다.', 'success');
        uiStateGlobal.editingKey = null;
        uiStateGlobal.editingValue = '';
        loadStorageData();
      } catch (e) {
        props.showToast('저장 실패: ' + e.message, 'error');
      }
    };

    const cancelEdit = () => {
      uiStateGlobal.editingKey = null;
      uiStateGlobal.editingValue = '';
    };

    const handleDelete = (key) => {
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
      uiStateGlobal.startX = e.clientX;
      uiStateGlobal.startWidth = uiStateGlobal.valueColWidth;
    };

    const handleMouseMove = (e) => {
      if (!uiState.isResizing) return;
      const delta = e.clientX - uiStateGlobal.startX;
      const newWidth = Math.max(30, uiStateGlobal.startWidth + (delta / window.innerWidth * 100));
      const keyWidth = 25;
      const actionWidth = 10;
      const maxValue = 100 - keyWidth - actionWidth;
      uiStateGlobal.valueColWidth = Math.min(maxValue, newWidth);
    };

    const stopResize = () => {
      uiState.isResizing = false;
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      window.addEventListener('mouseup', stopResize);
    });

    onUnmounted(() => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    });

    loadStorageData();

    // -- return ---------------------------------------------------------------

    return {
      storageData, cfFilteredData, uiStateGlobal, uiState,
      loadStorageData, copyValue, startEdit, saveEdit, cancelEdit, handleDelete, clearAllStorage, parseValue, startResize, codes
    };
  },
  template: `
<div style="padding: 20px;">
  <div style="margin-bottom: 24px;">
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">localStorage 정보 관리</h1>
    <p style="margin: 0; font-size: 13px; color: #666;">브라우저 로컬 저장소 데이터 조회 및 편집</p>
  </div>

  <!-- -- 검색 및 액션 바 ------------------------------------------------------ -->
  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <div style="display: flex; gap: 16px; align-items: flex-end;">
      <div style="flex: 1;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 13px; color: #333;">키 검색</label>
        <input
          v-model="uiStateGlobal.filterKey"
          type="text"
          placeholder="키로 검색..."
          style="width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: white; color: #333; transition: all 0.2s;">
      </div>
      <div style="display: flex; gap: 8px;">
        <button @click="loadStorageData" style="padding: 10px 16px; font-size: 12px; border: 1px solid #e5e7eb; background: white; color: #666; cursor: pointer; border-radius: 6px; font-weight: 500; transition: all 0.2s;">🔄 새로고침</button>
        <button @click="clearAllStorage" style="padding: 10px 16px; font-size: 12px; border: 1px solid #ffb3c1; background: #fff5f7; color: #d63384; cursor: pointer; border-radius: 6px; font-weight: 500; transition: all 0.2s;">🗑️ 전체 삭제</button>
      </div>
    </div>
  </div>

  <!-- -- 테이블 ------------------------------------------------------------ -->
  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    <div style="overflow-x: auto; position: relative; user-select: none;" :style="{ cursor: uiState.isResizing ? 'col-resize' : 'auto' }">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #fafafa; border-bottom: 1px solid #e5e7eb;">
            <th style="width: 25%; text-align: left; padding: 12px 16px; font-weight: 600; font-size: 13px; color: #666;">Key</th>
            <th :style="{ width: uiStateGlobal.valueColWidth + '%', textAlign: 'left', padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: '#666', position: 'relative' }">
              Value
              <div
                @mousedown="startResize"
                style="position: absolute; right: -5px; top: 0; width: 10px; height: 100%; cursor: col-resize; background: transparent; display: flex; align-items: center;">
                <div style="width: 1px; height: 80%; background: #ff6b9d; opacity: 0; transition: opacity 0.2s;"></div>
              </div>
            </th>
            <th :style="{ width: (100 - 25 - uiStateGlobal.valueColWidth) + '%', textAlign: 'center', padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: '#666' }">작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cfFilteredData" :key="item.key" style="border-bottom: 1px solid #e5e7eb; transition: all 0.2s;">
            <td style="padding: 12px 16px; word-break: break-all; font-family: 'Monaco', 'Menlo', monospace; font-size: 12px; color: #333;">{{ item.key }}</td>
            <td style="padding: 12px 16px;">
              <template v-if="uiStateGlobal.editingKey === item.key">
                <textarea
                  :value="uiStateGlobal.editingValue"
                  @input="uiStateGlobal.editingValue = $event.target.value"
                  style="width: 100%; height: 80px; padding: 10px; border: 1.5px solid #ff6b9d; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; font-size: 12px; resize: vertical; color: #333;">
                </textarea>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <button @click="saveEdit(item.key)" style="flex: 1; padding: 6px 12px; font-size: 12px; border: none; background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; cursor: pointer; border-radius: 4px; font-weight: 600; transition: all 0.2s;">저장</button>
                  <button @click="cancelEdit" style="flex: 1; padding: 6px 12px; font-size: 12px; border: 1px solid #e5e7eb; background: white; color: #666; cursor: pointer; border-radius: 4px; font-weight: 500; transition: all 0.2s;">취소</button>
                </div>
              </template>
              <template v-else>
                <div style="max-height: 60px; overflow-y: auto; background: #f9f9f9; padding: 10px; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; border: 1px solid #e5e7eb; color: #333;">{{ parseValue(item.value) }}</div>
              </template>
            </td>
            <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
              <button @click="copyValue(item.value)" style="padding: 6px 10px; font-size: 11px; border: 1px solid #e5e7eb; background: white; color: #666; cursor: pointer; border-radius: 4px; font-weight: 500; margin-right: 4px; transition: all 0.2s;">복사</button>
              <button v-if="uiStateGlobal.editingKey !== item.key" @click="startEdit(item.key, item.value)" style="padding: 6px 10px; font-size: 11px; border: 1px solid #e5e7eb; background: white; color: #666; cursor: pointer; border-radius: 4px; font-weight: 500; margin-right: 4px; transition: all 0.2s;">수정</button>
              <button @click="handleDelete(item.key)" style="padding: 6px 10px; font-size: 11px; border: 1px solid #ffb3c1; background: #fff5f7; color: #d63384; cursor: pointer; border-radius: 4px; font-weight: 500; transition: all 0.2s;">삭제</button>
            </td>
          </tr>
          <tr v-if="cfFilteredData.length === 0">
            <td colspan="3" style="text-align: center; padding: 40px; color: #999; font-size: 13px;">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- -- 푸터: 항목 수 ----------------------------------------------------- -->
    <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb; background: #fafafa; font-size: 12px; color: #666;">
      총 <strong>{{ cfFilteredData.length }}</strong>개 항목
    </div>
  </div>
</div>
  `
};
