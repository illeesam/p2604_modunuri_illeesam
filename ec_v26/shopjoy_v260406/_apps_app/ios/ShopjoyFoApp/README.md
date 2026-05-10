# ShopJoy FO App (iOS Native)

ShopJoy 사용자(고객)용 **순수 네이티브 iOS** 앱 (Swift + WKWebView).

## 환경별 빌드 (Xcode Scheme)

| Scheme | URL | Bundle ID |
|---|---|---|
| **ShopjoyFoApp-Local** | `http://127.0.0.1:5501` | `com.shopjoy.fo.local` |
| **ShopjoyFoApp-Dev** | `https://illeesam.netlify.app/mainframe#sj_index` | `com.shopjoy.fo.dev` |
| **ShopjoyFoApp-Prod** | `https://illeesam.netlify.app/mainframe#sj_index` | `com.shopjoy.fo` |

## 사전 준비 (macOS 만)

```bash
brew install xcodegen cocoapods
```

## 프로젝트 생성

`.xcodeproj` 는 git에 포함되지 않습니다. macOS에서 다음 명령으로 자동 생성:

```bash
cd _apps/ios/ShopjoyFoApp
xcodegen generate
open ShopjoyFoApp.xcodeproj
```

## 빌드 / 실행

```bash
# 시뮬레이터에서 실행
xcodebuild -project ShopjoyFoApp.xcodeproj \
  -scheme ShopjoyFoApp-Local \
  -configuration Debug-Local \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build

# Archive (App Store 제출용)
xcodebuild -project ShopjoyFoApp.xcodeproj \
  -scheme ShopjoyFoApp-Prod \
  -configuration Release-Prod \
  -archivePath build/ShopjoyFoApp.xcarchive \
  archive
```

또는 Xcode 에서 좌상단 Scheme 선택 → ▶ 실행.

## 디렉토리

```
ShopjoyFoApp/
├── project.yml                  # XcodeGen 스펙 (.xcodeproj 자동 생성 기반)
├── Brewfile                     # macOS 의존성
├── ShopjoyFoApp/
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── WebViewController.swift  # WKWebView + 딥링크 처리
│   ├── Info.plist
│   ├── LaunchScreen.storyboard
│   └── Assets.xcassets/
└── README.md
```
