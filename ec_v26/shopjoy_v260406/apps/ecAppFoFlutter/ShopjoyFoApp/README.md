# ShopJoy FO App (Flutter)

ShopJoy 사용자(고객)용 **Flutter** 앱 (Dart + webview_flutter).

## 환경 분기 (Dart Define + dotenv)

| 환경 | URL | 실행 |
|---|---|---|
| **local** | `http://10.0.2.2:5501` | `flutter run --dart-define=APP_ENV=local` |
| **dev** | `https://illeesam.netlify.app/mainframe#sj_index` | `flutter run --dart-define=APP_ENV=dev` |
| **prod** | `https://illeesam.netlify.app/mainframe#sj_index` | `flutter run --dart-define=APP_ENV=prod` |

`APP_ENV` 값에 따라 `.env.{local|dev|prod}` 파일이 자동 로드됨 (`lib/env.dart`).

## 사전 준비 (1회)

```bash
flutter --version            # 3.22+ 권장
cd _apps/flutter/ShopjoyFoApp
flutter create .             # android/ ios/ 등 자동 생성 (이미 있으면 skip)
flutter pub get
```

## 실행

```bash
# local (안드로이드 에뮬레이터 + 호스트 PC Live Server :5501)
flutter run --dart-define=APP_ENV=local

# dev
flutter run --dart-define=APP_ENV=dev

# prod
flutter run --dart-define=APP_ENV=prod

# 릴리즈 빌드 (APK)
flutter build apk --release --dart-define=APP_ENV=prod

# 릴리즈 빌드 (AAB - Play Store)
flutter build appbundle --release --dart-define=APP_ENV=prod

# iOS (macOS only)
flutter build ipa --release --dart-define=APP_ENV=prod
```

## 디렉토리

```
ShopjoyFoApp/
├── pubspec.yaml
├── analysis_options.yaml
├── lib/
│   ├── main.dart                # 앱 진입점
│   ├── env.dart                 # 환경 분기
│   └── webview_screen.dart      # WebView + 딥링크 + 외부앱 위임
├── .env.local / .env.dev / .env.prod
├── android/                     # flutter create 가 자동 생성
└── ios/                         # flutter create 가 자동 생성 (macOS)
```

## 추가 설정

### Android — applicationId 환경별 분리 (선택)

`android/app/build.gradle`:

```gradle
android {
    flavorDimensions "env"
    productFlavors {
        local { dimension "env"; applicationIdSuffix ".local" }
        dev   { dimension "env"; applicationIdSuffix ".dev" }
        prod  { dimension "env" }
    }
}
```

### iOS — Bundle ID 환경별 분리 (선택)

Xcode 에서 Configuration → Build Settings → `PRODUCT_BUNDLE_IDENTIFIER` 환경별 설정.

### 딥링크 등록

- Android: `android/app/src/main/AndroidManifest.xml` 의 `<intent-filter>` 에 `shopjoy-fo://` scheme 추가
- iOS: `ios/Runner/Info.plist` 의 `CFBundleURLTypes` 에 `shopjoy-fo` scheme 추가
