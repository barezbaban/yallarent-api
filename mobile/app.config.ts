import { ExpoConfig, ConfigContext } from 'expo/config';

const API_URLS: Record<string, string> = {
  dev: 'https://strong-recreation-dev.up.railway.app/api',
  stage: 'https://strong-recreation-dev.up.railway.app/api',
  production: 'https://strong-recreation-dev.up.railway.app/api',
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.APP_ENV || 'production';
  const apiUrl = API_URLS[env] || API_URLS.production;

  return {
    ...config,
    name: env === 'production' ? 'YallaRent' : env === 'stage' ? 'YallaRent (Stage)' : `YallaRent (Dev)`,
    slug: 'yallarent',
    version: '1.1.0',
    orientation: 'portrait',
    scheme: 'yallarent',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      bundleIdentifier:
        env === 'production'
          ? 'com.yallarent.app'
          : `com.yallarent.app.${env}`,
    },
    android: {
      package:
        env === 'production'
          ? 'com.yallarent.app'
          : `com.yallarent.app.${env}`,
      adaptiveIcon: {
        backgroundColor: '#0F2B46',
      },
      googleServicesFile: './google-services.json',
    },
    web: {
      bundler: 'metro' as const,
    },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-splash-screen',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          sounds: [],
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow YallaRent to access your photos to send in chat.',
        },
      ],
      '@react-native-community/datetimepicker',
    ],
    splash: {
      backgroundColor: '#0F2B46',
      resizeMode: 'contain',
    },
    extra: {
      apiUrl,
      appEnv: env,
      router: {},
      eas: {
        projectId: '482bd870-c307-4125-b82a-64f565d49b68',
      },
    },
    owner: 'yallarent.dev',
  };
};
