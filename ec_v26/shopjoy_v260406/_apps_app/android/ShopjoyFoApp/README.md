# ShopJoy FO App (Android Native)

ShopJoy 사용자(고객)용 **순수 네이티브 안드로이드** 앱 (Kotlin + WebView).

## 환경별 빌드 (Gradle Flavor)

| Flavor | URL | applicationId |
|---|---|---|
| **local** | `http://10.0.2.2:5501` | `com.shopjoy.fo.local` |
| **dev** | `https://illeesam.netlify.app/mainframe#sj_index` | `com.shopjoy.fo.dev` |
| **prod** | `https://illeesam.netlify.app/mainframe#sj_index` | `com.shopjoy.fo` |

## 빌드 명령

```powershell
cd _apps\android\ShopjoyFoApp

# Local APK
.\gradlew assembleLocalDebug

# Dev APK
.\gradlew assembleDevDebug

# Prod Release AAB
.\gradlew bundleProdRelease

# 실기기 설치
adb install -r app\build\outputs\apk\local\debug\app-local-debug.apk
```

## 설정 키 위치 (FCM / 카카오 활성화 시)

- `app/google-services.json` — Firebase
- `local.properties` 또는 환경변수 — 카카오 키
