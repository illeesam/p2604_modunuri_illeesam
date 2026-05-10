# ShopJoy BO App (Android Native)

ShopJoy 관리자용 **순수 네이티브 안드로이드** 앱 (Kotlin + WebView + 생체인증).

## 환경별 빌드 (Gradle Flavor)

| Flavor | URL | applicationId |
|---|---|---|
| **local** | `http://10.0.2.2:5501/bo.html` | `com.shopjoy.bo.local` |
| **dev** | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` | `com.shopjoy.bo.dev` |
| **prod** | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` | `com.shopjoy.bo` |

## 빌드 명령

```powershell
cd _apps\android\ShopjoyBoApp
.\gradlew assembleLocalDebug
.\gradlew assembleDevDebug
.\gradlew bundleProdRelease
```
