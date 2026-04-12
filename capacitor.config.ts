import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surreyisoc.prayerroom',
  appName: 'ISOC Prayer Room',
  webDir: 'dist',
  server: {
    iosScheme: 'ionic',
    hostname: 'localhost',
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      // Must be false to use the Native iOS popup and SHA-1 fingerprint
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;