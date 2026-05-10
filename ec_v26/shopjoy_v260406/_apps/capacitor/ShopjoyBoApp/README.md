# ShopJoy BO App (Capacitor)

ShopJoy **관리자(운영자)용** 안드로이드/iOS 앱.
기존 `bo.html` 을 Capacitor WebView 로 래핑하여 모바일 앱으로 패키징한다.

## 진입 URL

| 환경 | URL |
|---|---|
| **local** | `http://10.0.2.2:5501/bo.html` (Android 에뮬레이터 → 호스트 PC localhost:5501) |
| **prod** | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` |

> Android 에뮬레이터에서 호스트 PC `127.0.0.1:5501` 접근 시 `10.0.2.2` 를 사용.
> iOS 시뮬레이터/실기기는 `127.0.0.1` 또는 PC LAN IP 로 변경 필요.

## 빠른 실행 (Android)

### local

```powershell
# 1) ShopJoy 웹 프로젝트에서 VS Code Live Server 시작 (포트 5501)
# 2) Android 에뮬레이터 부팅
# 3) 빌드 + 실행
cd _apps\ShopjoyBoApp
npm run android:local
```

### prod

```powershell
cd _apps\ShopjoyBoApp
npm run android:prod
```

## 빠른 실행 (iOS — macOS 전용)

```bash
cd _apps/ShopjoyBoApp
npm run ios:local       # 또는 ios:prod
```

## npm 스크립트

| 스크립트 | 동작 |
|---|---|
| `npm run config:local` | `capacitor.config.ts` 의 `server.url` 을 local 로 변경 |
| `npm run config:prod` | `capacitor.config.ts` 의 `server.url` 을 prod 로 변경 |
| `npm run sync:local` | config:local + `npx cap sync` |
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
ShopjoyBoApp/
├── android/                        # Android Studio 프로젝트 (생성됨)
├── ios/                            # Xcode 프로젝트 (생성됨, macOS 빌드 필요)
├── www/index.html                  # 부팅 fallback shell
├── scripts/set-env.js              # 환경별 server.url 자동 갱신
├── capacitor.config.ts             # ⚠️ AUTO-GENERATED 영역 — 직접 편집 금지
├── package.json
└── README.md
```

## 설치된 플러그인

- `@aparajita/capacitor-biometric-auth` — **생체인증 (지문/얼굴) — 관리자 빠른 로그인**
- `@capacitor/app` — 앱 라이프사이클
- `@capacitor/browser` — 인앱브라우저
- `@capacitor/device` — 기기 정보
- `@capacitor/haptics` — 진동
- `@capacitor/keyboard` — 키보드 이벤트
- `@capacitor/network` — 네트워크 상태
- `@capacitor/preferences` — 보안 스토리지
- `@capacitor/push-notifications` — FCM/APNs (관리자 알림)
- `@capacitor/splash-screen` — 스플래시 (다크 테마)
- `@capacitor/status-bar` — 상태바

## 디버깅

### Chrome DevTools (Android)

`chrome://inspect` → ShopJoy BO → inspect

### 네이티브 로그

```powershell
adb logcat | Select-String "Capacitor"
```

## 트러블슈팅

| 증상 | 해결 |
|---|---|
| local 에서 흰 화면 | Live Server 5501 포트 켜져 있는지 확인 |
| 로그인 토큰 유실 | `localStorage` → `@capacitor/preferences` 로 마이그레이션 필요 |
| 생체인증 실패 | 기기 설정에 지문/얼굴 등록 여부 확인 |

## 정책서 참조

- [`_doc/정책서-Capacitor/1.개발환경설정.md`](../../_doc/정책서-Capacitor/1.개발환경설정.md)
- [`_doc/정책서-Capacitor/2.개발하기.md`](../../_doc/정책서-Capacitor/2.개발하기.md)
- [`_doc/정책서-Capacitor/3.배포하기.md`](../../_doc/정책서-Capacitor/3.배포하기.md)
