import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surreyisoc.prayerroom',
  appName: 'ISOC Prayer Room',
  webDir: 'dist',
  // ADD THIS BLOCK BELOW:
  server: {
    iosScheme: 'capacitor',
    hostname: 'localhost',
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true, // Keep this true so your existing App.tsx logic works
      providers: ['google.com'],
    },
  },
};

export default config;