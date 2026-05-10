# ShopJoy BO App (React Native)

ShopJoy 관리자용 **React Native** 앱 (TypeScript + react-native-webview + 생체인증).

## 환경 파일

| 파일 | URL |
|---|---|
| `.env.local` | `http://10.0.2.2:5501/bo.html` |
| `.env.dev` | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` |
| `.env.prod` | `https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html` |

## 실행

```bash
cd _apps/reactNative/ShopjoyBoApp
npm install
cd ios && pod install && cd ..      # macOS only

npm start                            # Metro
npm run android:local
npm run android:dev
npm run android:prod
```
