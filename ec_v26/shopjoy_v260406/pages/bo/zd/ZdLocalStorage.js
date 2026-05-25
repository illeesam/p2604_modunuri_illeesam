/**
 * localStorage 정보 관리 (개발도구)
 */
window.ZdLocalStorage = {
  name: 'ZdLocalStorage',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    adminData: { type: Object, default: () => ({}) }, // 목업 데이터
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const lsItems = reactive([]);
    const uiState = reactive({ isResizing: false, filterKey: '', editingKey: null, editingValue: '', valueColWidth: 65, startX: 0, startWidth: 0});

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ ZdLocalStorage.js : handleBtnAction -> ', cmd, param);
      // 목록 새로고침
      if (cmd === 'lsItems-reload') {
        return loadStorageData();
      // localStorage 전체 삭제
      } else if (cmd === 'lsItems-clear-all') {
        return clearAllStorage();
      // 행 값 복사 (param: value)
      } else if (cmd === 'lsItems-row-copy') {
        return copyValue(param);
      // 행 수정 시작 (param: { key, value })
      } else if (cmd === 'lsItems-row-edit') {
        return startEdit(param.key, param.value);
      // 행 편집 저장 (param: key)
      } else if (cmd === 'lsItems-row-save') {
        return saveEdit(param);
      // 행 편집 취소
      } else if (cmd === 'lsItems-row-cancel') {
        return cancelEdit();
      // 행 삭제 (param: key)
      } else if (cmd === 'lsItems-row-delete') {
        return deleteItem(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ ZdLocalStorage.js : handleSelectAction -> ', cmd, param);
      // 컬럼 너비 리사이즈 시작 (param: event)
      if (cmd === 'lsItems-col-resize') {
        return startResize(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* loadStorageData — 로드 */
    const loadStorageData = () => {
      const data = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        data.push({ key, value });
      }
      lsItems.splice(0, lsItems.length, ...data.sort((a, b) => a.key.localeCompare(b.key)));
    };

    const cfFilteredItems = computed(() => {
      if (!uiState.filterKey) { return lsItems; }
      return lsItems.filter(item => item.key.toLowerCase().includes(uiState.filterKey.toLowerCase()));
    });

    /* copyValue — 복사 */
    const copyValue = (value) => {
      try {
        navigator.clipboard.writeText(value);
        showToast('클립보드에 복사되었습니다.', 'success');
      } catch (e) {
        showToast('복사 실패: ' + e.message, 'error');
      }
    };

    /* startEdit — 시작 편집 */
    const startEdit = (key, value) => {
      uiState.editingKey = key;
      uiState.editingValue = value;
    };

    /* saveEdit — 저장 */
    const saveEdit = (key) => {
      if (!key) { return; }
      try {
        localStorage.setItem(key, uiState.editingValue);
        showToast('저장되었습니다.', 'success');
        uiState.editingKey = null;
        uiState.editingValue = '';
        loadStorageData();
      } catch (e) {
        showToast('저장 실패: ' + e.message, 'error');
      }
    };

    /* cancelEdit — 취소 */
    const cancelEdit = () => {
      uiState.editingKey = null;
      uiState.editingValue = '';
    };

    /* deleteItem — 삭제 */
    const deleteItem = async (key) => {
      const ok = await showConfirm('삭제', `'${key}'를 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        localStorage.removeItem(key);
        showToast('삭제되었습니다.', 'success');
        loadStorageData();
      } catch (e) {
        showToast('삭제 실패: ' + e.message, 'error');
      }
    };

    /* clearAllStorage — 비우기 */
    const clearAllStorage = async () => {
      const ok = await showConfirm('전체 삭제', 'localStorage의 모든 데이터를 삭제하시겠습니까?');
      if (!ok) { return; }
      try {
        localStorage.clear();
        showToast('모든 데이터가 삭제되었습니다.', 'success');
        loadStorageData();
      } catch (e) {
        showToast('삭제 실패: ' + e.message, 'error');
      }
    };

    /* parseValue — 파싱 값 */
    const parseValue = (value) => {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    };

    /* startResize — 시작 Resize */
    const startResize = (e) => {
      uiState.isResizing = true;
      uiState.startX = e.clientX;
      uiState.startWidth = uiState.valueColWidth;
    };

    /* handleMouseMove — 처리 */
    const handleMouseMove = (e) => {
      if (!uiState.isResizing) { return; }
      const delta = e.clientX - uiState.startX;
      const newWidth = Math.max(30, uiState.startWidth + (delta / window.innerWidth * 100));
      const keyWidth = 25;
      const actionWidth = 10;
      const maxValue = 100 - keyWidth - actionWidth;
      uiState.valueColWidth = Math.min(maxValue, newWidth);
    };

    /* stopResize — 중지 Resize */
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

    const isResizing = Vue.toRef(uiState, 'isResizing');

    // ===== return (템플릿 노출) ===============================================

    return {
      lsItems, uiState,                                                              // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfFilteredItems, isResizing,                                                    // computed / toRef
      parseValue,                                                                     // 헬퍼 (template)
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    localStorage 정보 관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
      <div style="flex: 1;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
          키 검색
        </label>
        <input
          v-model="uiState.filterKey"
          type="text"
          placeholder="키로 검색..."
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      </div>
      <div style="flex: 0 0 auto; display: flex; gap: 8px; align-items: flex-end;">
        <button @click="handleBtnAction('lsItems-reload')" class="btn btn-blue" style="padding: 8px 16px;">
          새로고침
        </button>
        <button @click="handleBtnAction('lsItems-clear-all')" class="btn btn-danger" style="padding: 8px 16px;">
          전체 삭제
        </button>
      </div>
    </div>
    <div style="overflow-x: auto; position: relative; user-select: none;" :style="{ cursor: isResizing ? 'col-resize' : 'auto' }">
      <!-- ===== ■.■.■. 테이블 ================================================= -->
      <table class="bo-table" style="width: 100%;">
        <thead>
          <tr>
            <th style="width: 25%; text-align: left;">
              Key
            </th>
            <th :style="{ width: uiState.valueColWidth + '%', textAlign: 'left', position: 'relative' }">
              Value
              <div
                @mousedown="handleSelectAction('lsItems-col-resize', $event)"
                style="position: absolute; right: -5px; top: 0; width: 10px; height: 100%; cursor: col-resize; background: transparent; display: flex; align-items: center;">
                <div style="width: 1px; height: 80%; background: #0066cc; opacity: 0; transition: opacity 0.2s;">
                </div>
              </div>
            </th>
            <th :style="{ width: (100 - 25 - uiState.valueColWidth) + '%', textAlign: 'center' }">
              작업
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cfFilteredItems" :key="item.key" style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; word-break: break-all;">
              {{ item.key }}
            </td>
            <td style="padding: 12px;">
              <template v-if="uiState.editingKey === item.key">
                <textarea
                  :value="uiState.editingValue"
                  @input="uiState.editingValue = $event.target.value"
                  style="width: 100%; height: 80px; padding: 8px; border: 1px solid #0066cc; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;">
                </textarea>
                  <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button @click="handleBtnAction('lsItems-row-save', item.key)" class="btn btn-blue" style="padding: 4px 12px; font-size: 12px;">
                      저장
                    </button>
                    <button @click="handleBtnAction('lsItems-row-cancel')" class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;">
                      취소
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div style="max-height: 60px; overflow-y: auto; background: #f9f9f9; padding: 8px; border-radius: 3px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; border: 1px solid #eee;">
                    {{ parseValue(item.value) }}
                  </div>
                </template>
              </td>
              <!-- ===== ■.■.■.■.■.■. 영역 ============================================ -->
              <td style="padding: 12px; text-align: center; white-space: nowrap;">
                <button @click="handleBtnAction('lsItems-row-copy', item.value)" class="btn btn-blue" style="padding: 4px 8px; font-size: 11px; margin-right: 2px;">
                  복사
                </button>
                <button v-if="uiState.editingKey !== item.key" @click="handleBtnAction('lsItems-row-edit', { key: item.key, value: item.value })" class="btn btn-blue" style="padding: 4px 8px; font-size: 11px; margin-right: 2px;">
                  수정
                </button>
                <button @click="handleBtnAction('lsItems-row-delete', item.key)" class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">
                  삭제
                </button>
              </td>
            </tr>
            <tr v-if="cfFilteredItems.length === 0">
              <td colspan="3" style="text-align: center; padding: 20px; color: #999;">
                데이터가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top: 12px; font-size: 12px; color: #666;">
        총 {{ cfFilteredItems.length }}개 항목
      </div>
    </div>
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
`
};
