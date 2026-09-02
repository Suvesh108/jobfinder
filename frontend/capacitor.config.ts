import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobfinder.app',
  appName: 'JobFinder',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
