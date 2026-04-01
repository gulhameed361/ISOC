import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surreyisoc.prayerroom',
  appName: 'ISOC Prayer Room',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com'],
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      iosSpinnerStyle: "small",
      spinnerColor: "#999999"
    }
  },
};

export default config;