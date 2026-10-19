import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";

import { Theme, theme } from "@/src/constants/theme";

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

// Mesmo formato do POP (useStyles nos arquivos styles.ts). O app só tem o tema
// escuro, então os estilos são criados uma vez só.
function create<T extends NamedStyles<T>>(createStyles: (context: { theme: Theme }) => T) {
  const styles = StyleSheet.create(createStyles({ theme }));
  return () => styles;
}

const ThemedStyleSheet = { create };

export default ThemedStyleSheet;
