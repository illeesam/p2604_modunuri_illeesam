/* ShopJoy Admin - App모니터대시보드 (ECharts 기반, API 트랜잭션 실시간 모니터링)
 * DashboardBoEc01 의 X-View 실시간 트랜잭션 히트맵을 이식 + APM 성격 차트 추가
 * (호출량 Top / 응답시간 추이 / 상태 분포)
 */
window.DashboardBoAppMonitor = {
  name: 'DashboardBoAppMonitor',
  props: {
    navigate:  { type: Function, required: true },                       // 페이지 이동
    showToast: { type: Function, default: () => {} },                    // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;

    const uiState = reactive({
      infoPanel: null, /* { title, optJson, dataJson, top, left } */
    });

    /* 박스 선택/막대 클릭 팝업 표시 최대 건수 — 과도한 선택 시 팝업 렌더링 부하 방지 */
    const MAX_POPUP_ROWS = 300;

    /* 기간 선택 옵션 (호출량 Top10 / 응답시간 Top10 공용 정의, 각자 독립 선택값 보유) */
    const RANGE_OPTS = [
      { value: 10   * 60 * 1000, label: '10분' },
      { value: 30   * 60 * 1000, label: '30분' },
      { value: 60   * 60 * 1000, label: '1시간' },
      { value: 2*60 * 60 * 1000, label: '2시간' },
      { value: 6*60 * 60 * 1000, label: '6시간' },
      { value: 12*60* 60 * 1000, label: '12시간' },
      { value: 24*60* 60 * 1000, label: '1일' },
      { value: 48*60* 60 * 1000, label: '2일' },
    ];
    const MAX_RANGE_MS = RANGE_OPTS[RANGE_OPTS.length - 1].value;
    const topUrlRange = ref(RANGE_OPTS[0].value);
    const rtTopRange  = ref(RANGE_OPTS[0].value);
    const cfTopUrlRangeLabel = computed(() => RANGE_OPTS.find(o => o.value === topUrlRange.value)?.label || '');
    const cfRtTopRangeLabel  = computed(() => RANGE_OPTS.find(o => o.value === rtTopRange.value)?.label  || '');

    /* X-View 히트맵 전용 조회기간 옵션 — 10분/20분/30분/1시간/2시간/6시간/12시간/1일 */
    const XVIEW_RANGE_OPTS = [
      { value: 10   * 60 * 1000, label: '10분' },
      { value: 15   * 60 * 1000, label: '15분' },
      { value: 20   * 60 * 1000, label: '20분' },
      { value: 30   * 60 * 1000, label: '30분' },
      { value: 60   * 60 * 1000, label: '1시간' },
      { value: 2*60 * 60 * 1000, label: '2시간' },
      { value: 6*60 * 60 * 1000, label: '6시간' },
      { value: 12*60* 60 * 1000, label: '12시간' },
      { value: 24*60* 60 * 1000, label: '1일' },
    ];
    const XVIEW_RANGE_DEFAULT = XVIEW_RANGE_OPTS[1].value;      /* 최근조회 기본 15분 */
    const XVIEW_RANGE_MODE_RANGE_DEFAULT = 30 * 60 * 1000;      /* 기간조회 전환 시 고정 기본값 30분 */
    /* xviewMode: 'recent'(최근조회, 실시간 창) | 'range'(기간조회, 고정 스냅샷) */
    const xviewMode  = ref('recent');
    const xviewRange = ref(XVIEW_RANGE_DEFAULT);
    /* 기간조회 전환 시각(스냅샷 기준점) — 최근조회는 항상 Date.now() 기준으로 흐르고,
     * 기간조회는 전환 시점에 고정해서 해당 구간만 정지된 상태로 보여줌 */
    const xviewRangeAnchor = ref(Date.now());

    /* [일][시][분] ~ [일][시][분] 절대 구간 입력 — select(상대 기간)와 양방향 동기화.
     * 네이티브 datetime-local 피커는 오전/오후·12시간제·자동닫힘 여부를 브라우저가 그려서
     * 제어 불가 → 날짜(input type=date, 로케일 무관 YYYY-MM-DD) + 시/분(select, 24시간제 강제)
     * 조합으로 직접 구성. 단일 소스는 xviewRangeAnchor(종료시각)+xviewRange(길이). */
    const fnToDateStr = (ms) => {
      const d = new Date(ms);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    };
    const xviewRangeStart = reactive({ date: '', hour: 0, min: 0 });
    const xviewRangeEnd   = reactive({ date: '', hour: 0, min: 0 });
    const fnSetDtParts = (target, ms) => {
      const d = new Date(ms);
      target.date = fnToDateStr(ms);
      target.hour = d.getHours();
      target.min  = d.getMinutes();
    };
    const fnDtPartsToMs = (target) => {
      if (!target.date) return NaN;
      const [y, m, day] = target.date.split('-').map(Number);
      return new Date(y, m - 1, day, target.hour, target.min, 0, 0).getTime();
    };
    fnSetDtParts(xviewRangeStart, Date.now() - XVIEW_RANGE_MODE_RANGE_DEFAULT);
    fnSetDtParts(xviewRangeEnd, Date.now());
    const HOUR_OPTS = Array.from({ length: 24 }, (_, i) => i);
    const MIN_OPTS  = Array.from({ length: 60 }, (_, i) => i);
    /* select 에 프리셋이 아닌 값(직접입력 결과)이 적용됐을 때 true — select 는 "직접입력" 옵션 표시 */
    const xviewRangeIsCustom = ref(false);

    /* select → [일][시][분]~[일][시][분] 갱신 (기준: 현재시각 ~ 현재시각-선택값)
     * 조회 조건이 바뀌므로 화면에 남아있는 이전 박스 드래그 선택 영역은 clear */
    const fnSetXviewMode = (mode) => {
      xviewMode.value = mode;
      if (mode === 'range') {
        xviewRange.value = XVIEW_RANGE_MODE_RANGE_DEFAULT;
        xviewRangeAnchor.value = Date.now();
        xviewRangeIsCustom.value = false;
        fnSetDtParts(xviewRangeEnd, xviewRangeAnchor.value);
        fnSetDtParts(xviewRangeStart, xviewRangeAnchor.value - xviewRange.value);
      }
      fnClearXviewBrush();
    };
    const fnSetXviewRange = (val) => {
      xviewRange.value = Number(val);
      xviewRangeIsCustom.value = false;
      if (xviewMode.value === 'range') {
        xviewRangeAnchor.value = Date.now();
        fnSetDtParts(xviewRangeEnd, xviewRangeAnchor.value);
        fnSetDtParts(xviewRangeStart, xviewRangeAnchor.value - xviewRange.value);
      }
      fnClearXviewBrush();
    };
    /* [일][시][분]~[일][시][분] 직접 수정 후 분(min) 선택 완료 시(둘 다 지정된 상태) 자동 반영.
     * 프리셋(10분/20분/.../1일)과 정확히 일치하면 select 도 동기화, 아니면 "직접입력" 표시 */
    const fnApplyXviewDtRange = () => {
      const start = fnDtPartsToMs(xviewRangeStart);
      const end   = fnDtPartsToMs(xviewRangeEnd);
      if (!start || !end || end <= start) { props.showToast('종료시각은 시작시각보다 이후여야 합니다.', 'error'); return; }
      xviewRangeAnchor.value = end;
      xviewRange.value = end - start;
      xviewRangeIsCustom.value = !XVIEW_RANGE_OPTS.some(o => o.value === xviewRange.value);
      fnClearXviewBrush();
    };
    const cfXviewRangeSelectValue = computed(() => xviewRangeIsCustom.value ? 'custom' : xviewRange.value);

    /* 응답시간 등급(집계값 전용, err 없음) — 응답시간Top10 등 평균값 집계 항목에서 사용
     * 좋음 <500ms(초록) / 보통 <1500ms(파랑) / 경고 ≥1500ms(오렌지) */
    const RT_GRADES = [
      { max: 500,      key: 'good', label: '좋음', color: '#10b981' },
      { max: 1500,     key: 'ok',   label: '보통', color: '#3b82f6' },
      { max: Infinity, key: 'warn', label: '경고', color: '#f59e0b' },
    ];
    const fnRtGrade = (rt) => RT_GRADES.find(g => rt < g.max) || RT_GRADES[RT_GRADES.length - 1];

    /* 개별 트랜잭션 등급(err 플래그 포함) — 히트맵/브러시팝업/상태분포에서 사용
     * 좋음 <500ms(초록) / 보통 <1500ms(파랑) / 경고 ≥1500ms(오렌지) / 오류(err=true, 빨강) */
    const PT_GRADES = [
      { key: 'good', label: '좋음', color: '#10b981' },
      { key: 'ok',   label: '보통', color: '#3b82f6' },
      { key: 'warn', label: '경고', color: '#f59e0b' },
      { key: 'err',  label: '오류', color: '#ef4444' },
    ];
    /* 개별 포인트({rt, err})를 받아 PT_GRADES 인덱스(0~3) 반환. err=true 는 응답시간과 무관하게 항상 '오류' */
    const fnPtGradeIdx = (p) => {
      if (p.err) return 3;
      if (p.rt < 500) return 0;
      if (p.rt < 1500) return 1;
      return 2;
    };
    const fnPtGrade = (p) => PT_GRADES[fnPtGradeIdx(p)];

    const WIDGET_SRC = {
      XVIEW: { compId:'(없음)', chartType:'scatter + brush (X-View 히트맵)', url:'(로컬 목업 — 실시간 생성)', dataKey:'xviewData', fields:'t(timestamp ms) / rt(응답시간ms) / err(boolean) / method(GET/POST) / url / uiNm / cmdNm', desc:'브라우저 로컬에서 800개 랜덤 포인트 생성. 2초마다 새 포인트 추가. 실제 구현 시 APM 에이전트 데이터 연동 필요.',
        tag:'<co-echart\n  :option="cfOptXview"\n  height="360px"\n  @brush-selected="onXviewBrush"\n/>',
        attrs:[{k:':option',v:'cfOptXview',d:'scatter series — 4단계(좋음 초록/보통 파랑/경고 오렌지/오류 적색×마커), brush toolbox 포함'},{k:'height',v:'"360px"',d:'드릴다운 영역 포함 높이'},{k:'@brush-selected',v:'onXviewBrush',d:'브러시 선택 시 트랜잭션 목록 새창(postMessage) emit 핸들러'}] },
      TOPURL:   { compId:'(없음)', chartType:'bar (수평 막대)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'url / uiNm / cmdNm 별 호출건수 집계 (선택 기간)', desc:'선택한 기간(10분~2일) 트랜잭션을 URL 기준 집계해 호출량 상위 10개를 표시.',
        tag:'<co-echart\n  :option="cfOptTopUrl"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOptTopUrl',d:'bar horizontal — url 별 count 내림차순 Top10, topUrlRange 기간 필터'},{k:'height',v:'"260px"',d:'캔버스 높이'}] },
      RTTOP:    { compId:'(없음)', chartType:'bar (수평 막대, 3단계 색상)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'url 별 평균 응답시간(ms) 집계 (선택 기간)', desc:'선택한 기간(10분~2일) 트랜잭션을 URL 기준 평균 응답시간 집계해 상위 10개 표시. 좋음(<500ms 초록)/보통(<1500ms 파랑)/경고(≥1500ms 오렌지) 3단계 색상 (평균값 집계라 개별 오류 플래그는 반영되지 않음).',
        tag:'<co-echart\n  :option="cfOptRtTop"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOptRtTop',d:'bar horizontal — url 별 평균 응답시간 내림차순 Top10, rtTopRange 기간 필터, itemStyle.color 콜백으로 4단계 색상'},{k:'height',v:'"260px"',d:'캔버스 높이'}] },
      RTTREND:  { compId:'(없음)', chartType:'line (10초 버킷 평균/최대 응답시간)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'t(10초 버킷) / avgRt / maxRt', desc:'10초 단위로 평균·최대 응답시간을 집계한 추이선.',
        tag:'<co-echart\n  :option="cfOptRtTrend"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOptRtTrend',d:'line 2 series — 평균/최대 응답시간'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      STATUSPIE:{ compId:'(없음)', chartType:'pie (파이 차트)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'상태별(좋음/보통/경고/오류) 비중', desc:'최근 10분 트랜잭션의 상태 분포(4단계 등급, 오류는 err 플래그 기준).',
        tag:'<co-echart\n  :option="cfOptStatusPie"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOptStatusPie',d:'pie series — 좋음/보통/경고/오류 4종 색상'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
    };

    /* 항목 정보 팝오버 열기
     * optGetter  : () => ECharts option 반환 함수 (없으면 null)
     * rawOverride: 원시 데이터로 사용할 배열
     * srcKey     : WIDGET_SRC 키
     */
    const fnOpenInfo = (e, title, optGetter, rawOverride, srcKey) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollY = window.scrollY || 0;
      const scrollX = window.scrollX || 0;
      if (uiState.infoPanel && uiState.infoPanel.title === title) {
        uiState.infoPanel = null;
        return;
      }
      let optObj = null;
      try {
        if (optGetter) {
          const got = optGetter();
          optObj = (got !== null && typeof got === 'object' && 'value' in got) ? got.value : got;
        }
      } catch (_) {}
      const src = srcKey ? WIDGET_SRC[srcKey] : null;
      uiState.infoPanel = {
        title,
        optJson:  optObj      ? JSON.stringify(optObj,      null, 2) : '(없음)',
        dataJson: rawOverride ? JSON.stringify(rawOverride, null, 2) : '(없음)',
        src, apiParams: null,
        tab: 'opt',
        top:  rect.bottom + scrollY + 6,
        left: Math.min(rect.left  + scrollX, window.innerWidth - 560),
      };
    };

    /* 팝오버 탭 전환 */
    const fnInfoTab = (t) => { if (uiState.infoPanel) uiState.infoPanel.tab = t; };

    const _onDocClick = () => { uiState.infoPanel = null; };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'info-close')        { uiState.infoPanel = null; return; }
      if (cmd === 'infoTab-set')       { fnInfoTab(param); return; }
      if (cmd === 'clipboard-copy')    { if (param) navigator.clipboard.writeText(param); return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] X-View 히트맵 목업 데이터 ######################################## */

    const XVIEW_URLS = [
      { method:'GET',  url:'/bo/ec/mb/member/page',        uiNm:'회원관리',     cmdNm:'목록조회', fileNm:'MbMemberMng.js',     funcNm:'handleSearchList' },
      { method:'GET',  url:'/bo/ec/pd/prod/page',           uiNm:'상품관리',     cmdNm:'목록조회', fileNm:'PdProdMng.js',       funcNm:'handleSearchList' },
      { method:'GET',  url:'/bo/ec/od/order/page',          uiNm:'주문관리',     cmdNm:'목록조회', fileNm:'OdOrderMng.js',      funcNm:'handleSearchData' },
      { method:'GET',  url:'/bo/ec/od/claim/page',          uiNm:'클레임관리',   cmdNm:'목록조회', fileNm:'OdClaimMng.js',      funcNm:'handleSearchList' },
      { method:'GET',  url:'/bo/ec/pm/coupon/page',         uiNm:'쿠폰관리',     cmdNm:'목록조회', fileNm:'PmCouponMng.js',     funcNm:'handleSearchList' },
      { method:'GET',  url:'/bo/ec/cm/dashboard/data',      uiNm:'대시보드',     cmdNm:'조회',     fileNm:'DashboardBoEc01.js', funcNm:'loadDashboard' },
      { method:'GET',  url:'/bo/sy/user/page',              uiNm:'사용자관리',   cmdNm:'목록조회', fileNm:'SyUserMng.js',       funcNm:'handleSearchList' },
      { method:'GET',  url:'/bo/sy/code/list',              uiNm:'코드관리',     cmdNm:'코드목록', fileNm:'SyCodeMng.js',       funcNm:'fnLoadCodeList' },
      { method:'POST', url:'/bo/ec/pd/prod/save/base',      uiNm:'상품관리',     cmdNm:'저장',     fileNm:'PdProdDtl.js',       funcNm:'handleSave' },
      { method:'POST', url:'/bo/ec/od/order/save/base',     uiNm:'주문관리',     cmdNm:'저장',     fileNm:'OdOrderDtl.js',      funcNm:'handleSave' },
      { method:'POST', url:'/bo/ec/mb/member/save/base',    uiNm:'회원관리',     cmdNm:'저장',     fileNm:'MbMemberDtl.js',     funcNm:'handleSave' },
      { method:'GET',  url:'/bo/ec/dp/ui/list',             uiNm:'전시관리',     cmdNm:'목록조회', fileNm:'DpDispUiMng.js',     funcNm:'handleSearchList' },
      { method:'GET',  url:'/bo/ec/pm/event/page',          uiNm:'이벤트관리',   cmdNm:'목록조회', fileNm:'PmEventMng.js',      funcNm:'handleSearchList' },
      { method:'GET',  url:'/co/sy/code/groups',            uiNm:'공통',         cmdNm:'코드조회', fileNm:'boCodeStore.js',     funcNm:'saLoadCodes' },
      { method:'GET',  url:'/bo/sy/menu/list',              uiNm:'메뉴관리',     cmdNm:'목록조회', fileNm:'SyMenuMng.js',       funcNm:'handleSearchList' },
    ];
    /* url → { method, uiNm, cmdNm } 조회맵 — Top10 차트 Y축/tooltip에 "uiNm > cmdNm" 표시용 */
    const XVIEW_URL_MAP = {};
    XVIEW_URLS.forEach(u => { XVIEW_URL_MAP[u.url] = u; });
    const fnUrlUiTag = (url) => {
      const m = XVIEW_URL_MAP[url];
      return m ? (m.uiNm + ' > ' + m.cmdNm) : '';
    };
    const fnUrlMethod = (url) => (XVIEW_URL_MAP[url] && XVIEW_URL_MAP[url].method) || '';

    /* 가상 멀티앱/멀티서버(Pod) 목업 — 쿠버네티스 환경처럼 앱(서비스)별 Pod 여러 대로
     * 라운드로빈 분산된 것처럼 재현. 앱이 여러 개(BO API / FO API / 배치 등)인 케이스 대비 */
    const APP_SERVERS = [
      { appNm: 'ecadminapi-bo', ip: '10.42.1.11', podNm: 'ecadminapi-bo-7d4f9c8b6-x2k4p' },
      { appNm: 'ecadminapi-bo', ip: '10.42.2.14', podNm: 'ecadminapi-bo-7d4f9c8b6-h8m2q' },
      { appNm: 'ecadminapi-bo', ip: '10.42.3.17', podNm: 'ecadminapi-bo-7d4f9c8b6-r5t9v' },
      { appNm: 'ecadminapi-fo', ip: '10.42.1.22', podNm: 'ecadminapi-fo-5b6c8d9f4-m3n7q' },
      { appNm: 'ecadminapi-fo', ip: '10.42.2.25', podNm: 'ecadminapi-fo-5b6c8d9f4-p9k2s' },
      { appNm: 'ecadminapi-batch', ip: '10.42.3.31', podNm: 'ecadminapi-batch-6f7d8c9b2-w4x8t' },
    ];
    /* 히트맵 앱 필터 탭 옵션 — "전체" + APP_SERVERS 에 등장하는 appNm 유니크 목록(등장 순서 유지) */
    const XVIEW_APP_TABS = ['전체', ...new Set(APP_SERVERS.map(s => s.appNm))];
    const xviewAppFilter = ref('전체');
    /* app 탭 전환 시 표시 데이터가 바뀌므로 이전 박스 드래그 선택 영역 clear */
    const fnSetXviewAppFilter = (a) => { xviewAppFilter.value = a; fnClearXviewBrush(); };
    let _traceSeq = 0;
    const _buildTraceId = (t) => {
      const d = new Date(t);
      const ymd = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
      const hms = String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0') + String(d.getSeconds()).padStart(2,'0');
      _traceSeq = (_traceSeq + 1) % 10000;
      return ymd + '_' + hms + '_' + String(_traceSeq).padStart(4,'0');
    };
    /* 오류 유형 목업 — httpStatus/errorCode/message/stackTrace 조합. err=true 포인트에서 랜덤 선택 */
    const ERR_TYPES = [
      { httpStatus: 500, errorCode: 'INTERNAL_SERVER_ERROR', message: 'Connection timeout while calling downstream service',
        stackTrace: 'java.net.SocketTimeoutException: Read timed out\n  at java.base/sun.nio.ch.NioSocketImpl.timedRead(NioSocketImpl.java:283)\n  at com.shopjoy.ecadminapi.base.service.HttpClientService.call(HttpClientService.java:142)\n  at com.shopjoy.ecadminapi.bo.controller.BoController.handle(BoController.java:58)' },
      { httpStatus: 500, errorCode: 'DB_QUERY_ERROR', message: 'org.postgresql.util.PSQLException: could not obtain a connection from the pool',
        stackTrace: 'org.postgresql.util.PSQLException: could not obtain a connection from the pool\n  at com.zaxxer.hikari.pool.HikariPool.createTimeoutException(HikariPool.java:696)\n  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:197)\n  at com.shopjoy.ecadminapi.base.repository.qrydsl.impl.QRepositoryImpl.selectPageData(QRepositoryImpl.java:118)' },
      { httpStatus: 400, errorCode: 'VALIDATION_ERROR', message: 'searchValue 는 100자 이내여야 합니다.',
        stackTrace: 'jakarta.validation.ConstraintViolationException: searchValue 는 100자 이내여야 합니다.\n  at com.shopjoy.ecadminapi.common.exception.GlobalExceptionHandler.handleValidation(GlobalExceptionHandler.java:64)' },
      { httpStatus: 401, errorCode: 'TOKEN_EXPIRED', message: '인증 토큰이 만료되었습니다.',
        stackTrace: 'io.jsonwebtoken.ExpiredJwtException: JWT expired at 2026-07-25T09:12:03Z\n  at com.shopjoy.ecadminapi.auth.JwtTokenProvider.validateToken(JwtTokenProvider.java:87)\n  at com.shopjoy.ecadminapi.common.security.JwtAuthFilter.doFilterInternal(JwtAuthFilter.java:45)' },
      { httpStatus: 403, errorCode: 'ACCESS_DENIED', message: '접근 권한이 없습니다.',
        stackTrace: 'com.shopjoy.ecadminapi.common.exception.CmBizException: 접근 권한이 없습니다.\n  at com.shopjoy.ecadminapi.common.security.SecurityUtil.checkRole(SecurityUtil.java:73)' },
      { httpStatus: 409, errorCode: 'DATA_CONFLICT', message: '이미 처리된 요청입니다. (rowStatus 충돌)',
        stackTrace: 'com.shopjoy.ecadminapi.common.exception.CmBizException: 이미 처리된 요청입니다.\n  at com.shopjoy.ecadminapi.base.service.BaseService.saveList(BaseService.java:96)' },
      { httpStatus: 503, errorCode: 'SERVICE_UNAVAILABLE', message: 'Redis 캐시 서버에 연결할 수 없습니다.',
        stackTrace: 'io.lettuce.core.RedisConnectionException: Unable to connect to localhost:6379\n  at com.shopjoy.ecadminapi.cache.RedisCacheService.get(RedisCacheService.java:39)' },
    ];
    const _buildErrorInfo = () => {
      const e = ERR_TYPES[Math.floor(Math.random() * ERR_TYPES.length)];
      return { httpStatus: e.httpStatus, errorCode: e.errorCode, message: e.message, stackTrace: e.stackTrace };
    };
    /* 사이트/구매자/라이선스/User-Agent/토큰 목업 — 실 프로젝트 X-Site-Id(2604010000000001 형식) 등과 동일 패턴 */
    const _hex = (n) => Math.floor(Math.random() * 16 ** n).toString(16).padStart(n, '0');
    const _buildPoint = (t) => {
      const rt = Math.random() < 0.75
        ? Math.random() * 500
        : Math.random() < 0.7
          ? 500 + Math.random() * 2500
          : 3000 + Math.random() * 5000;
      const err = rt > 5000 && Math.random() < 0.3;
      const src = XVIEW_URLS[Math.floor(Math.random() * XVIEW_URLS.length)];
      const srv = APP_SERVERS[Math.floor(Math.random() * APP_SERVERS.length)];
      return {
        t, rt: Math.round(rt), err, method: src.method, url: src.url, uiNm: src.uiNm, cmdNm: src.cmdNm,
        errorInfo: err ? _buildErrorInfo() : null,
        fileNm: src.fileNm, funcNm: src.funcNm, lineNo: 20 + Math.floor(Math.random() * 480),
        traceId: _buildTraceId(t),
        siteId: window.boCommonFilter?.siteId || '',
        buyerId: 'BUYER_' + String(1 + Math.floor(Math.random() * 50)).padStart(3, '0'),
        licenseCode: 'eyJzaXRl' + _hex(6) + '...' + _hex(6),
        userAgent: 'Mozilla/5.0...' + _hex(6),
        authToken: 'Bearer e...' + _hex(6),
        appNm: srv.appNm, serverIp: srv.ip, podNm: srv.podNm,
      };
    };

    /* X-View 히트맵(최근 10분)은 밀도 800포인트 유지 + 기간선택(최대 2일)용 저밀도 포인트를 추가 생성 */
    const buildXviewData = () => {
      const now = Date.now();
      const pts = [];
      for (let i = 0; i < 800; i++) pts.push(_buildPoint(now - Math.random() * 10 * 60 * 1000));
      for (let i = 0; i < 2000; i++) pts.push(_buildPoint(now - Math.random() * MAX_RANGE_MS));
      return pts;
    };

    const xviewData = ref(buildXviewData());
    let xviewTimer  = null;
    const cfXviewSample = computed(() => xviewData.value.slice(0, 10));

    /* 앱 필터('전체' 이외) 적용된 표시용 서브셋 — cfOptXview(차트 렌더)와 onXviewBrush(브러시 선택)
     * 가 항상 동일한 배열/인덱스를 참조하도록 단일 소스로 분리(둘이 따로 필터링하면 dataIndex 어긋남) */
    const cfXviewFiltered = computed(() => {
      if (xviewAppFilter.value === '전체') return xviewData.value;
      return xviewData.value.filter(p => p.appNm === xviewAppFilter.value);
    });

    /* ── X-View 히트맵 option ─────────────────────────── */
    const cfOptXview = computed(() => {
      /* 최근조회: now = Date.now() (실시간으로 창이 흘러감)
       * 기간조회: now = 전환 시각(xviewRangeAnchor) 고정 (스냅샷처럼 정지) */
      const now  = xviewMode.value === 'range' ? xviewRangeAnchor.value : Date.now();
      const from = now - xviewRange.value;
      const pts  = cfXviewFiltered.value.map(p => [p.t, p.rt, fnPtGradeIdx(p), p.url||'', p.uiNm||'', p.cmdNm||'']);

      return {
        tooltip: {
          trigger: 'item',
          formatter: p => {
            const d   = new Date(p.data[0]);
            const hms = d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');
            const lbl = (PT_GRADES[p.data[2]] || {}).label || '';
            const url   = p.data[3] || '';
            const uiNm  = p.data[4] || '';
            const cmdNm = p.data[5] || '';
            return hms + '<br/>응답시간: <b>' + p.data[1].toFixed(0) + 'ms</b><br/>상태: ' + lbl
              + (url   ? '<br/><span style="color:#7dd3fc;font-family:monospace;font-size:11px;">' + url + '</span>' : '')
              + (uiNm  ? '<br/><span style="color:#c4b5fd;">X-UI-Nm: <b>' + uiNm + '</b></span>' : '')
              + (cmdNm ? ' &nbsp;<span style="color:#6ee7b7;">X-Cmd-Nm: <b>' + cmdNm + '</b></span>' : '');
          },
        },
        toolbox: {
          feature: { dataZoom:{ yAxisIndex:'none', title:{ zoom:'범위 드래그', back:'초기화' } }, restore:{ title:'초기화' } },
          right: 16, top: 6,
        },
        brush: {
          toolbox: ['rect','clear'],
          xAxisIndex: 0,
          /* series 를 scatter 1개로 단순화(경고선은 markLine 으로 이동)하고 seriesIndex:0 명시.
           * 예전엔 line(경고선) 시리즈 + scatter(large:true) 조합이라 ECharts 5.6.0 brush 의
           * overallReset 내부에서 TypeError(undefined.push) 발생 → brushSelected 미발생. */
          seriesIndex: 0,
          throttleType: 'debounce', throttleDelay: 300,
          /* 선택 영역 밖 포인트는 원래 색상 그대로 유지(회색 처리 안 함),
           * 선택 영역 안 포인트는 흰 테두리 + 확대로 강조(보더 + 진하게) */
          outOfBrush: { colorAlpha: 1 },
          inBrush: { borderColor: '#111', borderWidth: 1.5, symbolSize: 8 },
        },
        grid: { top:48, right:24, bottom:48, left:64 },
        xAxis: {
          type: 'time', min: from, max: now,
          axisLabel: {
            fontSize: 10, color: '#888',
            formatter: v => { const d = new Date(v); return d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0'); },
          },
          splitLine: { lineStyle:{ color:'#f0f0f0' } },
        },
        yAxis: {
          type: 'value', name: '응답시간(ms)', nameTextStyle:{ fontSize:10, color:'#888' },
          min: 0,
          axisLabel: { fontSize:10, color:'#888', formatter: v => v + 'ms' },
          splitLine: { lineStyle:{ color:'#f0f0f0' } },
        },
        visualMap: {
          show: true, type:'piecewise', categories: [0,1,2,3], dimension: 2,
          pieces: [
            { value:0, label:'좋음 (<500ms)',  color: PT_GRADES[0].color },
            { value:1, label:'보통 (<1500ms)', color: PT_GRADES[1].color },
            { value:2, label:'경고 (≥1500ms)', color: PT_GRADES[2].color },
            { value:3, label:'오류',          color: PT_GRADES[3].color },
          ],
          right: 16, bottom: 40, textStyle:{ fontSize:10 },
        },
        /* brush 는 scatter 단일 시리즈(index 0)만 대상. 경고선(1500ms)은 별도 line 시리즈
         * 대신 scatter 의 markLine 으로 그려 series 배열을 1개로 유지 → brush overallReset 오류 회피.
         * large:true 도 제거(brush 선택 index 집계와 상충). 오류(err=true, 등급 인덱스 3)만 X 마커,
         * 나머지는 원형 마커 — symbol 콜백으로 데이터별 분기(단일 series 유지).
         * ⚠ path:// 는 stroke(단순 선분 M..L..)가 아니라 fill 가능한 다각형(닫힌 Z 서브패스)만
         * 렌더링됨 — 대각 막대 2개를 채움 다각형으로 구성한 X자 아이콘. */
        series: [
          {
            type:'scatter', data: pts,
            /* 기본 원형 마커 30% 확대(4→5.2px). X 마커(오류)는 path 자체 여백 때문에
             * 동일 시각 크기를 내려면 다소 더 키워야 균형이 맞음 */
            symbolSize: (value, params) => (params.data[2] === 3 ? 7.5 : 5.2),
            symbol: (value, params) => (params.data[2] === 3
              ? 'path://M4,0 L10,0 L24,14 L24,20 L18,20 L4,6 Z M24,0 L24,6 L10,20 L4,20 L4,14 L18,0 Z'
              : 'circle'),
            encode: { x:0, y:1, itemName:0 },
            markLine: {
              symbol: 'none', silent: true,
              label: { show: false },
              data: [
                { yAxis: 1500, lineStyle:{ type:'dashed', color: PT_GRADES[2].color, width:1.5 } },
              ],
            },
          },
        ],
      };
    });

    /* fnXviewChartReady — 차트 준비 시 Box Select(브러시 rect) 기본 활성화 + 인스턴스 보관
     * (app 필터·조회모드·기간 변경 시 fnClearXviewBrush 로 이전 드래그 영역을 지우기 위함) */
    let xviewChartInst = null;
    const fnXviewChartReady = (chart) => {
      xviewChartInst = chart;
      chart.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: 'rect', brushMode: 'single' } });
    };
    /* fnClearXviewBrush — 조회 조건(app 필터/조회모드/기간)이 바뀌면 화면에 남아있는
     * 이전 박스 드래그 선택 영역을 지운다(데이터가 바뀌었는데 옛 영역 표시가 남는 것 방지) */
    const fnClearXviewBrush = () => {
      if (!xviewChartInst) return;
      xviewChartInst.dispatchAction({ type: 'brush', command: 'clear', areas: [] });
    };

    /* postMessage 로 넘길 팝업 origin (window.pageUrl 결과 기준) — 수신측 검증용 */
    const XVIEW_POP_ORIGIN = window.location.origin;
    let xviewPopupWin = null;

    /* 팝업이 로드 완료 후 'xview-ready' 를 보내오면 그 시점에 실 데이터를 postMessage 로 전달
     * (window.open URL 에는 아무 데이터도 싣지 않으므로 선택 건수 제한이 없음) */
    const _onXviewPopupMsg = (e) => {
      if (e.origin !== XVIEW_POP_ORIGIN || !e.data || e.data.type !== 'xview-ready') return;
      if (!xviewPopupWin || e.source !== xviewPopupWin) return;
      xviewPopupWin.postMessage({ type: 'xview-data', rows: xviewPendingRows }, XVIEW_POP_ORIGIN);
    };
    let xviewPendingRows = [];

    /* fnToPopupRow — 원본 xviewData 포인트 → 팝업 표시용 row 변환 */
    const fnToPopupRow = (p) => {
      const d = new Date(p.t);
      const g = fnPtGrade(p);
      return {
        time: d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'),
        rt: p.rt,
        status: g.label,
        statusColor: g.color,
        method: p.method || '',
        url: p.url || '',
        uiNm: p.uiNm || '',
        cmdNm: p.cmdNm || '',
        err: !!p.err,
        /* p 는 ref(xviewData) 내부의 반응형 Proxy — errorInfo 를 그대로 참조로 넘기면
         * postMessage(structured clone) 이 Proxy 를 clone 하지 못해 DataCloneError 발생.
         * 순수 객체로 재구성해서 전달. */
        errorInfo: (p.err && p.errorInfo)
          ? { httpStatus: p.errorInfo.httpStatus, errorCode: p.errorInfo.errorCode, message: p.errorInfo.message, stackTrace: p.errorInfo.stackTrace }
          : null,
        fileNm: p.fileNm || '', funcNm: p.funcNm || '', lineNo: p.lineNo || '',
        traceId: p.traceId || '', siteId: p.siteId || '', buyerId: p.buyerId || '',
        licenseCode: p.licenseCode || '', userAgent: p.userAgent || '', authToken: p.authToken || '',
        appNm: p.appNm || '', serverIp: p.serverIp || '', podNm: p.podNm || '',
      };
    };

    /* fnOpenXviewPopup — 트랜잭션 배열을 박스 선택 목록 팝업(postMessage)으로 전달
     * 선택 건수가 MAX_POPUP_ROWS 초과 시 응답시간 상위 N건만 표시 + toast 안내(팝업 렌더링 부하 방지) */
    const fnOpenXviewPopup = (points) => {
      let selected = points.map(fnToPopupRow).sort((a,b) => b.rt - a.rt);
      if (!selected.length) return;
      if (selected.length > MAX_POPUP_ROWS) {
        props.showToast(
          '선택한 트랜잭션이 ' + selected.length + '건으로 너무 많아 응답시간 상위 ' + MAX_POPUP_ROWS + '건만 표시합니다.',
          'warning',
        );
        selected = selected.slice(0, MAX_POPUP_ROWS);
      }
      xviewPendingRows = selected;
      xviewPopupWin = window.open(
        window.pageUrl('bo-dash-appMon-xviewReal-boxlist-pop.html'),
        'xviewBoxList', 'width=1248,height=816,resizable=yes,scrollbars=yes',
      );
    };

    const onXviewBrush = (params) => {
      /* brushSelected payload 구조: params.batch[0].selected[0].dataIndex 에
       * 선택된 scatter 포인트의 데이터 인덱스 배열이 담김. (params.areas 아님) */
      const batch = params.batch && params.batch[0];
      if (!batch) return;
      const sel = batch.selected && batch.selected[0];
      const idxList = sel && sel.dataIndex;
      if (!idxList || !idxList.length) return;
      /* cfOptXview 의 series.data 는 cfXviewFiltered(앱 필터 적용된 서브셋) 기준이므로
       * dataIndex 도 반드시 동일한 배열(cfXviewFiltered)에서 되찾아야 함 */
      fnOpenXviewPopup(idxList.map(i => cfXviewFiltered.value[i]).filter(Boolean));
    };

    /* onTopUrlClick / onRtTopClick — 호출량·응답시간 Top10 막대 클릭 시 해당 URL의
     * (각 항목이 표시 중인) 선택 기간 트랜잭션 전체를 박스 선택과 동일한 팝업으로 표시 */
    const onTopUrlClick = (params) => {
      const url = params && params.name;
      if (!url) return;
      const from = Date.now() - topUrlRange.value;
      fnOpenXviewPopup(xviewData.value.filter(p => p.url === url && p.t >= from));
    };
    const onRtTopClick = (params) => {
      const url = params && params.name;
      if (!url) return;
      const from = Date.now() - rtTopRange.value;
      fnOpenXviewPopup(xviewData.value.filter(p => p.url === url && p.t >= from));
    };

    /* ── 호출량 Top10 (URL 집계, 선택 기간 필터) option ─────────────────────────── */
    const cfOptTopUrl = computed(() => {
      const from = Date.now() - topUrlRange.value;
      const cnt = {};
      xviewData.value.forEach(p => { if (p.t >= from) cnt[p.url] = (cnt[p.url] || 0) + 1; });
      const top = Object.entries(cnt).sort((a,b) => b[1]-a[1]).slice(0, 10).reverse();
      return {
        tooltip: {
          trigger:'axis', axisPointer:{ type:'shadow' },
          formatter: p => { const d = p[0]; const tag = fnUrlUiTag(d.name); return d.name + (tag ? '<br/>' + tag : '') + '<br/>호출건수: <b>' + d.value + '</b>'; },
        },
        grid: { top:8, right:24, bottom:24, left:200 },
        xAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' }, splitLine:{ lineStyle:{ color:'#f0f0f0' } } },
        yAxis: {
          type:'category', data: top.map(t => t[0]), axisLabel:{
            fontSize:9.5, color:'#666', fontFamily:'monospace',
            /* URL 왼쪽에 method(GET/POST) 표시 */
            formatter: url => (fnUrlMethod(url) ? '[' + fnUrlMethod(url) + '] ' : '') + url,
          },
        },
        series: [{
          type:'bar', data: top.map(t => t[1]), itemStyle:{ color:'#6366f1', borderRadius:[0,4,4,0] }, barMaxWidth: 16,
          /* 막대 안(좌측)에 "uiNm > cmdNm" 표시 (x-ui-nm/x-cmd-nm 정보) */
          label: { show:true, position:'insideLeft', fontSize:9.5, color:'#fff', fontWeight:700, formatter: p => fnUrlUiTag(top[p.dataIndex][0]) },
        }],
      };
    });

    /* ── 응답시간 Top10 (URL별 평균 응답시간, 선택 기간 필터) option ─────────────────────────── */
    const cfOptRtTop = computed(() => {
      const from = Date.now() - rtTopRange.value;
      const sums = {};
      xviewData.value.forEach(p => {
        if (p.t < from) return;
        if (!sums[p.url]) sums[p.url] = { sum: 0, cnt: 0 };
        sums[p.url].sum += p.rt;
        sums[p.url].cnt += 1;
      });
      const top = Object.entries(sums)
        .map(([url, v]) => [url, Math.round(v.sum / v.cnt)])
        .sort((a,b) => b[1]-a[1]).slice(0, 10).reverse();
      return {
        tooltip: {
          trigger:'axis', axisPointer:{ type:'shadow' },
          formatter: p => { const d = p[0]; const tag = fnUrlUiTag(d.name); return d.name + (tag ? '<br/>' + tag : '') + '<br/>평균 응답시간: <b>' + d.value + 'ms</b> (' + fnRtGrade(d.value).label + ')'; },
        },
        grid: { top:8, right:24, bottom:24, left:200 },
        xAxis: { type:'value', name:'ms', nameTextStyle:{ fontSize:10, color:'#888' }, axisLabel:{ fontSize:10, color:'#888' }, splitLine:{ lineStyle:{ color:'#f0f0f0' } } },
        yAxis: {
          type:'category', data: top.map(t => t[0]), axisLabel:{
            fontSize:9.5, color:'#666', fontFamily:'monospace',
            /* URL 왼쪽에 method(GET/POST) 표시 */
            formatter: url => (fnUrlMethod(url) ? '[' + fnUrlMethod(url) + '] ' : '') + url,
          },
        },
        series: [{
          type:'bar', data: top.map(t => t[1]),
          itemStyle: { color: p => fnRtGrade(p.value).color, borderRadius:[0,4,4,0] },
          barMaxWidth: 16,
          /* 막대 안(좌측)에 "uiNm > cmdNm" 표시 (x-ui-nm/x-cmd-nm 정보) */
          label: { show:true, position:'insideLeft', fontSize:9.5, color:'#fff', fontWeight:700, formatter: p => fnUrlUiTag(top[p.dataIndex][0]) },
        }],
      };
    });

    /* ── 응답시간 추이(10초 버킷 평균/최대) option ─────────────────────────── */
    const cfOptRtTrend = computed(() => {
      const now = Date.now();
      const bucketMs = 10 * 1000;
      const from = now - 10 * 60 * 1000;
      const buckets = {};
      xviewData.value.forEach(p => {
        const b = Math.floor(p.t / bucketMs) * bucketMs;
        if (!buckets[b]) buckets[b] = [];
        buckets[b].push(p.rt);
      });
      const keys = Object.keys(buckets).map(Number).sort((a,b) => a-b);
      const avgData = keys.map(k => [k, Math.round(buckets[k].reduce((s,v)=>s+v,0) / buckets[k].length)]);
      const maxData = keys.map(k => [k, Math.max(...buckets[k])]);
      return {
        tooltip: { trigger:'axis' },
        legend: { data:['평균','최대'], top:0, textStyle:{ fontSize:10 } },
        grid: { top:28, right:24, bottom:28, left:56 },
        xAxis: {
          type:'time', min: from, max: now,
          axisLabel: { fontSize:10, color:'#888', formatter: v => { const d = new Date(v); return d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0'); } },
          splitLine: { show:false },
        },
        yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => v+'ms' }, splitLine:{ lineStyle:{ color:'#f0f0f0' } } },
        series: [
          { name:'평균', type:'line', data: avgData, smooth:true, showSymbol:false, lineStyle:{ color:'#3b82f6', width:2 } },
          { name:'최대', type:'line', data: maxData, smooth:true, showSymbol:false, lineStyle:{ color:'#ef4444', width:1.5, type:'dashed' } },
        ],
      };
    });

    /* ── 상태 분포 파이 option (좋음/보통/경고/오류 4단계 등급) ─────────────────────────── */
    const cfOptStatusPie = computed(() => {
      const cnt = [0, 0, 0, 0];
      xviewData.value.forEach(p => { cnt[fnPtGradeIdx(p)]++; });
      return {
        tooltip: { trigger:'item', formatter: p => p.name + ': ' + p.value + '건 (' + p.percent + '%)' },
        legend: { orient:'vertical', right:8, top:'center', textStyle:{ fontSize:10 } },
        series: [{
          type:'pie', radius:['40%','68%'], center:['38%','50%'],
          data: PT_GRADES.map((g, i) => ({ name: g.label, value: cnt[i], itemStyle:{ color: g.color } })),
          label:{ show:false },
          emphasis:{ label:{ show:true, fontSize:11 } },
        }],
      };
    });


    const attrsGridColumns = [
      { key: 'k', label: '속성', style: 'width:38%;', cellStyle: 'color:#7dd3fc;font-size:10.5px;white-space:nowrap;font-weight:700;' },
      { key: 'v', label: '값',   style: 'width:28%;', cellStyle: 'color:#fbbf24;font-size:10.5px;white-space:nowrap;' },
      { key: 'd', label: '설명', cellStyle: 'color:#cdd6f4;font-size:10.5px;' },
    ];

    /* ##### [04] 라이프사이클 #################################################### */

    /* initPage — 화면 로드 시퀀스. 마운트 시 실행한다. */
    const initPage = async () => {
      document.addEventListener('click', _onDocClick);
      window.addEventListener('message', _onXviewPopupMsg);
      xviewTimer = setInterval(() => {
        const now = Date.now();
        xviewData.value = [...xviewData.value.filter(p => p.t > now - MAX_RANGE_MS), _buildPoint(now)];
      }, 2000);
    };
    onMounted(initPage);

    onUnmounted(() => {
      if (xviewTimer) clearInterval(xviewTimer);
      document.removeEventListener('click', _onDocClick);
      window.removeEventListener('message', _onXviewPopupMsg);
    });

    /* ##### [05] return (템플릿 노출) ############################################## */

    return {
      uiState, attrsGridColumns, cfXviewSample,
      XVIEW_RANGE_OPTS, xviewMode, xviewRange, fnSetXviewMode, fnSetXviewRange,
      XVIEW_APP_TABS, xviewAppFilter, fnSetXviewAppFilter,
      xviewRangeStart, xviewRangeEnd, HOUR_OPTS, MIN_OPTS, cfXviewRangeSelectValue, fnApplyXviewDtRange,
      RANGE_OPTS, topUrlRange, rtTopRange, cfTopUrlRangeLabel, cfRtTopRangeLabel,
      cfOptXview, cfOptTopUrl, cfOptRtTop, cfOptRtTrend, cfOptStatusPie,
      onXviewBrush, fnXviewChartReady, onTopUrlClick, onRtTopClick, fnOpenInfo, fnInfoTab,
      handleBtnAction,
    };
  },
  template: /* html */`
<bo-page title="App모니터대시보드"
  desc-summary="API 트랜잭션 응답시간·호출량·에러율을 실시간으로 모니터링합니다.">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">

    <!-- 1) X-View 실시간 히트맵 -->
    <bo-container card-style="padding:14px;" style="grid-column:1/-1;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'X-View 히트맵',()=>cfOptXview,cfXviewSample,'XVIEW')" title="항목 정보">🔥</button>
        X-View 실시간 트랜잭션 히트맵
        <span v-if="xviewMode==='recent'" style="font-size:10px;font-weight:400;color:#10b981;background:#f0fdf4;padding:2px 8px;border-radius:10px;border:1px solid #bbf7d0;">● LIVE</span>
        <span v-else style="font-size:10px;font-weight:400;color:#b45309;background:#fffbeb;padding:2px 8px;border-radius:10px;border:1px solid #fde68a;">⏸ 기간고정</span>

        <div style="display:flex;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <button
            @click="fnSetXviewMode('recent')"
            :style="{ padding:'3px 10px', fontSize:'11px', fontWeight:700, border:'none', cursor:'pointer',
              background: xviewMode==='recent' ? '#e8587a' : '#fafbfc', color: xviewMode==='recent' ? '#fff' : '#666' }">최근조회</button>
          <button
            @click="fnSetXviewMode('range')"
            :style="{ padding:'3px 10px', fontSize:'11px', fontWeight:700, border:'none', cursor:'pointer',
              background: xviewMode==='range' ? '#e8587a' : '#fafbfc', color: xviewMode==='range' ? '#fff' : '#666' }">기간조회</button>
        </div>
        <select :value="cfXviewRangeSelectValue" @change="fnSetXviewRange($event.target.value)" class="form-control" style="width:auto;font-size:11px;padding:2px 6px;height:24px;">
          <option v-for="o in XVIEW_RANGE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
          <option v-if="xviewMode==='range'" value="custom" disabled>직접입력</option>
        </select>

        <!-- 기간조회 모드: [일][시][분] ~ [일][시][분] 절대 구간 지정 (24시간제, 날짜=date input + 시분=select) -->
        <div v-if="xviewMode==='range'" style="display:flex;align-items:center;gap:4px;">
          <input type="date" v-model="xviewRangeStart.date" class="form-control" style="font-size:11px;padding:2px 4px;height:24px;width:118px;" />
          <select v-model.number="xviewRangeStart.hour" class="form-control" style="font-size:11px;padding:2px 2px;height:24px;width:50px;">
            <option v-for="h in HOUR_OPTS" :key="h" :value="h">{{ String(h).padStart(2,'0') }}</option>
          </select>
          <span style="color:#999;">:</span>
          <select v-model.number="xviewRangeStart.min" @change="fnApplyXviewDtRange" class="form-control" style="font-size:11px;padding:2px 2px;height:24px;width:50px;">
            <option v-for="m in MIN_OPTS" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
          </select>
          <span style="color:#999;font-size:11px;">~</span>
          <input type="date" v-model="xviewRangeEnd.date" class="form-control" style="font-size:11px;padding:2px 4px;height:24px;width:118px;" />
          <select v-model.number="xviewRangeEnd.hour" class="form-control" style="font-size:11px;padding:2px 2px;height:24px;width:50px;">
            <option v-for="h in HOUR_OPTS" :key="h" :value="h">{{ String(h).padStart(2,'0') }}</option>
          </select>
          <span style="color:#999;">:</span>
          <select v-model.number="xviewRangeEnd.min" @change="fnApplyXviewDtRange" class="form-control" style="font-size:11px;padding:2px 2px;height:24px;width:50px;">
            <option v-for="m in MIN_OPTS" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
          </select>
          <button class="btn btn_search" style="font-size:11px;padding:3px 10px;height:24px;" @click="fnApplyXviewDtRange">적용</button>
        </div>

        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">박스 드래그 → 트랜잭션 목록 새창 · ✕ 표시 = 오류</span>
        <span style="font-size:10px;color:#888;">━ ━ 1500ms 경고</span>
      </div>

      <!-- 앱(서비스) 필터 탭 — 전체 | app1 | app2 | ... (여러 app 시나리오 대응) -->
      <div v-if="XVIEW_APP_TABS.length > 2" style="display:flex;align-items:center;gap:4px;margin-bottom:8px;">
        <span style="font-size:10px;color:#888;margin-right:2px;">app</span>
        <button v-for="a in XVIEW_APP_TABS" :key="a"
          @click="fnSetXviewAppFilter(a)"
          :style="{ padding:'3px 12px', fontSize:'11px', fontWeight:700, borderRadius:'12px', cursor:'pointer',
            border: xviewAppFilter===a ? '1px solid #6366f1' : '1px solid #e5e7eb',
            background: xviewAppFilter===a ? '#eef2ff' : '#fafbfc',
            color: xviewAppFilter===a ? '#4338ca' : '#666' }">{{ a }}</button>
      </div>

      <co-echart :option="cfOptXview" height="360px" @brush-selected="onXviewBrush" @ready="fnXviewChartReady" />
    </bo-container>

    <!-- 2) 호출량 Top10 -->
    <bo-container card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'API 호출량 Top10',()=>cfOptTopUrl,null,'TOPURL')" title="항목 정보">📊</button>
        API 호출량 Top10
        <select v-model="topUrlRange" class="form-control" style="width:auto;font-size:11px;padding:2px 6px;height:24px;">
          <option v-for="o in RANGE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">최근 {{ cfTopUrlRangeLabel }}</span>
        <span style="font-size:10px;color:#888;">막대 클릭 → 트랜잭션 목록 새창</span>
      </div>
      <co-echart :option="cfOptTopUrl" height="260px" @click="onTopUrlClick" />
    </bo-container>

    <!-- 3) 응답시간 Top10 -->
    <bo-container card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'API 응답시간 Top10',()=>cfOptRtTop,null,'RTTOP')" title="항목 정보">⏱</button>
        API 응답시간 Top10
        <select v-model="rtTopRange" class="form-control" style="width:auto;font-size:11px;padding:2px 6px;height:24px;">
          <option v-for="o in RANGE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">최근 {{ cfRtTopRangeLabel }}</span>
        <span style="font-size:10px;color:#888;">🟢 좋음 &lt;500ms · 🔵 보통 &lt;1500ms · 🟠 경고 ≥1500ms</span>
        <span style="font-size:10px;color:#888;">막대 클릭 → 트랜잭션 목록 새창</span>
      </div>
      <co-echart :option="cfOptRtTop" height="260px" @click="onRtTopClick" />
    </bo-container>

    <!-- 4) 상태 분포 -->
    <bo-container card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'트랜잭션 상태 분포',()=>cfOptStatusPie,null,'STATUSPIE')" title="항목 정보">🟢</button>
        트랜잭션 상태 분포 (최근 10분)
      </div>
      <co-echart :option="cfOptStatusPie" height="220px" />
    </bo-container>

    <!-- 5) 응답시간 추이 -->
    <bo-container card-style="padding:14px;" style="grid-column:1/-1;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'응답시간 추이',()=>cfOptRtTrend,null,'RTTREND')" title="항목 정보">⏱</button>
        응답시간 추이 (10초 버킷 평균/최대)
      </div>
      <co-echart :option="cfOptRtTrend" height="220px" />
    </bo-container>

  </div>

  <!-- 항목 정보 팝오버 -->
  <teleport to="body">
    <div v-if="uiState.infoPanel"
      @click.stop
      :style="{position:'absolute',top:uiState.infoPanel.top+'px',left:uiState.infoPanel.left+'px',width:'560px',background:'#fff',borderRadius:'10px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',border:'1px solid #e5e7eb',zIndex:9999,fontFamily:'monospace',overflow:'hidden'}">
      <!-- 팝오버 헤더 -->
      <div style="display:flex;align-items:center;padding:10px 14px;background:linear-gradient(135deg,#1a1a2e,#2d2d44);color:#fff;gap:8px;">
        <span style="font-size:13px;font-weight:700;">🔍 {{ uiState.infoPanel.title }}</span>
        <span style="flex:1;"></span>
        <button @click="handleBtnAction('info-close')"
          style="background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <!-- 탭 바 (3탭) -->
      <div style="display:flex;border-bottom:1px solid #e5e7eb;background:#f8fafc;">
        <button @click="handleBtnAction('infoTab-set', 'src')"
          :style="{flex:1,padding:'7px 4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',borderBottom:uiState.infoPanel.tab==='src'?'2px solid #10b981':'2px solid transparent',color:uiState.infoPanel.tab==='src'?'#10b981':'#666',background:'transparent'}">
          📝 소스정보
        </button>
        <button @click="handleBtnAction('infoTab-set', 'opt')"
          :style="{flex:1,padding:'7px 4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',borderBottom:uiState.infoPanel.tab==='opt'?'2px solid #e8587a':'2px solid transparent',color:uiState.infoPanel.tab==='opt'?'#e8587a':'#666',background:'transparent'}">
          ⚙ ECharts Option
        </button>
        <button @click="handleBtnAction('infoTab-set', 'data')"
          :style="{flex:1,padding:'7px 4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',borderBottom:uiState.infoPanel.tab==='data'?'2px solid #3b82f6':'2px solid transparent',color:uiState.infoPanel.tab==='data'?'#3b82f6':'#666',background:'transparent'}">
          📊 원시 데이터
        </button>
      </div>
      <!-- 소스정보 탭 본문 -->
      <div v-if="uiState.infoPanel.tab==='src'" style="padding:14px 16px;font-size:11px;line-height:1.7;max-height:400px;overflow-y:auto;background:#fafbfc;display:flex;flex-direction:column;gap:12px;">
        <template v-if="uiState.infoPanel.src">
          <!-- API 섹션 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">API 엔드포인트</div>
            <div style="background:#1e1e2e;color:#7dd3fc;border-radius:6px;padding:8px 12px;font-size:11px;">{{ uiState.infoPanel.src.url }}</div>
          </div>
          <!-- 차트 유형 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">차트 유형</div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:#fff0f4;border:1px solid #fecdd3;border-radius:6px;padding:5px 12px;color:#e8587a;font-size:11px;font-weight:700;">
              📊 {{ uiState.infoPanel.src.chartType }}
            </div>
          </div>
          <!-- 데이터 필드 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">데이터 필드</div>
            <div style="background:#1e1e2e;color:#86efac;border-radius:6px;padding:8px 12px;font-size:10.5px;line-height:1.8;">{{ uiState.infoPanel.src.fields }}</div>
          </div>
          <!-- 설명 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">항목 설명</div>
            <div style="background:#f0fdf4;border-left:3px solid #10b981;border-radius:0 6px 6px 0;padding:8px 12px;color:#065f46;font-size:11px;line-height:1.7;font-family:sans-serif;">{{ uiState.infoPanel.src.desc }}</div>
          </div>
          <!-- 템플릿 마크업 -->
          <div v-if="uiState.infoPanel.src.tag">
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">템플릿 마크업</div>
            <div style="background:#1e1e2e;border-radius:6px;overflow:hidden;">
              <pre style="margin:0;padding:10px 14px;font-size:11px;line-height:1.7;color:#e2a7f0;white-space:pre;overflow-x:auto;">{{ uiState.infoPanel.src.tag }}</pre>
            </div>
            <!-- 속성 매핑 테이블 -->
            <div v-if="uiState.infoPanel.src.attrs" style="margin-top:8px;background:#1e1e2e;border-radius:6px;overflow:hidden;">
              <div style="padding:5px 12px;background:rgba(255,255,255,0.05);font-size:9.5px;font-weight:700;color:#888;letter-spacing:0.5px;text-transform:uppercase;">속성 매핑</div>
              <bo-grid bare :columns="attrsGridColumns" :rows="uiState.infoPanel.src.attrs" row-key="k" />
            </div>
          </div>
        </template>
        <div v-else style="color:#aaa;padding:20px;text-align:center;">소스정보가 없습니다.</div>
      </div>
      <!-- ECharts Option / 원시 데이터 탭 본문 -->
      <div v-if="uiState.infoPanel.tab==='opt' || uiState.infoPanel.tab==='data'" style="position:relative;">
        <pre :style="{margin:0,padding:'12px 14px',fontSize:'10.5px',lineHeight:'1.55',maxHeight:'360px',overflowY:'auto',overflowX:'auto',background:'#1e1e2e',color:'#cdd6f4',whiteSpace:'pre',tabSize:2}">{{ uiState.infoPanel.tab==='opt' ? uiState.infoPanel.optJson : uiState.infoPanel.dataJson }}</pre>
        <button @click="handleBtnAction('clipboard-copy', uiState.infoPanel.tab==='opt'?uiState.infoPanel.optJson:uiState.infoPanel.dataJson)"
          title="클립보드 복사"
          style="position:absolute;top:8px;right:10px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:#aaa;border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;">
          📋 복사
        </button>
      </div>
    </div>
  </teleport>

</bo-page>

<style>
.dash-info-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
  line-height: 1;
  border-radius: 4px;
  transition: transform 0.15s, background 0.15s;
  flex-shrink: 0;
}
.dash-info-btn:hover {
  transform: scale(1.25);
  background: rgba(232,88,122,0.10);
}
.dash-info-btn:active {
  transform: scale(0.95);
}
</style>
`,
};
