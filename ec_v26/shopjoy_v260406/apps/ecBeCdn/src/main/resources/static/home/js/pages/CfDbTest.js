/* CfDbTest.js — DB 연결 테스트 화면(요청사항: "url, port, id, pwd 등 입력하여 jdbc 연결되는지
 * 테스트할거야 주로 간단한 select 되는지도 점검할거야 페이징정보 없으면 기본 10건 하단에 결과
 * 그리드 있으면되"). PostgreSQL 전용(프로젝트 전체가 PostgreSQL 만 씀). 서버가 SELECT/WITH 로
 * 시작하는 문장만 허용한다(CfDbTestController 참조) — 안전장치이므로 프론트에서 다시 검증하지
 * 않는다(서버가 최종 방어선).
 */
window.CfDbTest = {
  setup() {
    const { reactive } = Vue;

    // 1) ref/reactive
    const form = reactive({
      host: 'illeesam.synology.me', port: 17632, dbName: 'postgres', schema: 'shopjoy_2604',
      username: 'postgres', password: '', sql: 'SELECT * FROM cf_client ORDER BY reg_date DESC',
    });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [10, 20, 50, 100, 200, 500] });
    const uiState = reactive({ testing: false, tested: false });
    const resultState = reactive({ columns: [], rows: [] });

    // bo-grid 컬럼 정의 — 조회 결과 컬럼이 매번 달라지므로 조회 직후 동적으로 만든다(fnBuildColumns).
    const gridColumns = reactive({ list: [] });
    const fnBuildColumns = (columns) => {
      gridColumns.list = columns.map((c) => ({ key: c, label: c }));
    };

    // 4) 이벤트 핸들러(on*)
    const fnRun = async () => {
      if (!form.host.trim()) return cfAuth.showToast('host 를 입력하세요.', true);
      if (!form.sql.trim()) return cfAuth.showToast('SQL(SELECT)을 입력하세요.', true);
      uiState.testing = true;
      try {
        const body = {
          host: form.host.trim(), port: form.port, dbName: form.dbName, schema: form.schema,
          username: form.username, password: form.password,
          sql: form.sql, pageNo: pager.pageNo, pageSize: pager.pageSize,
        };
        const data = await cfAuth.cfApi('/api/cdn/db/test', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        resultState.columns = data.columns;
        resultState.rows = data.rows;
        fnBuildColumns(data.columns);
        pager.pageTotalCount = data.pageTotalCount;
        pager.pageTotalPage = data.pageTotalPage;
        uiState.tested = true;
        cfAuth.showToast('연결 성공 — 전체 ' + data.pageTotalCount + '건');
      } catch (e) {
        uiState.tested = false;
        cfAuth.showToast(e.message, true);
      } finally {
        uiState.testing = false;
      }
    };
    const onTest = () => { pager.pageNo = 1; fnRun(); };
    const onSetPage = (p) => { pager.pageNo = p; fnRun(); };
    const onSizeChange = () => { pager.pageNo = 1; fnRun(); };

    return { form, pager, uiState, resultState, gridColumns, onTest, onSetPage, onSizeChange };
  },
  template: `
    <div>
      <div class="page-title">🗄️ DB 연결 테스트 <span style="font-size:12px;color:#999;font-weight:400;">— PostgreSQL, SELECT 전용(인증 불필요)</span></div>

      <!-- ① 접속정보 + SQL -->
      <div class="card">
        <div class="form-row">
          <div class="form-group"><span class="form-label">host</span><input class="form-control" v-model="form.host" /></div>
          <div class="form-group"><span class="form-label">port</span><input class="form-control" type="number" v-model.number="form.port" /></div>
          <div class="form-group"><span class="form-label">dbName</span><input class="form-control" v-model="form.dbName" /></div>
          <div class="form-group"><span class="form-label">schema</span><input class="form-control" v-model="form.schema" /></div>
          <div class="form-group"><span class="form-label">id(username)</span><input class="form-control" v-model="form.username" /></div>
          <div class="form-group"><span class="form-label">pwd(password)</span><input class="form-control" type="password" v-model="form.password" /></div>
          <div class="form-group span-3">
            <span class="form-label">SQL(SELECT / WITH ... SELECT 만 허용)</span>
            <textarea class="form-control" rows="3" v-model="form.sql" style="font-family:Consolas,Monaco,monospace;font-size:12px;"></textarea>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn_confirm" :disabled="uiState.testing" @click="onTest">{{ uiState.testing ? '조회 중...' : '연결/조회 테스트' }}</button>
        </div>
      </div>

      <!-- ② 결과 그리드(하단) -->
      <div class="card" v-if="uiState.tested">
        <div class="list-toolbar">
          <span class="list-title">조회 결과</span>
          <span class="list-count">전체 {{ pager.pageTotalCount }}건</span>
        </div>
        <bo-grid :columns="gridColumns.list" :rows="resultState.rows" row-key="__idx"
          :page-no="pager.pageNo" :page-size="pager.pageSize" empty-text="조회 결과가 없습니다." />
        <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
      </div>
    </div>
  `,
};
