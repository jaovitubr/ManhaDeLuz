import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Text, View } from "react-native";

import useStyles from "./styles";
import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";

interface ScreenStatusProps {
  title: string;
  message?: string;
  isLoading?: boolean;
  onRetry?: () => void;
}

export default function ScreenStatus({ title, message, isLoading = false, onRetry }: ScreenStatusProps) {
  const styles = useStyles();

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite">
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.primaryColor}
        />
      ) : (
        <View style={styles.icon}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={theme.primaryColor}
          />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {onRetry && (
        <Button
          text="Tentar novamente"
          icon="refresh"
          onPress={onRetry}
          style={styles.button}
        />
      )}
    </View>
  );
}
