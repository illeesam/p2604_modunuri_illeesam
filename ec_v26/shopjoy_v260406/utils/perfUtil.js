/**
 * 성능 모니터링 유틸리티
 * 초기 로딩 시간, 페이지 렌더링 시간 등을 측정합니다.
 */
window.perfUtil = {
  /**
   * 성능 측정 시작점 기록
   */
  marks: {},

  /**
   * 측정 시작
   * @param {string} label - 측정 라벨
   */
  start(label) {
    this.marks[label] = performance.now();
  },

  /**
   * 측정 종료 및 결과 반환
   * @param {string} label - 측정 라벨
   * @param {boolean} log - 콘솔에 출력 여부
   * @returns {number} 경과 시간 (ms)
   */
  end(label, log = true) {
    if (!this.marks[label]) {
      console.warn(`[perfUtil] 시작점 없음: ${label}`);
      return 0;
    }
    const elapsed = performance.now() - this.marks[label];
    if (log) {
      this.logTime(label, elapsed);
    }
    delete this.marks[label];
    return elapsed;
  },

  /**
   * 측정 시간 출력
   * @param {string} label - 라벨
   * @param {number} ms - 경과 시간 (ms)
   */
  logTime(label, ms) {
    const color = ms < 500 ? '#52c41a' : ms < 1000 ? '#faad14' : '#ff4d4f';
    console.log(`%c⏱️ ${label}: ${ms.toFixed(2)}ms`, `color: ${color}; font-weight: bold;`);
  },

  /**
   * 네비게이션 타이밍 분석
   * @returns {object} 분석 결과
   */
  getNavigationTiming() {
    const perf = performance.getEntriesByType('navigation')[0] || {};
    return {
      dns: perf.domainLookupEnd - perf.domainLookupStart,
      tcp: perf.connectEnd - perf.connectStart,
      ttfb: perf.responseStart - perf.requestStart,
      domInteractive: perf.domInteractive - perf.fetchStart,
      domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
      loadComplete: perf.loadEventEnd - perf.fetchStart,
    };
  },

  /**
   * 초기 로딩 요약 출력
   */
  printInitialLoadSummary() {
    const timing = this.getNavigationTiming();
    console.group('%c📊 초기 로딩 성능 분석', 'font-size: 14px; font-weight: bold; color: #1677ff;');
    console.log(`DNS 조회: ${timing.dns.toFixed(0)}ms`);
    console.log(`TCP 연결: ${timing.tcp.toFixed(0)}ms`);
    console.log(`TTFB (응답대기): ${timing.ttfb.toFixed(0)}ms`);
    console.log(`DOM Interactive: ${timing.domInteractive.toFixed(0)}ms`);
    console.log(`DOM ContentLoaded: ${timing.domContentLoaded.toFixed(0)}ms`);
    console.log(`완전 로드: ${timing.loadComplete.toFixed(0)}ms`);
    console.groupEnd();

    // 섹션별 진단
    console.group('%c🔍 성능 진단', 'font-size: 14px; font-weight: bold; color: #722ed1;');
    if (timing.dns > 100) console.warn('⚠️ DNS 조회 느림 (100ms 초과)');
    if (timing.tcp > 200) console.warn('⚠️ TCP 연결 느림 (200ms 초과)');
    if (timing.ttfb > 500) console.warn('⚠️ TTFB 느림 - 서버 응답 시간 최적화 필요 (500ms 초과)');
    if (timing.domContentLoaded > 2000) console.warn('⚠️ DOM ContentLoaded 느림 (2s 초과)');
    if (timing.loadComplete > 3000) console.warn('⚠️ 완전 로드 느림 (3s 초과)');
    console.groupEnd();
  },

  /**
   * 리소스 로딩 시간 분석
   */
  getResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    let totalLoadTime = 0;

    // 마지막 리소스 완료 시간 계산 (리소스 로딩 완료 시간)
    if (resources.length > 0) {
      const lastResourceEnd = Math.max(...resources.map(r => (r.responseEnd || r.startTime) + (r.duration || 0)));
      totalLoadTime = lastResourceEnd;
    }

    // 가장 느린 리소스 3개
    const slowest = resources
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map(r => ({ name: r.name, duration: r.duration.toFixed(2) + 'ms' }));

    return { totalLoadTime, slowest };
  },

  /**
   * 리소스 로딩 분석 출력
   */
  printResourceAnalysis() {
    const analysis = this.getResourceTiming();

    console.group('%c📦 리소스 로딩', 'font-size: 14px; font-weight: bold; color: #13c2c2;');
    console.log(`%c완료 시간: ${analysis.totalLoadTime.toFixed(0)}ms`, 'color: #ff6b6b; font-weight: bold;');
    console.log(`%c가장 느린 리소스 (상위 3개)`, 'color: #faad14; font-weight: bold;');
    analysis.slowest.forEach((r, i) => {
      const pathOnly = r.name.split('?')[0].split('/').pop() || r.name;
      console.log(`  ${i + 1}. ${pathOnly} - ${r.duration}`);
    });
    console.groupEnd();
  },

  /**
   * 전체 성능 리포트 생성
   */
  generateReport() {
    console.clear();
    console.log('%c🚀 ShopJoy 성능 분석', 'font-size: 16px; font-weight: bold; color: #ff8c00;');
    this.printResourceAnalysis();
  },

  /**
   * Vue 마운트 시간 측정 (별도 호출)
   */
  recordVueMount() {
    const startTime = performance.now();
    return () => {
      const elapsed = performance.now() - startTime;
      this.logTime('Vue 앱 마운트', elapsed);
      return elapsed;
    };
  },
};

// 페이지 로드 완료 후 자동 분석 (개발 환경)
if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127')) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.perfUtil.generateReport();
    }, 1000);
  });
}
