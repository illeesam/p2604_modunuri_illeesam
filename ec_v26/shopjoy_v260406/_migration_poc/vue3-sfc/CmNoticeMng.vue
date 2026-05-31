<!--
  CmNoticeMng.vue — Vue 3 + Vite SFC 변환 체험판
  원본: pages/bo/ec/cm/CmNoticeMng.js (window.CmNoticeMng)

  변환 포인트:
  - window.* 전역 → import 기반 모듈
  - template 문자열 → <template> SFC 블록
  - const { ref, reactive, ... } = Vue → import { ref, reactive, ... } from 'vue'
  - window.boApiSvc → import { cmNotice } from '@/services/boApiSvc'
  - coUtil.cofGrid → composable useGrid()
  - coUtil.cofDetail → composable useDetail()
-->
<template>
  <div>
    <!-- 페이지 타이틀 -->
    <div class="page-title">공지사항관리</div>

    <!-- 검색 영역 -->
    <div class="card">
      <BoSearchArea
        :loading="uiState.loading"
        :columns="baseSearchColumns"
        :param="searchParam"
        @search="handleBtnAction('searchParam-list')"
        @reset="handleBtnAction('searchParam-reset')"
      />
    </div>

    <!-- 목록 영역 -->
    <BoGrid
      :columns="baseGridColumns"
      :rows="notices"
      :pager="baseGrid.pager"
      row-key="noticeId"
      :sort-state="baseGrid"
      list-title="공지사항목록"
      :count-text="`총 ${baseGrid.pager.pageTotalCount}건`"
      :row-class="(row) => baseDetail.selectedId === row.noticeId ? 'active' : ''"
      empty-text="데이터가 없습니다."
      row-actions
      @sort="(key) => handleSelectAction('notices-sort', key)"
      @set-page="(n) => handleSelectAction('notices-pager-setPage', n)"
      @size-change="handleSelectAction('notices-pager-sizeChange')"
      @row-click="(row) => handleSelectAction('notices-rowEdit', row.noticeId)"
    >
      <template #toolbar-actions>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('notices-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('notices-add')">
          + 신규
        </button>
      </template>
      <template #row-actions="{ row }">
        <div class="actions">
          <button class="btn btn-blue btn-xs" @click="handleSelectAction('notices-rowEdit', row.noticeId)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click="handleSelectAction('notices-rowDelete', row)">
            삭제
          </button>
        </div>
      </template>
    </BoGrid>

    <!-- 상세 패널 (인라인 임베드) -->
    <div v-if="baseDetail.selectedId" style="margin-top: 4px">
      <div style="display: flex; justify-content: flex-end; padding: 10px 0 0">
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
          ✕ 닫기
        </button>
      </div>
      <CmNoticeDtl
        :key="baseDetail.panelKey"
        :navigate="inlineNavigate"
        :dtl-id="baseDetail.editId"
        :dtl-mode="baseDetail.dtlMode"
        :reload-trigger="baseDetail.reloadTrigger"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * ##### 변환 핵심 차이점 #####
 *
 * 1. `const { reactive, onMounted } = Vue`  →  `import { reactive, onMounted } from 'vue'`
 * 2. `window.boApiSvc.cmNotice`             →  `import { cmNotice } from '@/services/boApiSvc'`
 * 3. `window.boApp.showToast`               →  `import { useBoApp } from '@/composables/useBoApp'`
 * 4. `coUtil.cofGrid()`                     →  `import { useGrid } from '@/composables/useGrid'`
 * 5. `coUtil.cofDetail()`                   →  `import { useDetail } from '@/composables/useDetail'`
 * 6. `coUtil.cofExportCsv()`               →  `import { exportCsv } from '@/utils/exportCsv'`
 * 7. `coUtil.cofCodeBadge()`               →  `import { codeBadge } from '@/utils/codeBadge'`
 * 8. `window.sfGetBoCodeStore()`            →  `import { useBoCodeStore } from '@/stores/boCodeStore'`
 * 9. props 선언: `defineProps()`
 * 10. 컴포넌트 import: `import CmNoticeDtl from './CmNoticeDtl.vue'`
 */

import { reactive, onMounted } from 'vue'

