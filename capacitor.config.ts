import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surreyisoc.prayerroom',
  appName: 'ISOC Prayer Room',
  webDir: 'dist',
  server: {
    // Changed from 'ionic' to 'https' to allow CORS with Firebase Identity Toolkit
    iosScheme: 'https', 
    hostname: 'localhost',
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      // Set to true to allow the manual bridge in App.tsx to handle the token
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;