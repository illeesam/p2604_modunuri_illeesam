/* CfClientMng.js — cf_client(EcCdnApi 호출 계정) 관리 화면. shell(index.html)의 main 프레임에
 * <cf-client-mng> 로 임베드된다.
 *
 * 2026-09-06: 카드+별도 상세패널 대신 <bo-grid-crud> 인라인 편집 그리드로 전환(요청사항 —
 * "<bo-grid-crud 적극적용해줘"). cf_client 는 계정 수가 적고 필드도 단순(clientId/clientNm/
 * useYn/비밀번호)해서, 메인 프로젝트에서 SyRole/SyBrand 처럼 "전체 로드 + 인라인 편집 그리드,
 * 페이지네이션 없음" 패턴을 쓰는 소규모 참조성 테이블과 정확히 같은 모양이라 이 패턴이 더 맞다.
 * 단, EcCdnApi 는 EcAdminApi 식 saveList(배치) 엔드포인트가 없고 단건 REST(POST/PUT/DELETE)만
 * 있어서 "전체 일괄저장"이 아니라 행 단위 저장/취소/삭제로 동작한다(BoGridCrud 컴포넌트 주석 참조).
 */
window.CfClientMng = {
  setup() {
    const { reactive, onMounted } = Vue;

    // 1) ref/reactive
    const pager = reactive({ pageNo: 1, pageSize: 200, keyword: '' }); // CRUD 그리드 표준: 페이징 없이 전체 로드
    const listState = reactive({ list: [], total: 0 });
    // 메인 프로젝트 관례(SyContactDtl.js 등) — select 옵션은 흩어놓지 않고 codes 에 모아둔다.
    // EcCdnApi 는 EcAdminApi 의 sy_code/codeStore 같은 공통코드 백엔드가 없는 완전 별도 배포 단위라
    // window.sfGetBoCodeStore() 를 그대로 호출할 수 없다 — 그래서 fnLoadCodes() 가 실제로는
    // API 호출 없이 고정 목록을 채우지만, "codes 객체에 모아서 관리한다"는 구조 자체는 동일하게
    // 맞췄다(요청사항).
    const codes = reactive({ use_yn: [] });

    // 2) fn* 순수 유틸
    const fnFmtDate = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '-');

    // bo-grid-crud 컬럼 정의(요청사항 — <bo-grid-crud 적극적용).
    // clientId 는 신규행(_isNew)일 때만 편집 가능(기존 계정 id 변경 금지) → disabledOnEdit.
    // clientPwd 는 서버가 절대 내려주지 않으므로(BCrypt 해시 미노출) 읽기표시는 항상 마스킹,
    // 편집모드 입력값은 "비워두면 기존 비밀번호 유지"로 안내(신규는 필수).
    const clientGridColumns = [
      { key: 'clientId', label: 'clientId', width: '160px', disabledOnEdit: true },
      { key: 'clientNm', label: 'clientNm', width: '220px' },
      {
        key: 'useYn', label: '사용여부', type: 'select', width: '110px',
        options: () => codes.use_yn,
        badge: (r) => (r.useYn === 'Y' ? 'badge-green' : 'badge-gray'),
        fmt: (r) => (r.useYn === 'Y' ? '사용' : '중지'),
      },
      {
        key: 'clientPwd', label: '비밀번호', type: 'password', width: '220px',
        placeholder: '변경 시에만 입력', fmt: () => '••••••••',
      },
      { key: 'regBy', label: '등록자/등록일', editable: false, fmt: (r) => (r.regBy || '-') + ' / ' + fnFmtDate(r.regDate) },
      { key: 'updBy', label: '수정자/수정일', editable: false, fmt: (r) => (r.updBy || '-') + ' / ' + fnFmtDate(r.updDate) },
    ];

    /* fnLoadCodes — 공통코드 로드. EcCdnApi 에는 sy_code 백엔드가 없어 고정 목록을 그대로 채운다
       (SyContactDtl.js 의 codeStore.saLoadCodes(...) 호출 자리에 대응하는 위치). */
    const fnLoadCodes = async () => {
      codes.use_yn = [{ value: 'Y', label: '사용(Y)' }, { value: 'N', label: '중지(N)' }];
    };

    // 3) 조회
    const fnLoadList = async () => {
      try {
        const qs = new URLSearchParams({ keyword: pager.keyword, pageNo: pager.pageNo, pageSize: pager.pageSize });
        const data = await cfAuth.cfApi('/api/cdn/client/page?' + qs.toString());
        listState.list = data.pageList;
        listState.total = data.pageTotalCount;
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    // 4) 이벤트 핸들러(on*) — 조회는 버튼/Enter 클릭 시에만(검색 정책)
    const onSearch = () => fnLoadList();
    const onReset = () => { pager.keyword = ''; fnLoadList(); };

    // 신규 행: 맨 앞에 편집모드 draft 행을 하나 추가(그리드가 바로 인라인 편집 UI를 보여줌)
    const onAddRow = () => {
      if (listState.list.some((r) => r._isNew)) return cfAuth.showToast('이미 추가 중인 신규 행이 있습니다.', true);
      listState.list.unshift({ clientId: '', clientNm: '', useYn: 'Y', clientPwd: '', _isNew: true, _editing: true });
    };

    const onEditRow = (row) => {
      row._orig = { clientNm: row.clientNm, useYn: row.useYn };
      row.clientPwd = ''; // 비밀번호는 항상 빈 값에서 시작(변경할 때만 입력)
      row._editing = true;
    };

    const onCancelRow = (row) => {
      if (row._isNew) {
        listState.list.splice(listState.list.indexOf(row), 1);
        return;
      }
      if (row._orig) Object.assign(row, row._orig);
      row.clientPwd = '';
      row._editing = false;
    };

    const onSaveRow = async (row) => {
      if (!row.clientNm || !row.clientNm.trim()) return cfAuth.showToast('clientNm 을 입력하세요.', true);
      if (row._isNew && (!row.clientId.trim() || !row.clientPwd)) {
        return cfAuth.showToast('신규 등록은 clientId/비밀번호가 필수입니다.', true);
      }
      if (!confirm('저장하시겠습니까?')) return;
      try {
        if (row._isNew) {
          await cfAuth.cfApi('/api/cdn/client', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: row.clientId.trim(), clientNm: row.clientNm.trim(), clientPwd: row.clientPwd }),
          });
        } else {
          const body = { clientNm: row.clientNm.trim(), useYn: row.useYn };
          if (row.clientPwd) body.clientPwd = row.clientPwd;
          await cfAuth.cfApi('/api/cdn/client/' + encodeURIComponent(row.clientId), {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          });
        }
        cfAuth.showToast('저장되었습니다.');
        await fnLoadList();
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    const onDeleteRow = async (row) => {
      if (row._isNew) { listState.list.splice(listState.list.indexOf(row), 1); return; }
      if (!confirm('삭제하시겠습니까? (EcAdminApi 등 이 계정으로 호출하는 서비스가 있으면 연동이 끊깁니다)')) return;
      try {
        await cfAuth.cfApi('/api/cdn/client/' + encodeURIComponent(row.clientId), { method: 'DELETE' });
        cfAuth.showToast('삭제되었습니다.');
        await fnLoadList();
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    // 5) onMounted — 코드 응답을 받은 뒤 초기 조회를 시작한다(코드 기반 select 가 빈 상태로
    // 첫 조회가 나가는 것을 막는다. SyContactDtl.js 의 initPage 패턴과 동일 구조).
    const initPage = async () => {
      await fnLoadCodes();
      await fnLoadList();
    };
    onMounted(initPage);

    return {
      pager, listState, codes, clientGridColumns,
      onSearch, onReset, onAddRow, onEditRow, onCancelRow, onSaveRow, onDeleteRow,
    };
  },
  template: `
    <div>
      <div class="page-title">🔑 cf_client 관리 <span style="font-size:12px;color:#999;font-weight:400;">— EcCdnApi 호출 계정</span></div>

      <!-- ① 검색란 -->
      <div class="card">
        <div class="search-bar">
          <input type="text" class="form-control" v-model="pager.keyword" placeholder="clientId 또는 clientNm 검색" @keyup.enter="onSearch" />
          <button class="btn btn_search" @click="onSearch">조회</button>
          <button class="btn btn_reset" @click="onReset">초기화</button>
          <span style="flex:1"></span>
          <button class="btn btn_new" @click="onAddRow">+ 신규 계정</button>
        </div>
      </div>

      <!-- ② 인라인 편집 그리드(CRUD 그리드 — 페이지네이션 없음, 전체 로드 스크롤 컨테이너) -->
      <div class="card">
        <div class="list-toolbar">
          <span class="list-count">전체 {{ listState.total }}건</span>
        </div>
        <div style="max-height:480px;overflow-y:auto;">
          <bo-grid-crud :columns="clientGridColumns" :rows="listState.list" row-key="clientId"
            empty-text="조회된 계정이 없습니다."
            @edit-row="onEditRow" @cancel-row="onCancelRow" @save-row="onSaveRow" @delete-row="onDeleteRow" />
        </div>
      </div>
    </div>
  `,
};
