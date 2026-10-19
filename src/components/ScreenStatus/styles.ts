import ThemedStyleSheet from "@/src/utils/styles";

const useStyles = ThemedStyleSheet.create(({ theme }) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.secondaryBackgroundColor,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: theme.fontColor,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: theme.fontSecondaryColor,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 8,
  },
}));

export default useStyles;
