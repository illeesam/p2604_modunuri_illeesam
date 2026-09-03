/* BoLite.js — 메인 프로젝트(shopjoy_v260406)의 components/comp/{BoAreaComp,BoComp}.js 가 정의하는
 * BoGrid / BoFormArea / BoGridCrud / BoPager 의 "columns 속성화" 계약(키/라벨/타입/fmt/badge/align 등)을
 * 그대로 따르는 EcCdnApi 전용 경량 로컬 포트다. 원본은 Pinia 스토어·coUtil·boUtil 등 메인 프로젝트
 * 전역에 깊이 의존해 EcCdnApi(완전 별도 배포 단위, 그런 전역이 아예 없음)에 그대로 옮길 수 없어서,
 * 이 3개 화면(CfAuthTest/CfClientMng/CfFileMng)에 실제로 필요한 기능만 골라 독립 구현했다.
 * BoPager 는 원본이 자체 완결형(외부 의존 없음)이라 그대로 포팅했다.
 * (2026-09-06: "<bo-grid <bo-grid-crud <bo-form <bo-pager 적극적용해줘" 요청사항)
 */
(function (global) {
  const { computed } = Vue;

  /** BoPager — components/comp/BoComp.js 의 window.BoPager 원본 그대로(외부 의존 없음). pager 는
   *  요청+응답 필드를 한 reactive 객체에 함께 담아 부모가 참조로 넘긴다(pageNo/pageSize/pageTotalCount/
   *  pageTotalPage/pageSizes) — 메인 프로젝트 "pager_rename_to_gridname_pager" 관례와 동일. */
  global.BoPager = {
    name: 'BoPager',
    props: {
      pager: { type: Object, default: () => ({ pageNo: 1, pageTotalPage: 1, pageSize: 20, pageSizes: [5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000] }) },
      onSetPage: { type: Function, default: () => {} },
      onSizeChange: { type: Function, default: () => {} },
      pageWindow: { type: Number, default: 10 },
      showPages: { type: Boolean, default: true },
      loadedCount: { type: Number, default: null },
    },
    setup(props) {
      const cfPageNums = computed(() => {
        const total = Math.max(1, props.pager?.pageTotalPage || 1);
        const cur = Math.min(Math.max(1, props.pager?.pageNo || 1), total);
        const win = Math.max(1, props.pageWindow);
        let start = Math.max(1, cur - Math.floor(win / 2));
        let end = Math.min(total, start + win - 1);
        start = Math.max(1, end - win + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      });
      return { cfPageNums };
    },
    template: `
      <div v-if="pager" class="pagination">
        <div class="pager-left">
          <span v-if="pager.pageTotalCount != null" class="list-count">
            총 {{ pager.pageTotalCount }}건<template v-if="!showPages && loadedCount != null"> · 조회 {{ loadedCount }}건</template>
          </span>
        </div>
        <div v-if="showPages" class="pager">
          <button :disabled="pager.pageNo === 1" @click="onSetPage(1)" title="처음">1</button>
          <button :disabled="pager.pageNo === 1" @click="onSetPage(pager.pageNo - 1)">‹</button>
          <button v-for="n in cfPageNums" :key="n" :class="{ active: pager.pageNo === n }" @click="onSetPage(n)">{{ n }}</button>
          <button :disabled="pager.pageNo === pager.pageTotalPage" @click="onSetPage(pager.pageNo + 1)">›</button>
          <button :disabled="pager.pageNo === pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)" title="마지막">{{ pager.pageTotalPage }}</button>
        </div>
        <div v-if="showPages" class="pager-right">
          <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
            <option v-for="s in (pager.pageSizes || [])" :key="s" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    `,
  };

  /** BoGrid — 읽기전용 목록 렌더러. columns: [{key,label,fmt?,badge?,align?,width?,slot?}].
   *  slot:true 인 컬럼은 부모가 #cell-{key}="{ row }" 슬롯으로 셀 내용을 직접 그린다(액션 버튼 등). */
  global.BoGrid = {
    props: {
      columns: { type: Array, required: true },
      rows: { type: Array, default: () => [] },
      rowKey: { type: String, default: 'id' },
      showRowNo: { type: Boolean, default: true },
      pageNo: { type: Number, default: 1 },
      pageSize: { type: Number, default: 20 },
      emptyText: { type: String, default: '조회된 데이터가 없습니다.' },
    },
    template: `
      <div style="overflow-x:auto;">
        <table class="admin-table" style="width:100%;font-size:12px;">
          <thead>
            <tr>
              <th v-if="showRowNo" style="width:44px;text-align:center;">번호</th>
              <th v-for="c in columns" :key="c.key" :style="{ width: c.width || '', textAlign: c.headerAlign || c.align || 'left' }">{{ c.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in rows" :key="row[rowKey] || idx">
              <td v-if="showRowNo" style="text-align:center;color:#999;">{{ (pageNo - 1) * pageSize + idx + 1 }}</td>
              <td v-for="c in columns" :key="c.key" :style="{ textAlign: c.align || 'left' }">
                <slot v-if="c.slot" :name="'cell-' + c.key" :row="row" :value="row[c.key]"></slot>
                <span v-else-if="c.badge" class="badge" :class="c.badge(row)">{{ c.fmt ? c.fmt(row) : row[c.key] }}</span>
                <template v-else>{{ c.fmt ? c.fmt(row) : (row[c.key] == null ? '-' : row[c.key]) }}</template>
              </td>
            </tr>
            <tr v-if="rows.length === 0"><td :colspan="columns.length + (showRowNo ? 1 : 0)" class="empty-hint">{{ emptyText }}</td></tr>
          </tbody>
        </table>
      </div>
    `,
  };

  /** BoFormArea — columns: [{key,label,type,colSpan?,options?,fmt?,placeholder?,required?,hint?}].
   *  type: text/password/select/readonly/slot. readonly(prop) 이면 전 필드 읽기전용으로 강제.
   *  form 은 부모의 reactive 객체를 그대로 참조 — v-model="form[col.key]" 로 직접 갱신(별도 이벤트 불필요). */
  global.BoFormArea = {
    props: {
      columns: { type: Array, required: true },
      form: { type: Object, required: true },
      cols: { type: Number, default: 3 },
      readonly: { type: Boolean, default: false },
    },
    setup(props) {
      // 템플릿 속성값 안에 && 를 직접 쓰면 Vue 런타임 컴파일러가 크래시하므로(프로젝트 표준 §0-A)
      // 전부 fn* 헬퍼로 감싼다.
      const fnOpts = (c) => (typeof c.options === 'function' ? c.options() : (c.options || []));
      const fnBadgeLabel = (c, v) => {
        if (c.type === 'select') {
          const found = fnOpts(c).find((o) => o.value === v);
          if (found) return found.label;
        }
        return v == null || v === '' ? '-' : v;
      };
      const fnShowRequired = (c) => !!(c.required && !props.readonly);
      const fnIsEditableSelect = (c) => c.type === 'select' && !props.readonly;
      const fnIsEditablePassword = (c) => c.type === 'password' && !props.readonly;
      const fnIsEditableText = (c) => !props.readonly && c.type !== 'readonly';
      return { fnOpts, fnBadgeLabel, fnShowRequired, fnIsEditableSelect, fnIsEditablePassword, fnIsEditableText };
    },
    template: `
      <div class="form-row" :style="{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: '10px' }">
        <div v-for="c in columns" :key="c.key" class="form-group" :style="{ gridColumn: 'span ' + (c.colSpan || 1) }">
          <span class="form-label">{{ c.label }} <span v-if="fnShowRequired(c)" style="color:#e53935;">*</span></span>
          <slot v-if="c.type === 'slot'" :name="'field-' + c.key" :form="form"></slot>
          <select v-else-if="fnIsEditableSelect(c)" class="form-control" v-model="form[c.key]">
            <option v-for="o in fnOpts(c)" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <input v-else-if="fnIsEditablePassword(c)" class="form-control" type="password"
                 v-model="form[c.key]" autocomplete="new-password" :placeholder="c.placeholder || ''" />
          <input v-else-if="fnIsEditableText(c)" class="form-control"
                 v-model="form[c.key]" :placeholder="c.placeholder || ''" />
          <input v-else class="form-control" disabled :value="c.fmt ? c.fmt(form) : fnBadgeLabel(c, form[c.key])" />
          <div v-if="c.hint" style="font-size:11px;color:#999;margin-top:2px;">{{ c.hint }}</div>
        </div>
      </div>
    `,
  };

  /** BoGridCrud(경량판) — cf_client 처럼 행 수가 적은 참조성 테이블을 위한 인라인 편집 그리드.
   *  EcCdnApi 는 EcAdminApi 식 saveList(배치) 엔드포인트가 없고 단건 REST(POST/PUT/DELETE)만
   *  있으므로, "전체 일괄저장" 대신 행 단위로 @save-row/@cancel-row/@delete-row 를 emit 해
   *  부모가 그 행 하나에 대해서만 API 를 호출하게 한다(원본 bo-grid-crud 의 배치저장과 다른 점).
   *  columns: [{key,label,type,options?,editable?(기본 true),fmt?}]. rows 의 각 행은
   *  _editing/_isNew 플래그로 편집 상태를 표시한다(부모가 셋업). */
  global.BoGridCrud = {
    props: {
      columns: { type: Array, required: true },
      rows: { type: Array, default: () => [] },
      rowKey: { type: String, required: true },
      emptyText: { type: String, default: '데이터가 없습니다.' },
    },
    emits: ['save-row', 'cancel-row', 'delete-row', 'edit-row'],
    setup() {
      const fnOpts = (c) => (typeof c.options === 'function' ? c.options() : (c.options || []));
      // 템플릿 속성값 안에 && 를 직접 쓰면 Vue 런타임 컴파일러가 크래시하므로(프로젝트 표준 §0-A)
      // 반드시 이런 fn* 헬퍼로 감싼다.
      const fnCellEditable = (row, c) => row._editing && c.editable !== false;
      const fnFieldDisabled = (c, row) => !!(c.disabledOnEdit && !row._isNew);
      return { fnOpts, fnCellEditable, fnFieldDisabled };
    },
    template: `
      <div style="overflow-x:auto;">
        <table class="admin-table" style="width:100%;font-size:12px;">
          <thead>
            <tr>
              <th style="width:44px;text-align:center;">번호</th>
              <th v-for="c in columns" :key="c.key" :style="{ width: c.width || '' }">{{ c.label }}</th>
              <th style="width:150px;text-align:center;">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in rows" :key="row[rowKey] || ('_new_' + idx)" :class="row._isNew ? 'crud-row status-I' : ''">
              <td style="text-align:center;color:#999;">{{ idx + 1 }}</td>
              <td v-for="c in columns" :key="c.key">
                <template v-if="fnCellEditable(row, c)">
                  <select v-if="c.type === 'select'" class="form-control" style="padding:2px 6px;font-size:12px;" v-model="row[c.key]">
                    <option v-for="o in fnOpts(c)" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                  <input v-else class="form-control" style="padding:2px 6px;font-size:12px;"
                         :type="c.type === 'password' ? 'password' : 'text'"
                         v-model="row[c.key]" :placeholder="c.placeholder || ''"
                         :disabled="fnFieldDisabled(c, row)" autocomplete="new-password" />
                  <div v-if="c.hint" style="font-size:10px;color:#999;">{{ c.hint }}</div>
                </template>
                <template v-else>
                  <span v-if="c.badge" class="badge" :class="c.badge(row)">{{ c.fmt ? c.fmt(row) : row[c.key] }}</span>
                  <template v-else>{{ c.fmt ? c.fmt(row) : (row[c.key] == null || row[c.key] === '' ? '-' : row[c.key]) }}</template>
                </template>
              </td>
              <td style="text-align:center;">
                <template v-if="row._editing">
                  <button class="btn btn_save btn-xs" @click="$emit('save-row', row)">저장</button>
                  <button class="btn btn_cancel btn-xs" @click="$emit('cancel-row', row)">취소</button>
                </template>
                <template v-else>
                  <button class="btn btn_row_edit btn-xs" @click="$emit('edit-row', row)">수정</button>
                  <button class="btn btn_row_delete btn-xs" @click="$emit('delete-row', row)">삭제</button>
                </template>
              </td>
            </tr>
            <tr v-if="rows.length === 0"><td :colspan="columns.length + 2" class="empty-hint">{{ emptyText }}</td></tr>
          </tbody>
        </table>
      </div>
    `,
  };
})(window);
