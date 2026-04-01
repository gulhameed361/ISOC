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
      // CRITICAL: Set to false so the native iOS pop-up handles the login
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;