// --- 가상 import (실제 Vite 프로젝트에서 구현 필요) ---
// import { cmNotice } from '@/services/boApiSvc'
// import { useBoApp } from '@/composables/useBoApp'
// import { useGrid } from '@/composables/useGrid'
// import { useDetail } from '@/composables/useDetail'
// import { useBoCodeStore } from '@/stores/boCodeStore'
// import { exportCsv, codeBadge, cofAnd } from '@/utils/coUtil'
// import { bofGetDateRange, bofGetSiteNm } from '@/utils/boUtil'
// import BoSearchArea from '@/components/BoSearchArea.vue'
// import BoGrid from '@/components/BoGrid.vue'
// import CmNoticeDtl from './CmNoticeDtl.vue'

// --- POC 용 스텁 (실제 구현 시 제거) ---
const boApiSvc = { cmNotice: { getPage: async () => ({ data: { data: { pageList: [], pageTotalCount: 0, pageTotalPage: 1 } } }), remove: async () => ({ status: 200, data: {} }) } }
const showToast = (msg, type) => console.log(`[toast:${type}]`, msg)
const showConfirm = async (title, msg) => window.confirm(`${title}: ${msg}`)
const setApiRes = (res) => console.log('[apiRes]', res)
const useGrid = (onSearch, opts = {}) => {
  const pager = reactive({ pageNo: 1, pageSize: opts.pageSize || 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [] })
  return reactive({
    pager, sortKey: '', sortDir: '',
    sortParam: () => ({}),
    applyPage: (d) => { pager.pageTotalCount = d?.pageTotalCount || 0; return d?.pageList || [] },
    setPage: (n) => { pager.pageNo = n; onSearch() },
    onSort: () => onSearch(),
    onSizeChange: () => { pager.pageNo = 1; onSearch() },
    reset: () => { pager.pageNo = 1 },
  })
}
const useDetail = () => reactive({ selectedId: null, panelKey: 0, editId: null, dtlMode: 'view', reloadTrigger: 0, openNew() { this.selectedId = '__new__'; this.editId = null; this.dtlMode = 'new'; this.panelKey++ }, openEdit(id) { this.selectedId = id; this.editId = id; this.dtlMode = 'view'; this.panelKey++ }, close() { this.selectedId = null }, switchToEdit() { this.dtlMode = 'edit' } })
const codeBadge = (grp, val, fallback) => fallback
const bofGetDateRange = (v) => null
const bofGetSiteNm = () => '메인몰'
const exportCsv = (rows, cols, filename) => console.log('[csv]', filename)

// ========================================================================

/* ##### [01] 초기 변수 정의 #################################################### */

const props = defineProps({
  navigate: { type: Function, required: true },
})

const notices = reactive([])
const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false })
const codes = reactive({ noticeTypes: [], noticeStatuses: [], date_range_opts: [] })

const _initSearchParam = () => {
  const y = new Date().getFullYear()
  return { searchValue: '', type: '', status: '', dateRange: '', dateStart: `${y - 3}-01-01`, dateEnd: `${y}-12-31` }
}
const searchParam = reactive(_initSearchParam())

const baseGrid = useGrid(() => handleSearchList(), { pageSize: 5 })
const baseDetail = useDetail()

/* ##### [02] 액션 모음 (dispatch) ############################################## */

const handleBtnAction = (cmd) => {
  if (cmd === 'searchParam-list')  { baseGrid.pager.pageNo = 1; return handleSearchList() }
  if (cmd === 'searchParam-reset') { Object.assign(searchParam, _initSearchParam()); baseGrid.reset(); return handleSearchList() }
  if (cmd === 'searchParam-dateRange') {
    if (searchParam.dateRange) {
      const r = bofGetDateRange(searchParam.dateRange)
      searchParam.dateStart = r ? r.from : ''
      searchParam.dateEnd   = r ? r.to   : ''
    }
    baseGrid.pager.pageNo = 1
    return
  }
  if (cmd === 'notices-add')   return baseDetail.openNew()
  if (cmd === 'notices-excel') return exportCsv(notices,
    [{ label: 'ID', key: 'noticeId' }, { label: '제목', key: 'noticeTitle' }, { label: '유형', key: 'noticeTypeCd' },
     { label: '상태', key: 'noticeStatusCd' }, { label: '조회수', key: 'viewCount' }, { label: '등록일', key: 'regDate' }],
    '공지목록.csv')
  if (cmd === 'baseDetail-close') return baseDetail.close()
  console.warn('[handleBtnAction] unknown cmd:', cmd)
}

