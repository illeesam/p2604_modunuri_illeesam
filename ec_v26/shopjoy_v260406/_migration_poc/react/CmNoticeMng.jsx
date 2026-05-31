/**
 * CmNoticeMng.jsx — React 변환 체험판
 * 원본: pages/bo/ec/cm/CmNoticeMng.js (window.CmNoticeMng)
 *
 * 변환 포인트:
 * - Vue reactive() → useState / useReducer
 * - Vue computed() → useMemo
 * - Vue onMounted() → useEffect(, [])
 * - Vue watch() → useEffect(, [dep])
 * - Vue template v-if/v-for → JSX {cond && ...} / {arr.map(...)}
 * - Vue @click → onClick
 * - Vue :prop → prop={value}
 * - Vue <slot> → children / render props
 * - Vue emit → callback props
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- 가상 import (실제 프로젝트에서 구현 필요) ---
// import { cmNotice } from '@/services/boApiSvc';
// import { useBoApp } from '@/hooks/useBoApp';
// import { useGrid } from '@/hooks/useGrid';
// import { useDetail } from '@/hooks/useDetail';
// import { BoSearchArea } from '@/components/BoSearchArea';
// import { BoGrid } from '@/components/BoGrid';
// import { CmNoticeDtl } from './CmNoticeDtl';

// --- POC 스텁 ---
const boApiSvc = {
  cmNotice: {
    getPage: async () => ({ data: { data: { pageList: [], pageTotalCount: 0, pageTotalPage: 1 } } }),
    remove: async () => ({ status: 200, data: {} }),
  },
};

// ========================================================================
// Custom Hooks (Vue composable → React hook 매핑)
// ========================================================================

/**
 * useGrid — coUtil.cofGrid() 대응
 * Vue: reactive 객체 하나에 pager/sort/액션 통합
 * React: useState + dispatch 패턴
 */
