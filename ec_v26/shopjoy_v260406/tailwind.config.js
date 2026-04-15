/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Tailwind 설정 파일
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  ▣ 이 파일이 왜 필요한가?
 *    - Tailwind CLI(개발 PC의 Node.js)가 CSS를 빌드할 때 읽는 설정 파일입니다.
 *    - 브라우저는 이 파일을 읽지 않습니다. 순수하게 빌드 타임 도구용입니다.
 *    - `content` 배열에 나열된 파일들을 스캔하여 실제 사용된 Tailwind 클래스만
 *      `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css`에 출력합니다 (JIT - Just-In-Time 모드).
 *
 *  ▣ 빌드 방법 (터미널에서):
 *    npm install                                          (최초 1회)
 *    npm run dev         # 개발 중 watch 모드
 *    npm run build       # 배포 전 최종 빌드 (minify)
 *
 *  ▣ 커스텀 색상은 현재 CSS 변수(--accent 등)와 맞춘 값입니다.
 *    필요 시 여기서 브랜드 색상 팔레트를 추가 등록하세요.
 * ═══════════════════════════════════════════════════════════════════════════
 */
module.exports = {
  /* 스캔 대상: Tailwind 클래스가 쓰일 수 있는 모든 HTML/JS 파일 */
  content: [
    './index.html',
    './admin.html',
    './disp-front-ui.html',
    './disp-admin-ui.html',
    './base/**/*.js',
    './layout/**/*.js',
    './pages/**/*.js',
    './components/**/*.js',
    './utils/**/*.js',
  ],

  theme: {
    extend: {
      colors: {
        /* ShopJoy 브랜드 색상 (frontGlobalStyle01/02.css와 동기화) */
        brand: {
          pink:    '#e8587a',
          'pink-dark': '#d64669',
          'pink-light':'#fff0f4',
          mint:    '#4a9b7e',
          'mint-dark': '#2e7d6b',
          'mint-light':'#e0f2ec',
        },
      },
      fontFamily: {
        /* 기본 프로젝트 폰트와 일치 */
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },

  plugins: [],
};
