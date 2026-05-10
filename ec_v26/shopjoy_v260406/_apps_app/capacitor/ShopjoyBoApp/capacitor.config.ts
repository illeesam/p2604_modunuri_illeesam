import { CapacitorConfig } from '@capacitor/cli';

/**
 * ShopJoy BO 앱 (관리자/운영자용) Capacitor 설정
 *
 * server.url 은 scripts/set-env.js 가 npm run config:local | config:prod 실행 시
 * 자동으로 갱신한다. 직접 편집하지 말 것.
 *
 * - local: http://127.0.0.1:5501/bo.html       (Live Server, BO bo.html)
 * - prod : https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html
 */
const config: CapacitorConfig = {
  appId: 'com.shopjoy.bo',
  appName: 'ShopJoy BO',
  webDir: 'www',
  server: {
    // !!! AUTO-GENERATED — do not edit by hand !!!
    url: 'http://10.0.2.2:5501/bo.html',
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1f2937',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
