# ShopJoy BO App (Flutter)

ShopJoy 관리자용 **Flutter** 앱 (Dart + webview_flutter + 생체인증).

## 환경 분기

| 환경 | URL |
|---|---|
| **local** | `http://10.0.2.2:5501/bo.html` |
| **dev** | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` |
| **prod** | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` |

## 실행

```bash
cd _apps/flutter/ShopjoyBoApp
flutter create .
flutter pub get
flutter run --dart-define=APP_ENV=local
```
