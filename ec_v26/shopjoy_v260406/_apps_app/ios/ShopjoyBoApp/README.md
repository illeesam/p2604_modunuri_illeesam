# ShopJoy BO App (iOS Native)

ShopJoy 관리자용 **순수 네이티브 iOS** 앱 (Swift + WKWebView + LocalAuthentication).

## 환경별 빌드 (Xcode Scheme)

| Scheme | URL | Bundle ID |
|---|---|---|
| **ShopjoyBoApp-Local** | `http://127.0.0.1:5501/bo.html` | `com.shopjoy.bo.local` |
| **ShopjoyBoApp-Dev** | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` | `com.shopjoy.bo.dev` |
| **ShopjoyBoApp-Prod** | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` | `com.shopjoy.bo` |

## 사용

```bash
brew install xcodegen
cd _apps/ios/ShopjoyBoApp
xcodegen generate
open ShopjoyBoApp.xcodeproj
```
