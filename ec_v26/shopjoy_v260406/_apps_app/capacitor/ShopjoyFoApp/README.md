# ShopJoy FO App (Capacitor)

ShopJoy **사용자(고객)용** 안드로이드/iOS 앱.
기존 웹 페이지를 Capacitor WebView 로 래핑하여 모바일 앱으로 패키징한다.

## 진입 URL

| 환경 | URL |
|---|---|
| **local** | `http://10.0.2.2:5501` (Android 에뮬레이터 → 호스트 PC localhost:5501) |
| **prod** | `https://illeesam.netlify.app/mainframe#sj_index` |

> Android 에뮬레이터에서 호스트 PC `127.0.0.1:5501` 접근 시 `10.0.2.2` 를 사용.
> iOS 시뮬레이터/실기기는 `127.0.0.1` 또는 PC LAN IP 로 변경 필요.

## 빠른 실행 (Android)

### local (개발 PC Live Server 가리킴)

```powershell
# 1) ShopJoy 웹 프로젝트에서 VS Code Live Server 시작 (포트 5501)
# 2) Android 에뮬레이터 부팅 (Android Studio → AVD Manager)
# 3) 빌드 + 실행
cd _apps\ShopjoyFoApp
npm run android:local
```

### prod (Netlify 배포 가리킴)

```powershell
cd _apps\ShopjoyFoApp
npm run android:prod
```

## 빠른 실행 (iOS — macOS 전용)

```bash
cd _apps/ShopjoyFoApp
npm run ios:local       # 또는 ios:prod
```

> Windows 에서는 iOS 빌드 불가. 별도 macOS 머신/CI 필요.

## npm 스크립트

| 스크립트 | 동작 |
|---|---|
| `npm run config:local` | `capacitor.config.ts` 의 `server.url` 을 local 로 변경 |
| `npm run config:prod` | `capacitor.config.ts` 의 `server.url` 을 prod 로 변경 |
| `npm run sync:local` | config:local + `npx cap sync` (네이티브 프로젝트 반영) |
| `npm run sync:prod` | config:prod + `npx cap sync` |
| `npm run android:local` | sync:local + 안드로이드 빌드/실행 |
| `npm run android:prod` | sync:prod + 안드로이드 빌드/실행 |
| `npm run ios:local` | sync:local + iOS 빌드/실행 (macOS) |
| `npm run ios:prod` | sync:prod + iOS 빌드/실행 (macOS) |
| `npm run open:android` | Android Studio 열기 |
| `npm run open:ios` | Xcode 열기 (macOS) |
| `npm run doctor` | Capacitor 환경 진단 |

## 디렉토리 구조

```
ShopjoyFoApp/
├── android/                        # Android Studio 프로젝트 (생성됨)
├── ios/                            # Xcode 프로젝트 (생성됨, macOS 빌드 필요)
├── www/index.html                  # 부팅 fallback shell (server.url 로드 전 표시)
├── scripts/set-env.js              # 환경별 server.url 자동 갱신
├── capacitor.config.ts             # ⚠️ AUTO-GENERATED 영역 — 직접 편집 금지
├── package.json
└── README.md                       # 이 파일
```

## 디버깅

### Chrome DevTools (Android)

1. 에뮬레이터/실기기에서 앱 실행 중
2. 데스크톱 Chrome → `chrome://inspect`
3. **Remote Target** → ShopJoy → **inspect**

### Safari Web Inspector (iOS)

1. 시뮬레이터/실기기에서 앱 실행 중
2. Safari → 개발자용 메뉴 → [기기명] → ShopJoy

### 네이티브 로그

```powershell
adb logcat | Select-String "Capacitor"
```

## 설치된 플러그인

- `@capacitor/app` — 앱 라이프사이클, 딥링크
- `@capacitor/browser` — 인앱브라우저 (카카오/토스 결제창)
- `@capacitor/device` — 기기 정보 (FCM 토큰 등록 시)
- `@capacitor/haptics` — 진동
- `@capacitor/keyboard` — 키보드 이벤트
- `@capacitor/network` — 네트워크 상태
- `@capacitor/preferences` — 보안 스토리지 (localStorage 대체)
- `@capacitor/push-notifications` — FCM/APNs 푸시
- `@capacitor/splash-screen` — 스플래시
- `@capacitor/status-bar` — 상태바

## 트러블슈팅

| 증상 | 해결 |
|---|---|
| local 에서 흰 화면 | Live Server 5501 포트 켜져 있는지, 방화벽 허용 확인 |
| Android 에뮬레이터에서 localhost 접근 안됨 | `10.0.2.2` 사용 (config:local 이 자동 설정) |
| iOS 시뮬레이터에서 `10.0.2.2` 접근 안됨 | `capacitor.config.ts` 의 url 을 `http://127.0.0.1:5501` 로 수정 후 sync |
| 실기기 (USB) 에서 PC localhost 접근 안됨 | PC LAN IP 사용 (예: `http://192.168.0.100:5501`), PC 와 같은 WiFi |
| HTTP 차단 (Android 9+) | `cleartext: true` (config:local 이 자동 설정), prod 는 HTTPS 사용 |
| `npx cap sync` 후 변경 미반영 | Android Studio → Build → Clean Project |

## 정책서 참조

- [`_doc/정책서-Capacitor/1.개발환경설정.md`](../../_doc/정책서-Capacitor/1.개발환경설정.md)
- [`_doc/정책서-Capacitor/2.개발하기.md`](../../_doc/정책서-Capacitor/2.개발하기.md)
- [`_doc/정책서-Capacitor/3.배포하기.md`](../../_doc/정책서-Capacitor/3.배포하기.md)
