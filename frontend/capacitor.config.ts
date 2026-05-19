import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ezorder.app',
  appName: 'EZOrder',
  webDir: 'out',         // Next.js static export directory

  server: {
    // In development: load from dev server instead of bundled files
    // Comment this out for production builds
    // url: 'http://192.168.x.x:3001',  // Replace with your local dev machine IP
    // cleartext: true,
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    // Set to false for production builds — only true in dev for Chrome DevTools remote debugging
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
  },

  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },

  plugins: {
    // Splash screen config (install @capacitor/splash-screen)
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#F4F5F7',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    // Status bar config (install @capacitor/status-bar)
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FFFFFF',
    },
  },
}

export default config