const handleSelectAction = (cmd, param) => {
  if (cmd === 'notices-sort')             return baseGrid.onSort(param)
  if (cmd === 'notices-pager-setPage')    return baseGrid.setPage(param)
  if (cmd === 'notices-pager-sizeChange') return baseGrid.onSizeChange()
  if (cmd === 'notices-rowEdit')          return baseDetail.openEdit(param)
  if (cmd === 'notices-rowDelete')        return handleDelete(param)
  console.warn('[handleSelectAction] unknown cmd:', cmd)
}

/* ##### [03] 초기 함수 ######################################################### */

onMounted(() => {
  handleSearchList()
})

/* ##### [04] 핸들러 ############################################################ */

const handleSearchList = async () => {
  uiState.loading = true
  try {
    const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
                     ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) }
    const d = (await boApiSvc.cmNotice.getPage(params, '공지사항관리', '조회')).data?.data
    const list = baseGrid.applyPage(d)
    notices.splice(0, notices.length, ...list)
    uiState.error = null
  } catch (err) {
    uiState.error = err.message
  } finally {
    uiState.loading = false
  }
}

const handleDelete = async (n) => {
  if (!(await showConfirm('삭제', `[${n.noticeTitle}]을 삭제하시겠습니까?`))) return
  try {
    const res = await boApiSvc.cmNotice.remove(n.noticeId, '공지사항관리', '삭제')
    setApiRes({ ok: true, status: res.status, data: res.data })
    showToast('삭제되었습니다.', 'success')
    if (baseDetail.selectedId === n.noticeId) baseDetail.close()
    await handleSearchList()
  } catch (err) {
    setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message })
    showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0)
  }
}

const inlineNavigate = (pg, opts = {}) => {
  if (pg === 'cmNoticeMng')      { baseDetail.close(); if (opts.reload) handleSearchList(); return }
  if (pg === '__switchToEdit__') return baseDetail.switchToEdit()
  props.navigate(pg, opts)
}

/* ##### [05] 컬럼 정의 ######################################################## */

const _STATUS_FB = { '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' }
const _TYPE_FB   = { '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' }

const baseSearchColumns = [
  { key: 'searchValue', label: '제목', type: 'text', placeholder: '제목 검색' },
  { key: 'type',        label: '유형', type: 'select', options: () => codes.noticeTypes,    nullLabel: '유형 전체' },
  { key: 'status',      label: '상태', type: 'select', options: () => codes.noticeStatuses, nullLabel: '상태 전체' },
  { type: 'label', label: '등록일' },
  { key: 'dateRange', type: 'dateRange', startKey: 'dateStart', endKey: 'dateEnd',
    rangeOptions: () => codes.date_range_opts,
    onRangeChange: () => handleBtnAction('searchParam-dateRange') },
]

const baseGridColumns = [
  { key: 'noticeTypeCd',   label: '유형',     style: 'width:80px;',
    badge: (row) => codeBadge('NOTICE_TYPE', row.noticeTypeCd, _TYPE_FB[row.noticeTypeCd] || 'badge-gray') },
  { key: 'noticeTitle',    label: '제목',     sortKey: 'nm', link: true,
    fmt: (v, row) => row.isFixed === 'Y' ? `📌 ${row.noticeTitle || ''}` : (row.noticeTitle || ''),
    cellInnerStyle: (v, row) => baseDetail.selectedId === row.noticeId ? 'color:#e8587a;font-weight:700;' : '' },
  { key: 'isFixed',        label: '고정',     style: 'width:70px;',
    badge: (row) => row.isFixed === 'Y' ? 'badge-red' : 'badge-gray',
    fmt: (v) => v === 'Y' ? '고정' : '-' },
  { key: 'startDate',      label: '시작일',   style: 'width:120px;', fmt: (v) => v || '-' },
  { key: 'endDate',        label: '종료일',   style: 'width:120px;', fmt: (v) => v || '-' },
  { key: 'noticeStatusCd', label: '상태',     style: 'width:80px;',
    badge: (row) => codeBadge('NOTICE_STATUS', row.noticeStatusCd, _STATUS_FB[row.noticeStatusCd] || 'badge-gray') },
  { key: 'siteNm',         label: '사이트명', style: 'width:110px;', cellStyle: 'color:#2563eb;', fmt: () => bofGetSiteNm() },
  { key: 'regDate',        label: '등록일',   style: 'width:140px;', sortKey: 'reg' },
]
</script>

<style scoped>
/* SFC에서는 scoped CSS 사용 가능 — 기존 adminGlobalStyle 에서 가져올 것 */
</style>