function useGrid(onSearchRef, opts = {}) {
  const [pager, setPager] = useState({
    pageNo: 1,
    pageSize: opts.pageSize || 10,
    pageTotalCount: 0,
    pageTotalPage: 1,
    pageNums: [],
  });
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('');

  const sortParam = useCallback(() => {
    if (!sortKey || !opts.sortMap?.[sortKey]) return {};
    return { sort: opts.sortMap[sortKey][sortDir] || '' };
  }, [sortKey, sortDir]);

  const applyPage = useCallback((d) => {
    const list = d?.pageList || [];
    setPager((prev) => ({
      ...prev,
      pageTotalCount: d?.pageTotalCount || 0,
      pageTotalPage: d?.pageTotalPage || 1,
    }));
    return list;
  }, []);

  const setPage = useCallback((n) => {
    setPager((prev) => ({ ...prev, pageNo: n }));
    // onSearch will be triggered by useEffect watching pager
  }, []);

  const onSort = useCallback((key) => {
    setSortKey(key);
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const onSizeChange = useCallback((size) => {
    setPager((prev) => ({ ...prev, pageNo: 1, pageSize: size }));
  }, []);

  const reset = useCallback(() => {
    setPager((prev) => ({ ...prev, pageNo: 1 }));
  }, []);

  return { pager, setPager, sortKey, sortDir, sortParam, applyPage, setPage, onSort, onSizeChange, reset };
}

/**
 * useDetail — coUtil.cofDetail() 대응
 * Vue: reactive 객체
 * React: useState 분리 관리
 */
function useDetail() {
  const [selectedId, setSelectedId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [dtlMode, setDtlMode] = useState('view');
  const [panelKey, setPanelKey] = useState(0);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const openNew = useCallback(() => {
    setSelectedId('__new__');
    setEditId(null);
    setDtlMode('new');
    setPanelKey((k) => k + 1);
  }, []);

  const openEdit = useCallback((id) => {
    setSelectedId(id);
    setEditId(id);
    setDtlMode('view');
    setPanelKey((k) => k + 1);
  }, []);

  const close = useCallback(() => {
    setSelectedId(null);
  }, []);

  const switchToEdit = useCallback(() => {
    setDtlMode('edit');
  }, []);

  return { selectedId, editId, dtlMode, panelKey, reloadTrigger, openNew, openEdit, close, switchToEdit, setReloadTrigger };
}

// ========================================================================
// Component
// ========================================================================

export default function CmNoticeMng({ navigate }) {

  /* ##### [01] 초기 변수 정의 #################################################### */

  const [notices, setNotices] = useState([]);
  const [uiState, setUiState] = useState({ loading: false, error: null });
  const [searchParam, setSearchParam] = useState(() => initSearchParam());
  const codes = useRef({ noticeTypes: [], noticeStatuses: [], date_range_opts: [] });

  const grid = useGrid(() => handleSearchList(), {
    pageSize: 5,
    sortMap: {
      nm:  { asc: 'noticeTitle asc', desc: 'noticeTitle desc' },
      reg: { asc: 'regDate asc',     desc: 'regDate desc' },
    },
  });

  const detail = useDetail();

  function initSearchParam() {
    const y = new Date().getFullYear();
    return { searchValue: '', type: '', status: '', dateRange: '', dateStart: `${y - 3}-01-01`, dateEnd: `${y}-12-31` };
  }

  /* ##### [02] 액션 모음 (dispatch) ############################################## */

  const handleBtnAction = useCallback((cmd) => {
    switch (cmd) {
      case 'searchParam-list':
        grid.setPager((p) => ({ ...p, pageNo: 1 }));
        handleSearchList();
        break;
      case 'searchParam-reset':
        setSearchParam(initSearchParam());
        grid.reset();
        handleSearchList();
        break;
      case 'notices-add':
        detail.openNew();
        break;
      case 'notices-excel':
        console.log('[csv] 공지목록.csv');
        break;
      case 'baseDetail-close':
        detail.close();
        break;
      default:
        console.warn('[handleBtnAction] unknown cmd:', cmd);
    }
  }, [grid, detail]);

  const handleSelectAction = useCallback((cmd, param) => {
    switch (cmd) {
      case 'notices-sort':             grid.onSort(param); break;
      case 'notices-pager-setPage':    grid.setPage(param); break;
      case 'notices-pager-sizeChange': grid.onSizeChange(param); break;
      case 'notices-rowEdit':          detail.openEdit(param); break;
      case 'notices-rowDelete':        handleDelete(param); break;
      default: console.warn('[handleSelectAction] unknown cmd:', cmd);
    }
  }, [grid, detail]);

  /* ##### [03] 초기 함수 ######################################################### */

  useEffect(() => {
    handleSearchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ##### [04] 핸들러 ############################################################ */

  const handleSearchList = useCallback(async () => {
    setUiState((s) => ({ ...s, loading: true }));
    try {
      const params = {
        pageNo: grid.pager.pageNo,
        pageSize: grid.pager.pageSize,
        ...grid.sortParam(),
        ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)),
      };
      const d = (await boApiSvc.cmNotice.getPage(params)).data?.data;
      const list = grid.applyPage(d);
      setNotices(list);
      setUiState((s) => ({ ...s, loading: false, error: null }));
    } catch (err) {
      setUiState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [grid, searchParam]);

  const handleDelete = useCallback(async (n) => {
    if (!window.confirm(`삭제: [${n.noticeTitle}]을 삭제하시겠습니까?`)) return;
    try {
      await boApiSvc.cmNotice.remove(n.noticeId);
      alert('삭제되었습니다.');
      if (detail.selectedId === n.noticeId) detail.close();
      await handleSearchList();
    } catch (err) {
      alert(err.message || '오류가 발생했습니다.');
    }
  }, [detail, handleSearchList]);

  const inlineNavigate = useCallback((pg, opts = {}) => {
    if (pg === 'cmNoticeMng') {
      detail.close();
      if (opts.reload) handleSearchList();
      return;
    }
    if (pg === '__switchToEdit__') return detail.switchToEdit();
    navigate(pg, opts);
  }, [detail, handleSearchList, navigate]);

  /* ##### [05] 컬럼 정의 ######################################################## */

  const STATUS_FB = { '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' };
  const TYPE_FB   = { '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' };

  const baseGridColumns = useMemo(() => [
    { key: 'noticeTypeCd',   label: '유형',     style: { width: 80 },
      badge: (row) => TYPE_FB[row.noticeTypeCd] || 'badge-gray' },
    { key: 'noticeTitle',    label: '제목',     sortKey: 'nm', link: true,
      fmt: (v, row) => row.isFixed === 'Y' ? `📌 ${row.noticeTitle || ''}` : (row.noticeTitle || ''),
      cellStyle: (v, row) => detail.selectedId === row.noticeId ? { color: '#e8587a', fontWeight: 700 } : {} },
    { key: 'isFixed',        label: '고정',     style: { width: 70 },
      badge: (row) => row.isFixed === 'Y' ? 'badge-red' : 'badge-gray',
      fmt: (v) => v === 'Y' ? '고정' : '-' },
    { key: 'startDate',      label: '시작일',   style: { width: 120 }, fmt: (v) => v || '-' },
    { key: 'endDate',        label: '종료일',   style: { width: 120 }, fmt: (v) => v || '-' },
    { key: 'noticeStatusCd', label: '상태',     style: { width: 80 },
      badge: (row) => STATUS_FB[row.noticeStatusCd] || 'badge-gray' },
    { key: 'siteNm',         label: '사이트명', style: { width: 110, color: '#2563eb' }, fmt: () => '메인몰' },
    { key: 'regDate',        label: '등록일',   style: { width: 140 }, sortKey: 'reg' },
  ], [detail.selectedId]);

  /* ##### [06] JSX 렌더 ######################################################## */

  return (
    <div>
      {/* 페이지 타이틀 */}
      <div className="page-title">공지사항관리</div>

      {/* 검색 영역 */}
      <div className="card">
        <SearchArea
          loading={uiState.loading}
          searchParam={searchParam}
          onParamChange={setSearchParam}
          onSearch={() => handleBtnAction('searchParam-list')}
          onReset={() => handleBtnAction('searchParam-reset')}
        />
      </div>

      {/* 목록 영역 */}
      <div className="card" style={{ marginTop: 8 }}>
        <div className="toolbar">
          <span className="list-title">공지사항목록</span>
          <span className="list-count">총 {grid.pager.pageTotalCount}건</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn btn-green btn-sm" onClick={() => handleBtnAction('notices-excel')}>
              📥 엑셀
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => handleBtnAction('notices-add')}>
              + 신규
            </button>
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36, textAlign: 'center' }}>번호</th>
              {baseGridColumns.map((col) => (
                <th key={col.key} style={col.style || {}}>
                  {col.label}
                  {col.sortKey && (
                    <button className="sort-btn" onClick={() => handleSelectAction('notices-sort', col.sortKey)}>
                      {grid.sortKey === col.sortKey ? (grid.sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                    </button>
                  )}
                </th>
              ))}
              <th style={{ width: 100 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {notices.length === 0 ? (
              <tr>
                <td colSpan={baseGridColumns.length + 2} style={{ textAlign: 'center', color: '#999' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              notices.map((row, idx) => (
                <tr
                  key={row.noticeId}
                  className={detail.selectedId === row.noticeId ? 'active' : ''}
                  onClick={() => handleSelectAction('notices-rowEdit', row.noticeId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ textAlign: 'center' }}>
                    {(grid.pager.pageNo - 1) * grid.pager.pageSize + idx + 1}
                  </td>
                  {baseGridColumns.map((col) => {
                    const raw = row[col.key];
                    const display = col.fmt ? col.fmt(raw, row) : raw;
                    const badgeClass = col.badge ? col.badge(row) : null;
                    const dynStyle = typeof col.cellStyle === 'function' ? col.cellStyle(raw, row) : {};
                    return (
                      <td key={col.key} style={{ fontSize: 12, ...dynStyle }}>
                        {badgeClass
                          ? <span className={`badge ${badgeClass}`}>{display}</span>
                          : col.link
                            ? <span className="title-link">{display}</span>
                            : display}
                      </td>
                    );
                  })}
                  <td>
                    <div className="actions">
                      <button className="btn btn-blue btn-xs" onClick={(e) => { e.stopPropagation(); handleSelectAction('notices-rowEdit', row.noticeId); }}>
                        수정
                      </button>
                      <button className="btn btn-danger btn-xs" onClick={(e) => { e.stopPropagation(); handleSelectAction('notices-rowDelete', row); }}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* 페이지네이션 (실제 구현 시 <Pagination> 컴포넌트) */}
        <div className="pagination" style={{ marginTop: 8 }}>
          <span>Page {grid.pager.pageNo} / {grid.pager.pageTotalPage}</span>
        </div>
      </div>

      {/* 상세 패널 (인라인 임베드) */}
      {detail.selectedId && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0 0' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBtnAction('baseDetail-close')}>
              ✕ 닫기
            </button>
          </div>
          {/* <CmNoticeDtl key={detail.panelKey} navigate={inlineNavigate} dtlId={detail.editId} dtlMode={detail.dtlMode} reloadTrigger={detail.reloadTrigger} /> */}
          <div className="card" style={{ padding: 16, color: '#666' }}>
            [CmNoticeDtl placeholder — dtlId: {detail.editId}, mode: {detail.dtlMode}]
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================================
// SearchArea 서브 컴포넌트 (BoSearchArea 대응 — 인라인 POC)
// ========================================================================

function SearchArea({ loading, searchParam, onParamChange, onSearch, onReset }) {
  const handleChange = (key, value) => {
    onParamChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="search-bar">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="search-label">제목</label>
        <input
          className="form-control"
          style={{ width: 200 }}
          value={searchParam.searchValue}
          onChange={(e) => handleChange('searchValue', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="제목 검색"
        />
        <label className="search-label">시작일</label>
        <input
          className="form-control"
          type="date"
          style={{ width: 150 }}
          value={searchParam.dateStart}
          onChange={(e) => handleChange('dateStart', e.target.value)}
        />
        <label className="search-label">종료일</label>
        <input
          className="form-control"
          type="date"
          style={{ width: 150 }}
          value={searchParam.dateEnd}
          onChange={(e) => handleChange('dateEnd', e.target.value)}
        />
      </div>
      <div className="search-actions" style={{ marginTop: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={onSearch} disabled={loading}>
          {loading ? '조회중...' : '🔍 조회'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onReset} style={{ marginLeft: 4 }}>
          초기화
        </button>
      </div>
    </div>
  );
}
