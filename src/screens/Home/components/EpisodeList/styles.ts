import { StyleSheet } from "react-native";

import ThemedStyleSheet from "@/src/utils/styles";

const useStyles = ThemedStyleSheet.create(({ theme }) => ({
  container: {
    marginTop: 32,
  },
  title: {
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.fontSecondaryColor,
  },
  list: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderColor,
    backgroundColor: theme.secondaryBackgroundColor,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.borderColor,
  },
  selectedRow: {
    backgroundColor: theme.highlightBackgroundColor,
  },
  pressedRow: {
    backgroundColor: theme.pressedBackgroundColor,
  },
  texts: {
    flex: 1,
  },
  day: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.fontColor,
  },
  selectedDay: {
    color: theme.primaryColor,
  },
  date: {
    marginTop: 2,
    fontSize: 13,
    color: theme.fontSecondaryColor,
  },
}));

export default useStyles;
