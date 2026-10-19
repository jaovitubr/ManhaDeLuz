import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ErrorBoundaryProps, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ScreenStatus from "@/src/components/ScreenStatus";
import { theme } from "@/src/constants/theme";

export default function RootLayout() {
  return (
    <Root>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: styles.content,
        }}
      />
    </Root>
  );
}

// Última barreira: se algum componente quebrar, mostra uma tela de recuperação
// em vez de fechar o app.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  console.error("Erro não tratado na interface:", error);

  return (
    <Root>
      <ScreenStatus
        title="Algo deu errado"
        message="O aplicativo encontrou um problema inesperado."
        onRetry={retry}
      />
    </Root>
  );
}

function Root({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" />
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none">
        <Image
          source={require("@/assets/bg.jpg")}
          style={[StyleSheet.absoluteFill, styles.background]}
          contentFit="cover"
          blurRadius={6}
        />
        <LinearGradient
          colors={["rgba(18, 14, 11, 0.35)", "rgba(18, 14, 11, 0.85)", theme.backgroundColor]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {children}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  background: {
    opacity: 0.55,
  },
  content: {
    backgroundColor: "transparent",
  },
});
