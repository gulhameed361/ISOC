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
      skipNativeAuth: false, // Changed to false to allow the native iOS SDK to handle the handshake
      providers: ['google.com'],
    },
  },
};

export default config;