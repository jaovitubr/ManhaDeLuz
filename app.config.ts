import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Manhã de Luz",
  description: "Baixe e compartilhe o áudio da Manhã de Luz todos os dias com seus amigos e familiares.",
  githubUrl: "https://github.com/jaovitubr/ManhaDeLuz",
  slug: "ManhaDeLuz",
  version: "1.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "manhadeluz",
  userInterfaceStyle: "dark",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/b771c94d-df50-450d-8312-7fadc1585256",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.joaovitor.manhadeluz",
    versionCode: 7,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#120E0B",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-image",
    "expo-sharing",
    "expo-status-bar",
    [
      "expo-splash-screen",
      {
        image: "./assets/icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#120E0B",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "b771c94d-df50-450d-8312-7fadc1585256",
    },
  },
});
